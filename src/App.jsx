import { Toaster } from "@/components/ui/toaster"
import Leaderboard from './pages/Leaderboard';
import AIScanner from './pages/AIScanner';
// Analytics merged into Reports; WorkloadHeatmap merged into WorkloadDashboard
import Templates from './pages/Templates';
import AIBugMonitor from './pages/AIBugMonitor';
import TimeTracking from './pages/TimeTracking';
import Tasks from './pages/Tasks';
import WorkloadDashboard from './pages/WorkloadDashboard';
import ClientPortal from './pages/ClientPortal';
import DiscordBot from './pages/DiscordBot';

import Invoicing from './pages/Invoicing';
import ResourceScheduler from './pages/ResourceScheduler';
import AIChangesLog from './pages/AIChangesLog';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/Leaderboard" element={<LayoutWrapper currentPageName="Leaderboard"><Leaderboard /></LayoutWrapper>} />
      <Route path="/AIScanner" element={<LayoutWrapper currentPageName="AIScanner"><AIScanner /></LayoutWrapper>} />
      <Route path="/Templates" element={<LayoutWrapper currentPageName="Templates"><Templates /></LayoutWrapper>} />
      <Route path="/AIBugMonitor" element={<LayoutWrapper currentPageName="AIBugMonitor"><AIBugMonitor /></LayoutWrapper>} />
      <Route path="/TimeTracking" element={<LayoutWrapper currentPageName="TimeTracking"><TimeTracking /></LayoutWrapper>} />

      <Route path="/Tasks" element={<LayoutWrapper currentPageName="Tasks"><Tasks /></LayoutWrapper>} />
      <Route path="/WorkloadDashboard" element={<LayoutWrapper currentPageName="WorkloadDashboard"><WorkloadDashboard /></LayoutWrapper>} />
      <Route path="/ClientPortal" element={<LayoutWrapper currentPageName="ClientPortal"><ClientPortal /></LayoutWrapper>} />
      <Route path="/DiscordBot" element={<LayoutWrapper currentPageName="DiscordBot"><DiscordBot /></LayoutWrapper>} />

      <Route path="/Invoicing" element={<LayoutWrapper currentPageName="Invoicing"><Invoicing /></LayoutWrapper>} />
      <Route path="/ResourceScheduler" element={<LayoutWrapper currentPageName="ResourceScheduler"><ResourceScheduler /></LayoutWrapper>} />
      <Route path="/AIChangesLog" element={<LayoutWrapper currentPageName="AIChangesLog"><AIChangesLog /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App