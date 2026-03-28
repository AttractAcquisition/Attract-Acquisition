import React, { Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './lib/toast';
import { AuthProvider, useAuth } from './lib/auth';
import RoleWrapper from './components/RoleWrapper';
import Layout from './components/Layout';
import Login from './pages/Login';
import { ROUTE_CONFIG } from './lib/route-config';

// 1. Auto-discover all files in src/pages
const pageModules = import.meta.glob('./pages/*.tsx');

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
  const { loading, role } = useAuth();

  const generatedRoutes = useMemo(() => {
    return Object.keys(pageModules).map((path) => {
      const fileName = path.split('/').pop()?.replace('.tsx', '') || '';
      const lowerName = fileName.toLowerCase();
      
      // Handle special cases or index pages
      if (['Login', 'Portal', 'Layout'].includes(fileName)) return null;

      const Component = React.lazy(pageModules[path] as any);
      const config = ROUTE_CONFIG[lowerName];
      const routePath = lowerName === 'dashboard' ? 'dashboard' : lowerName;

      return (
        <Route 
          key={routePath} 
          path={routePath} 
          element={
            <Suspense fallback={<LoadingScreen />}>
              <RoleWrapper allowedRoles={config?.roles || []}>
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

      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Navigate to={role === 'distribution' ? '/distribution' : role === 'delivery' ? '/delivery-dash' : '/dashboard'} replace />} />
        {generatedRoutes}
        {/* Manual override for nested routes */}
        <Route path="sprints/:id" element={<Suspense fallback={<LoadingScreen />}><RoleWrapper allowedRoles={['admin', 'delivery', 'client']}>SprintDetailHere</RoleWrapper></Suspense>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
