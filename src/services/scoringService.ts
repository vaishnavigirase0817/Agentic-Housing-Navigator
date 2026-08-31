import { Property, MissionRequirements, MatchEvaluation, ScoreFactorBreakdown } from '../types';

export const SCORING_WEIGHTS = {
  budget: 30,
  location: 25,
  propertyType: 15,
  bedrooms: 10,
  furnishing: 10,
  availability: 5,
  amenities: 5,
};

/**
 * Calculates a deterministic match score (0 - 100) along with transparent factor breakdowns
 * and clear factual reasons why a property matches or diverges from requirements.
 */
export function calculateMatchScore(property: Property, req: MissionRequirements): MatchEvaluation {
  const matchReasons: string[] = [];
  const drawbacks: string[] = [];

  // 1. Budget Score (Weight: 30)
  let budgetScore = 0;
  const maxB = req.maxBudget || 15000;
  if (property.monthlyRent <= maxB) {
    // Under budget: full score + scaling bonus
    const savings = maxB - property.monthlyRent;
    const savingsRatio = Math.min(savings / maxB, 0.4);
    budgetScore = Math.min(30, 27 + savingsRatio * 7.5);
    
    if (savings > 0) {
      matchReasons.push(`₹${savings.toLocaleString('en-IN')}/mo under maximum budget (₹${property.monthlyRent.toLocaleString('en-IN')} vs ₹${maxB.toLocaleString('en-IN')})`);
    } else {
      matchReasons.push(`Exactly matches maximum budget limit of ₹${maxB.toLocaleString('en-IN')}/mo`);
    }
  } else {
    // Over budget penalty
    const overage = property.monthlyRent - maxB;
    const overagePercent = (overage / maxB) * 100;
    if (overagePercent <= 10) {
      budgetScore = 18;
      drawbacks.push(`₹${overage.toLocaleString('en-IN')}/mo over budget (+${Math.round(overagePercent)}%)`);
    } else if (overagePercent <= 25) {
      budgetScore = 10;
      drawbacks.push(`₹${overage.toLocaleString('en-IN')}/mo above preferred budget`);
    } else {
      budgetScore = 2;
      drawbacks.push(`Substantially exceeds budget by ₹${overage.toLocaleString('en-IN')}/mo`);
    }
  }

  // 2. Location & Distance Score (Weight: 25)
  let locationScore = 0;
  const maxDist = req.maxDistanceKm || 3.0;
  if (property.distanceKm <= maxDist) {
    // Closer gets more points
    const proximityFactor = Math.max(0, 1 - (property.distanceKm / (maxDist * 1.2)));
    locationScore = Math.round(18 + proximityFactor * 7);
    matchReasons.push(`${property.distanceKm} km from target campus/location (limit: ≤ ${maxDist} km)`);
  } else {
    const extraDist = property.distanceKm - maxDist;
    if (extraDist <= 1.5) {
      locationScore = 12;
      drawbacks.push(`${property.distanceKm} km away (${extraDist.toFixed(1)} km beyond preferred distance)`);
    } else {
      locationScore = 4;
      drawbacks.push(`${property.distanceKm} km away from target area`);
    }
  }

  // 3. Property Type Score (Weight: 15)
  let typeScore = 0;
  const reqType = req.propertyType.toLowerCase();
  const propType = property.propertyType.toLowerCase();

  if (reqType === 'any' || reqType === '' || propType.includes(reqType) || reqType.includes(propType)) {
    typeScore = 15;
    matchReasons.push(`Matches property type: ${property.propertyType}`);
  } else if ((reqType.includes('apartment') || reqType.includes('2bhk')) && propType.includes('apartment')) {
    typeScore = 15;
    matchReasons.push(`Standard ${property.propertyType} layout`);
  } else {
    typeScore = 6;
    drawbacks.push(`Listed as ${property.propertyType} instead of ${req.propertyType}`);
  }

  // 4. Bedrooms Score (Weight: 10)
  let bedroomScore = 0;
  if (req.bedrooms === 'Any') {
    bedroomScore = 10;
    matchReasons.push(`${property.bedrooms} Bedroom configuration`);
  } else {
    const targetBhk = Number(req.bedrooms) || 2;
    if (property.bedrooms === targetBhk) {
      bedroomScore = 10;
      matchReasons.push(`Exact ${property.bedrooms}BHK layout as requested`);
    } else if (property.bedrooms > targetBhk) {
      bedroomScore = 7;
      matchReasons.push(`Offers ${property.bedrooms} Bedrooms (more space than ${targetBhk}BHK)`);
    } else {
      bedroomScore = 3;
      drawbacks.push(`${property.bedrooms} Bedroom (requested ${targetBhk}BHK)`);
    }
  }

  // 5. Furnishing Score (Weight: 10)
  let furnishingScore = 0;
  if (req.furnishing === 'Any' || req.furnishing === property.furnishing) {
    furnishingScore = 10;
    matchReasons.push(`${property.furnishing} unit`);
  } else if (req.furnishing === 'Furnished' && property.furnishing === 'Semi-Furnished') {
    furnishingScore = 6;
    drawbacks.push('Semi-Furnished (user requested Furnished)');
  } else if (req.furnishing === 'Furnished' && property.furnishing === 'Unfurnished') {
    furnishingScore = 2;
    drawbacks.push('Unfurnished (user requested Furnished)');
  } else {
    furnishingScore = 8;
  }

  // 6. Availability / Move-in Score (Weight: 5)
  let availabilityScore = 5;
  if (property.availableFrom) {
    matchReasons.push(`Available immediately / early next month (${property.availableFrom})`);
  }

  // 7. Amenities Score (Weight: 5)
  let amenitiesScore = 0;
  let matchedAmenityCount = 0;
  if (req.preferredAmenities && req.preferredAmenities.length > 0) {
    for (const am of req.preferredAmenities) {
      if (property.amenities.some(a => a.toLowerCase().includes(am.toLowerCase()))) {
        matchedAmenityCount++;
      }
    }
    const ratio = matchedAmenityCount / req.preferredAmenities.length;
    amenitiesScore = Math.round(ratio * 5);
    if (matchedAmenityCount > 0) {
      matchReasons.push(`Includes ${matchedAmenityCount} preferred amenities`);
    }
  } else {
    // General baseline
    amenitiesScore = Math.min(5, Math.round((property.amenities.length / 8) * 5));
    if (property.amenities.length >= 6) {
      matchReasons.push(`Well-equipped with ${property.amenities.length} amenities`);
    }
  }

  // Check special criteria (ground floor avoidance & parking)
  if (req.avoidGroundFloor && property.floor === 0) {
    drawbacks.push('Ground floor unit (user preference: avoid ground floor)');
    // Small penalty
    typeScore = Math.max(0, typeScore - 4);
  } else if (req.avoidGroundFloor && property.floor > 0) {
    matchReasons.push(`Floor ${property.floor} of ${property.totalFloors} (satisfies avoiding ground floor)`);
  }

  if (req.parkingRequired) {
    if (property.parking === 'Covered' || property.parking === 'Open') {
      matchReasons.push(`Dedicated ${property.parking.toLowerCase()} vehicle parking included`);
    } else {
      drawbacks.push('No four-wheeler car parking available');
    }
  }

  if (property.ownerVerified) {
    matchReasons.push('Verified owner listing (biometrics & registry confirmed)');
  }

  const rawTotal = budgetScore + locationScore + typeScore + bedroomScore + furnishingScore + availabilityScore + amenitiesScore;
  const totalScore = Math.min(100, Math.max(10, Math.round(rawTotal)));

  const breakdown: ScoreFactorBreakdown = {
    budgetScore: Math.round(budgetScore),
    locationScore: Math.round(locationScore),
    typeScore: Math.round(typeScore),
    bedroomScore: Math.round(bedroomScore),
    furnishingScore: Math.round(furnishingScore),
    availabilityScore: Math.round(availabilityScore),
    amenitiesScore: Math.round(amenitiesScore),
  };

  const isStrongMatch = totalScore >= 80;

  let affordabilityStatus: 'Optimal' | 'Stretch' | 'Under Budget' | 'Over Budget' = 'Optimal';
  if (property.monthlyRent < maxB * 0.9) {
    affordabilityStatus = 'Under Budget';
  } else if (property.monthlyRent <= maxB) {
    affordabilityStatus = 'Optimal';
  } else if (property.monthlyRent <= maxB * 1.15) {
    affordabilityStatus = 'Stretch';
  } else {
    affordabilityStatus = 'Over Budget';
  }

  return {
    totalScore,
    breakdown,
    matchReasons: matchReasons.slice(0, 5),
    drawbacks: drawbacks.slice(0, 3),
    isStrongMatch,
    affordabilityStatus
  };
}

/**
 * Calculates financial affordability estimates
 */
export function calculateAffordability(property: Property) {
  const monthlyHousingCost = property.monthlyRent + property.maintenance + property.estimatedUtilities;
  const initialMoveInCost = property.securityDeposit + property.monthlyRent + property.maintenance;
  
  return {
    monthlyRent: property.monthlyRent,
    maintenance: property.maintenance,
    estimatedUtilities: property.estimatedUtilities,
    monthlyHousingCost,
    securityDeposit: property.securityDeposit,
    initialMoveInCost
  };
}
