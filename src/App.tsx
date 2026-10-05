import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getAntdTheme } from './theme/themeConfig';
import { useSettingsStore } from './store/useSettingsStore';
import { Sidebar } from './shared/components/Sidebar';
import { TopNavbar } from './shared/components/TopNavbar';
import { PinModal } from './shared/components/PinModal';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { apiClient } from './lib/supabase';

// High-speed route-level code splitting
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const OrderPage = lazy(() => import('./features/order/OrderPage').then((m) => ({ default: m.OrderPage })));
const KitchenPage = lazy(() => import('./features/kitchen/KitchenPage').then((m) => ({ default: m.KitchenPage })));
const AdminPage = lazy(() => import('./features/admin/AdminPage').then((m) => ({ default: m.AdminPage })));

const RouteFallback: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
    <Spin size="large" tip="Loading..." />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  const { isDarkMode } = useSettingsStore();

  useEffect(() => {
    apiClient.initData().catch((err) => {
      console.warn('Initial data seeding error:', err);
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={getAntdTheme(isDarkMode)}>
          <BrowserRouter>
            <div className={`fc-app-shell ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
              <Sidebar />
              <div className="fc-content-area">
                <TopNavbar />
                <main className="fc-page-viewport">
                  <Suspense fallback={<RouteFallback />}>
                    <Routes>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/order" element={<OrderPage />} />
                      <Route path="/kitchen" element={<KitchenPage />} />
                      <Route path="/admin" element={<AdminPage />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Suspense>
                </main>
              </div>
              <PinModal />
            </div>
          </BrowserRouter>
        </ConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

