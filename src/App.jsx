import { Toaster } from "@/components/ui/toaster"
import UserViewer from './pages/UserViewer';
import ShortsPage from './pages/ShortsPage';
import LivePage from './pages/LivePage';
import StreamerDashboard from './pages/StreamerDashboard';
import FinancialOverview from './pages/FinancialOverview';
import AudienceAnalytics from './pages/AudienceAnalytics';
import DeepScanResults from './pages/DeepScanResults';
import Tasks from './pages/Tasks';
import AITools from './pages/AITools';
import CreatorStudio from './pages/CreatorStudio';
import Dashboard from './pages/Dashboard';
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
const MainPage = Dashboard;

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
      <Route path="/Tasks" element={<LayoutWrapper currentPageName="Tasks"><Tasks /></LayoutWrapper>} />
      <Route path="/AITools" element={<LayoutWrapper currentPageName="AITools"><AITools /></LayoutWrapper>} />
      <Route path="/UserViewer" element={<LayoutWrapper currentPageName="UserViewer"><UserViewer /></LayoutWrapper>} />
      <Route path="/CreatorStudio" element={<LayoutWrapper currentPageName="CreatorStudio"><CreatorStudio /></LayoutWrapper>} />
      <Route path="/DeepScanResults" element={<LayoutWrapper currentPageName="DeepScanResults"><DeepScanResults /></LayoutWrapper>} />
      <Route path="/Shorts" element={<LayoutWrapper currentPageName="Shorts"><ShortsPage /></LayoutWrapper>} />
      <Route path="/Live" element={<LayoutWrapper currentPageName="Live"><LivePage /></LayoutWrapper>} />
      <Route path="/StreamerDashboard" element={<LayoutWrapper currentPageName="StreamerDashboard"><StreamerDashboard /></LayoutWrapper>} />
      <Route path="/FinancialOverview" element={<LayoutWrapper currentPageName="FinancialOverview"><FinancialOverview /></LayoutWrapper>} />
      <Route path="/AudienceAnalytics" element={<LayoutWrapper currentPageName="AudienceAnalytics"><AudienceAnalytics /></LayoutWrapper>} />
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