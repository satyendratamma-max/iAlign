import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import PortfolioOverview from './pages/Portfolio/PortfolioOverview';
import ProjectManagement from './pages/Portfolio/ProjectManagement';
import DomainsList from './pages/Portfolio/DomainsList';
import SegmentFunctionList from './pages/Portfolio/SegmentFunctionList';
import PortfolioProjects from './pages/Portfolio/PortfolioProjects';
import DomainPortfolioOverview from './pages/Portfolio/DomainPortfolioOverview';
import MilestoneTracker from './pages/Portfolio/MilestoneTracker';
import MilestonesOverview from './pages/Portfolio/MilestonesOverview';
import ProjectRequirements from './pages/Projects/ProjectRequirements';
import ResourceOverview from './pages/Resources/ResourceOverview';
import ResourceAllocation from './pages/Resources/ResourceAllocation';
import ResourceAllocationOptimized from './pages/Resources/ResourceAllocationOptimized';
// import PipelineOverview from './pages/Pipeline/PipelineOverview'; // Temporarily disabled
import CapacityDashboard from './pages/Capacity/CapacityDashboard';
import HelpPage from './pages/Help';
import About from './pages/About';
import AccessProvisioning from './pages/Admin/AccessProvisioning';
import Reports from './pages/Admin/Reports';
import DataManagement from './pages/Admin/DataManagement';
import DataLookup from './pages/Admin/DataLookup';
import DataModel from './pages/Admin/DataModel';
import AppsManagement from './pages/Admin/AppsManagement';
import TechnologiesManagement from './pages/Admin/TechnologiesManagement';
import RolesManagement from './pages/Admin/RolesManagement';
import ScenarioManagement from './pages/Admin/ScenarioManagement';
import Login from './pages/Auth/Login';
import { useAppSelector } from './hooks/redux';
import { ReactNode } from 'react';
import { ScenarioProvider } from './contexts/ScenarioContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user } = useAppSelector((state) => state.auth);

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <ScenarioProvider>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

        {/* Segment Function Routes */}
        <Route path="/domains" element={<DomainsList />} />
        <Route path="/domain/:domainId/segment-functions" element={<SegmentFunctionList />} />
        <Route path="/segment-function/:segmentFunctionId/projects" element={<PortfolioProjects />} />
        <Route path="/portfolio-overview" element={<PortfolioOverview />} />
        <Route path="/portfolio/domain/:domainId" element={<DomainPortfolioOverview />} />
        <Route path="/projects" element={<ProjectManagement />} />
        <Route path="/projects/:projectId/milestones" element={<MilestoneTracker />} />
        <Route path="/projects/:projectId/requirements" element={<ProjectRequirements />} />
        <Route path="/milestones" element={<MilestonesOverview />} />

        {/* Resource Routes */}
        <Route path="/resource-overview" element={<ResourceOverview />} />
        <Route path="/resources/allocation" element={<ResourceAllocation />} />
        <Route path="/resources/allocation-optimized" element={<ResourceAllocationOptimized />} />

        {/* Pipeline Routes - Temporarily disabled */}
        {/* <Route path="/pipeline-overview" element={<PipelineOverview />} /> */}

        {/* Capacity Routes */}
        <Route path="/capacity-overview" element={<CapacityDashboard />} />

        {/* Support Routes */}
        <Route path="/help" element={<HelpPage />} />
        <Route path="/about" element={<About />} />

        {/* Admin Routes - Protected */}
        <Route
          path="/admin/access-provisioning"
          element={
            <ProtectedRoute requiredRole="Administrator">
              <AccessProvisioning />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute requiredRole="Administrator">
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/data-management"
          element={
            <ProtectedRoute requiredRole="Administrator">
              <DataManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/data-lookup"
          element={
            <ProtectedRoute requiredRole="Administrator">
              <DataLookup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/data-model"
          element={
            <ProtectedRoute requiredRole="Administrator">
              <DataModel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/apps"
          element={
            <ProtectedRoute requiredRole="Administrator">
              <AppsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/technologies"
          element={
            <ProtectedRoute requiredRole="Administrator">
              <TechnologiesManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute requiredRole="Administrator">
              <RolesManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/scenarios"
          element={
            <ProtectedRoute requiredRole="Administrator">
              <ScenarioManagement />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </MainLayout>
    </ScenarioProvider>
  );
}

export default App;
