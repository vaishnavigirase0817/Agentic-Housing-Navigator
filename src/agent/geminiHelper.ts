import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from '@google/genai';

const DEFAULT_MODELS = [
  'gemini-3.7-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-3.1-flash-lite'
];

interface SafeGenerateOptions {
  contents: GenerateContentParameters['contents'];
  config?: GenerateContentParameters['config'];
  models?: string[];
  maxRetriesPerModel?: number;
}

interface SafeGenerateResult {
  text: string;
  response: GenerateContentResponse;
  modelUsed: string;
}

/**
 * Checks if an error is transient (e.g. 503 Spike in demand, 429 rate limit, network hiccup).
 */
function isTransientError(error: any): boolean {
  if (!error) return false;
  const msg = (error?.message || error?.status || JSON.stringify(error)).toLowerCase();
  const code = error?.code || error?.status;
  
  if (code === 503 || code === 429 || code === 500 || code === 504 || code === 'UNAVAILABLE' || code === 'RESOURCE_EXHAUSTED') {
    return true;
  }
  
  if (
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('try again later') ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('timeout') ||
    msg.includes('fetch failed') ||
    msg.includes('econnreset')
  ) {
    return true;
  }

  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executes a Gemini generateContent request with automatic exponential backoff
 * and multi-model fallback cascade.
 */
export async function safeGenerateContent(
  genAI: GoogleGenAI | null,
  options: SafeGenerateOptions
): Promise<SafeGenerateResult | null> {
  if (!genAI) return null;

  const modelsToTry = options.models && options.models.length > 0
    ? options.models
    : DEFAULT_MODELS;
  const maxRetries = options.maxRetriesPerModel ?? 2;

  for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
    const model = modelsToTry[mIdx];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response: GenerateContentResponse = await genAI.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        });

        const text = response.text || '';
        return {
          text,
          response,
          modelUsed: model
        };
      } catch (err: any) {
        const isTransient = isTransientError(err);
        const isLastAttemptForModel = attempt === maxRetries;
        const isLastModel = mIdx === modelsToTry.length - 1;

        if (isTransient && !isLastAttemptForModel) {
          const backoffTime = 500 * Math.pow(2, attempt) + Math.random() * 200;
          await delay(backoffTime);
          continue;
        }

        // If it's the last attempt for this model, proceed to the next fallback model in the cascade
        if (isLastAttemptForModel && !isLastModel) {
          break;
        }

        if (isLastModel && isLastAttemptForModel) {
          // All models and retries exhausted
          return null;
        }
      }
    }
  }

  return null;
}

/**
 * Safely parses JSON from Gemini output, handling potential markdown formatting.
 */
export function safeParseJson<T = any>(rawText: string, fallback: T): T {
  if (!rawText || !rawText.trim()) return fallback;

  try {
    let clean = rawText.trim();
    // Remove ```json ... ``` code blocks if present
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }
    return JSON.parse(clean) as T;
  } catch {
    return fallback;
  }
}
