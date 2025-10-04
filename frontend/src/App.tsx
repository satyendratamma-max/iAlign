import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import PortfolioOverview from './pages/Portfolio/PortfolioOverview';
import ProjectManagement from './pages/Portfolio/ProjectManagement';
import DomainsList from './pages/Portfolio/DomainsList';
import PortfolioList from './pages/Portfolio/PortfolioList';
import PortfolioProjects from './pages/Portfolio/PortfolioProjects';
import DomainPortfolioOverview from './pages/Portfolio/DomainPortfolioOverview';
import MilestoneTracker from './pages/Portfolio/MilestoneTracker';
import MilestonesOverview from './pages/Portfolio/MilestonesOverview';
import ResourceOverview from './pages/Resources/ResourceOverview';
import DomainTeams from './pages/Resources/DomainTeams';
import ResourceAllocation from './pages/Resources/ResourceAllocation';
import PipelineOverview from './pages/Pipeline/PipelineOverview';
import CapacityDashboard from './pages/Capacity/CapacityDashboard';
import HelpPage from './pages/Help';
import About from './pages/About';
import Login from './pages/Auth/Login';
import { useAppSelector } from './hooks/redux';

function App() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Portfolio Routes */}
        <Route path="/domains" element={<DomainsList />} />
        <Route path="/domain/:domainId/portfolios" element={<PortfolioList />} />
        <Route path="/portfolio/:portfolioId/projects" element={<PortfolioProjects />} />
        <Route path="/portfolio-overview" element={<PortfolioOverview />} />
        <Route path="/portfolio/domain/:domainId" element={<DomainPortfolioOverview />} />
        <Route path="/projects" element={<ProjectManagement />} />
        <Route path="/projects/:projectId/milestones" element={<MilestoneTracker />} />
        <Route path="/milestones" element={<MilestonesOverview />} />

        {/* Resource Routes */}
        <Route path="/resource-overview" element={<ResourceOverview />} />
        <Route path="/resources" element={<DomainTeams />} />
        <Route path="/resources/allocation" element={<ResourceAllocation />} />

        {/* Pipeline Routes */}
        <Route path="/pipeline-overview" element={<PipelineOverview />} />

        {/* Capacity Routes */}
        <Route path="/capacity-overview" element={<CapacityDashboard />} />

        {/* Support Routes */}
        <Route path="/help" element={<HelpPage />} />
        <Route path="/about" element={<About />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
