import React, { Suspense, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SprintDetail from './pages/SprintDetail';
import { ToastProvider } from './lib/toast';
import { AuthProvider, useAuth } from './lib/auth';
import RoleWrapper from './components/RoleWrapper';
import Layout from './components/Layout';
import Login from './pages/Login';
import { ROUTE_CONFIG } from './lib/route-config';

// 1. Auto-discover all files in src/pages
const pageModules = import.meta.glob('./pages/*.tsx');

// 2. Build a filename → route-key map from ROUTE_CONFIG (handles mismatched names)
const fileToRouteKey: Record<string, string> = {};
Object.entries(ROUTE_CONFIG).forEach(([key, config]) => {
  const filename = (config.file || key).toLowerCase();
  fileToRouteKey[filename] = key;
});

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;

  return <>{children}</>;
}

const LoadingScreen = () => (
  <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--grey)' }}>Loading AA OS...</div>
  </div>
);

function AppRoutes() {
  const { loading } = useAuth();

  const generatedRoutes = useMemo(() => {
    return Object.keys(pageModules).map((path) => {
      const fileName = path.split('/').pop()?.replace('.tsx', '') || '';
      const lowerName = fileName.toLowerCase();

      // Skip pages that are handled outside the Layout shell
      if (['Login', 'Portal', 'Layout'].includes(fileName)) return null;
      // template-view has its own standalone route below
      if (lowerName === 'template-view') return null;

      const routeKey = fileToRouteKey[lowerName] || lowerName;
      const config = ROUTE_CONFIG[routeKey];

      // Skip page files that have no entry in ROUTE_CONFIG — prevents ghost routes
      // with empty allowedRoles from blocking access or polluting the route tree.
      if (!config) return null;

      const Component = React.lazy(pageModules[path] as any);

      return (
        <Route
          key={routeKey}
          path={routeKey}
          element={
            <Suspense fallback={<LoadingScreen />}>
              <RoleWrapper allowedRoles={config.roles || []}>
                <Component />
              </RoleWrapper>
            </Suspense>
          }
        />
      );
    });
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/portal" element={<Navigate to="/dashboard" replace />} />

      {/* --- STANDALONE FULL-SCREEN ROUTE --- */}
      <Route 
        path="/template-view" 
        element={
          <RequireAuth>
            <Suspense fallback={<LoadingScreen />}>
              {React.createElement(React.lazy(pageModules['./pages/TemplateView.tsx'] as any))}
            </Suspense>
          </RequireAuth>
        } 
      />

      {/* --- DASHBOARD ROUTES (WITH SIDEBAR) --- */}
      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        {/* All roles land on /dashboard — Dashboard.tsx switches on role internally */}
        <Route index element={<Navigate to="dashboard" replace />} />
        {generatedRoutes}
        <Route path="sprints/:id" element={<RoleWrapper allowedRoles={['admin', 'delivery', 'client']}><SprintDetail /></RoleWrapper>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
