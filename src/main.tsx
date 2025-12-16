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
import { Toaster } from '@/components/ui/sonner';
import '@/index.css'
import '@/App.css'
import { DashboardPage } from '@/pages/DashboardPage'
import { IntelligenceIndexPage } from '@/pages/IntelligenceIndexPage';
import { ConfigPage } from '@/pages/ConfigPage';
import { AutomationCanvas } from '@/pages/AutomationCanvas';
const queryClient = new QueryClient();
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
    path: "/automation",
    element: <AutomationCanvas />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/config",
    element: <ConfigPage />,
    errorElement: <RouteErrorBoundary />,
  },
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors theme="dark" />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)