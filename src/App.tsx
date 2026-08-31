import React, { useState, useEffect, useCallback } from 'react';
import { 
  AppRoute, 
  Mission, 
  Property, 
  MatchEvaluation, 
  AgentActivityEvent, 
  AppNotification, 
  MissionRequirements,
  UserProfile
} from './types';
import { Navigation } from './components/Navigation';
import { HackathonDemoBar } from './components/HackathonDemoBar';
import { SimulatedMatchAlertModal } from './components/SimulatedMatchAlertModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateMissionPage } from './pages/CreateMissionPage';
import { ActiveMissionPage } from './pages/ActiveMissionPage';
import { SearchPage } from './pages/SearchPage';
import { PropertyDetailsPage } from './pages/PropertyDetailsPage';
import { ShortlistPage } from './pages/ShortlistPage';
import { PreferencesPage } from './pages/PreferencesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/SettingsPage';

import { propertyService } from './services/propertyService';
import { missionService } from './services/missionService';
import { agentService } from './services/agentService';
import { notificationService } from './services/notificationService';
import { authService } from './services/authService';
import { calculateMatchScore } from './services/scoringService';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('landing');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Authentication & User Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(authService.getUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const [properties, setProperties] = useState<Property[]>([]);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [scores, setScores] = useState<Record<string, MatchEvaluation>>({});
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [recentActivity, setRecentActivity] = useState<AgentActivityEvent[]>([]);

  const [isSimulating, setIsSimulating] = useState(false);
  const [isLaunchingMission, setIsLaunchingMission] = useState(false);

  // Simulated Alert Modal State
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [simulatedProperty, setSimulatedProperty] = useState<Property | null>(null);
  const [simulatedEvaluation, setSimulatedEvaluation] = useState<MatchEvaluation | null>(null);

  // Subscribe to auth state updates
  useEffect(() => {
    const unsubscribe = authService.subscribe((session) => {
      setCurrentUser(session.user);
    });
    return unsubscribe;
  }, []);

  // Initial Data Load & Per-User Refresh
  const refreshAllData = useCallback(async () => {
    try {
      const [allProps, activeM, short, notifs, activity] = await Promise.all([
        propertyService.getAllProperties(),
        missionService.getActiveMission(),
        missionService.getShortlist(),
        notificationService.getNotifications(),
        agentService.getEvents()
      ]);

      setProperties(allProps);
      setActiveMission(activeM);
      setShortlist(short);
      setNotifications(notifs);
      setRecentActivity(activity);

      // Compute scores
      const sc: Record<string, MatchEvaluation> = {};
      const fallbackReq: MissionRequirements = activeM?.requirements || {
        rawQuery: 'Default student 2BHK mission',
        propertyType: 'Apartment',
        bedrooms: 2,
        maxBudget: 15000,
        minBudget: 8000,
        targetLocation: 'Near College Campus',
        maxDistanceKm: 3.0,
        furnishing: 'Furnished',
        moveInDate: 'Next month',
        preferredAmenities: ['Power Backup', 'Lift', 'Wi-Fi', '24/7 Security'],
        parkingRequired: true,
        preferredFloor: 'Avoid Ground',
        avoidGroundFloor: true,
        petFriendlyRequired: false
      };

      for (const p of allProps) {
        sc[p.id] = calculateMatchScore(p, fallbackReq);
      }
      setScores(sc);
    } catch (e) {
      console.error('Failed to load application data', e);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData, currentUser?.id]);

  // Navigate handler
  const handleNavigate = (route: AppRoute, propId?: string) => {
    if (propId) {
      setSelectedPropertyId(propId);
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // View property details
  const handleViewDetails = (propId: string) => {
    setSelectedPropertyId(propId);
    setCurrentRoute('property-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle Shortlist
  const handleToggleShortlist = async (propId: string) => {
    const updated = await missionService.toggleShortlist(propId);
    setShortlist(updated);
    const notifs = await notificationService.getNotifications();
    setNotifications(notifs);
    const act = await agentService.getEvents();
    setRecentActivity(act);
  };

  // Launch New Mission
  const handleLaunchMission = async (requirements: MissionRequirements) => {
    setIsLaunchingMission(true);
    try {
      const mission = await missionService.createAndExecuteMission(requirements);
      setActiveMission(mission);
      await refreshAllData();
      setCurrentRoute('active-mission');
    } catch (e) {
      console.error('Failed to execute mission', e);
    } finally {
      setIsLaunchingMission(false);
    }
  };

  // Reset Mission
  const handleResetMission = async () => {
    await missionService.resetMission();
    setActiveMission(null);
    await refreshAllData();
  };

  // Simulate Inbound Listing
  const handleSimulateListing = async () => {
    if (isSimulating) return;
    setIsSimulating(true);

    try {
      const currentM = activeMission || {
        id: 'mission-sim',
        title: '2BHK • ₹15,000 max • Near College Campus',
        status: 'MONITORING',
        createdAt: new Date().toISOString(),
        requirements: {
          rawQuery: 'Default mission',
          propertyType: 'Apartment',
          bedrooms: 2,
          maxBudget: 15000,
          minBudget: 8000,
          targetLocation: 'Near College Campus',
          maxDistanceKm: 3.0,
          furnishing: 'Furnished',
          moveInDate: 'Next month',
          preferredAmenities: ['Power Backup', 'Lift', 'Wi-Fi'],
          parkingRequired: true,
          preferredFloor: 'Avoid Ground',
          avoidGroundFloor: true,
          petFriendlyRequired: false
        },
        currentStageIndex: 7,
        stages: [],
        matchedPropertyIds: [],
        rankedScores: {},
        monitoring: {
          isActive: true,
          lastChecked: new Date().toISOString(),
          nextCheck: new Date(Date.now() + 15 * 60000).toISOString(),
          totalEvaluated: 32,
          newMatchesFound: 1,
          checkFrequencyMinutes: 15
        },
        shortlistedPropertyIds: [],
        dismissedPropertyIds: []
      };

      const result = await missionService.simulateNewListingCheck(currentM);

      // Refresh list
      const updatedProps = await propertyService.getAllProperties();
      setProperties(updatedProps);

      const sc = { ...scores };
      sc[result.newProperty.id] = result.evaluation;
      setScores(sc);

      const notifs = await notificationService.getNotifications();
      setNotifications(notifs);

      const act = await agentService.getEvents();
      setRecentActivity(act);

      // Open Modal Alert
      setSimulatedProperty(result.newProperty);
      setSimulatedEvaluation(result.evaluation);
      setSimModalOpen(true);
    } catch (e) {
      console.error('Simulation failed', e);
    } finally {
      setIsSimulating(false);
    }
  };

  // Notification Actions
  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    const notifs = await notificationService.getNotifications();
    setNotifications(notifs);
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    const notifs = await notificationService.getNotifications();
    setNotifications(notifs);
  };

  const handleClearAllNotifications = async () => {
    await notificationService.clearAll();
    setNotifications([]);
  };

  const handleClearActivityEvents = async () => {
    await agentService.clearEvents();
    setRecentActivity([]);
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Navigation Bars (Desktop Sidebar + Top Bar + Mobile Bar) */}
      <Navigation
        currentRoute={currentRoute}
        onRouteChange={(r) => handleNavigate(r)}
        missionStatus={activeMission?.status || 'IDLE'}
        hasActiveMission={Boolean(activeMission)}
        unreadNotifsCount={unreadNotifsCount}
        shortlistCount={shortlist.length}
        onSimulateListing={handleSimulateListing}
        isSimulating={isSimulating}
        currentUser={currentUser}
        onOpenProfileModal={() => setProfileModalOpen(true)}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
      />

      {/* Persistent Hackathon Demo Guide Strip on Desktop & Mobile */}
      <div className="lg:pl-64 pt-16">
        <HackathonDemoBar
          currentRoute={currentRoute}
          mission={activeMission}
          onNavigate={(r) => handleNavigate(r)}
          onTriggerBackgroundCheck={handleSimulateListing}
          isTriggeringBackground={isSimulating}
        />
      </div>

      {/* Main Content Viewport */}
      <main
        id="app-main-content"
        className="flex-1 pt-6 pb-20 lg:pb-12 px-4 sm:px-6 lg:pl-72 lg:pr-8 max-w-7xl mx-auto w-full transition-all"
      >
        {currentRoute === 'landing' && (
          <LandingPage onNavigate={handleNavigate} activeMission={activeMission} />
        )}

        {currentRoute === 'dashboard' && (
          <DashboardPage
            onNavigate={handleNavigate}
            activeMission={activeMission}
            properties={properties}
            scores={scores}
            shortlist={shortlist}
            onToggleShortlist={handleToggleShortlist}
            onViewDetails={handleViewDetails}
            recentActivity={recentActivity}
            onSimulateListing={handleSimulateListing}
            isSimulating={isSimulating}
          />
        )}

        {currentRoute === 'create-mission' && (
          <CreateMissionPage
            onNavigate={handleNavigate}
            onLaunchMission={handleLaunchMission}
            isLaunching={isLaunchingMission}
          />
        )}

        {currentRoute === 'active-mission' && (
          <ActiveMissionPage
            onNavigate={handleNavigate}
            mission={activeMission}
            properties={properties}
            scores={scores}
            shortlist={shortlist}
            onToggleShortlist={handleToggleShortlist}
            onViewDetails={handleViewDetails}
            onSimulateListing={handleSimulateListing}
            onResetMission={handleResetMission}
            recentActivity={recentActivity}
            isSimulating={isSimulating}
          />
        )}

        {currentRoute === 'search' && (
          <SearchPage
            onNavigate={handleNavigate}
            properties={properties}
            scores={scores}
            shortlist={shortlist}
            onToggleShortlist={handleToggleShortlist}
            onViewDetails={handleViewDetails}
          />
        )}

        {(currentRoute === 'property-details' || currentRoute === 'details') && (
          <PropertyDetailsPage
            propertyId={selectedPropertyId}
            properties={properties}
            scores={scores}
            mission={activeMission}
            shortlist={shortlist}
            onToggleShortlist={handleToggleShortlist}
            onNavigate={handleNavigate}
          />
        )}

        {currentRoute === 'shortlist' && (
          <ShortlistPage
            onNavigate={handleNavigate}
            properties={properties}
            scores={scores}
            shortlist={shortlist}
            onToggleShortlist={handleToggleShortlist}
            onViewDetails={handleViewDetails}
          />
        )}

        {currentRoute === 'preferences' && (
          <PreferencesPage onNavigate={handleNavigate} />
        )}

        {currentRoute === 'notifications' && (
          <NotificationsPage
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClearAll={handleClearAllNotifications}
            onNavigate={handleNavigate}
            onViewDetails={handleViewDetails}
          />
        )}

        {currentRoute === 'activity' && (
          <ActivityPage
            events={recentActivity}
            onClearEvents={handleClearActivityEvents}
            onNavigate={handleNavigate}
          />
        )}

        {currentRoute === 'settings' && (
          <SettingsPage onNavigate={handleNavigate} onRefreshData={refreshAllData} />
        )}
      </main>

      {/* Simulated Match Alert Modal */}
      <SimulatedMatchAlertModal
        property={simulatedProperty}
        evaluation={simulatedEvaluation}
        isOpen={simModalOpen}
        onClose={() => setSimModalOpen(false)}
        onViewDetails={handleViewDetails}
        onToggleShortlist={handleToggleShortlist}
        isShortlisted={simulatedProperty ? shortlist.includes(simulatedProperty.id) : false}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={(user) => {
          setCurrentUser(user);
          refreshAllData();
        }}
      />

      {/* User Profile Modal */}
      {currentUser && (
        <UserProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          user={currentUser}
          onProfileUpdated={(updated) => {
            setCurrentUser(updated);
            refreshAllData();
          }}
          onOpenAuthModal={(mode) => {
            setAuthModalMode(mode);
            setAuthModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
export default App;
