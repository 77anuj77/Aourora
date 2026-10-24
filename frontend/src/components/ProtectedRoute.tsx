import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import React from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="p-6">Loading...</div>;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  return <>{children}</>;
}
