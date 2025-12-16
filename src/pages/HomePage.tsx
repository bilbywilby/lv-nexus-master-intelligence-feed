// This file is no longer in use and is kept to avoid breaking any potential template-based imports.
// The main entry point is now DashboardPage.tsx, routed from '/'.
// This component can be safely removed if no other part of the system references it.
import { Navigate } from 'react-router-dom';
export function HomePage() {
  return <Navigate to="/" replace />;
}