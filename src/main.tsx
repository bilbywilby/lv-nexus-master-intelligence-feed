import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import '@/App.css'
import { DashboardPage } from '@/pages/DashboardPage'
import { IntelligenceIndexPage } from '@/pages/IntelligenceIndexPage';
import { NavHeader } from './components/NavHeader';
const queryClient = new QueryClient();
const ConfigPlaceholder = () => (
  <div className="min-h-screen bg-slate-950 text-slate-100 font-mono relative overflow-hidden">
    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-10"></div>
    <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950"></div>
    <div className="scanline"></div>
    <NavHeader />
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 pt-24 text-center">
      <h1 className="text-3xl font-bold text-amber-400 mb-4">System Configuration</h1>
      <p className="text-slate-400">Simulation controls and system parameters will be available here soon.</p>
    </main>
  </div>
);
const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/index",
    element: <IntelligenceIndexPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/config",
    element: <ConfigPlaceholder />,
    errorElement: <RouteErrorBoundary />,
  },
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)