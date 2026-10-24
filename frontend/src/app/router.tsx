import React from "react";
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { SignIn, SignUp, UserProfile } from '@clerk/clerk-react';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import Dashboard from '../pages/Dashboard';
import Transactions from '../pages/Transactions';
import Income from '../pages/Income';
import Expenses from '../pages/Expenses';
import Budgets from '../pages/Budgets';
import Analytics from '../pages/Analytics';
import QueryStudio from '../pages/QueryStudio';
import SchemaViewer from '../pages/SchemaViewer';
import QueryHistory from '../pages/QueryHistory';
import Settings from '../pages/Settings';
import SoftCard from '../components/ui/SoftCard';

const wrap = (el: React.ReactNode) => <ProtectedRoute>{el}</ProtectedRoute>;

const router = createBrowserRouter([
  { path: '/sign-in/*', element: <div className="min-h-screen flex items-center justify-center"><SoftCard><SignIn routing="path" path="/sign-in" /></SoftCard></div> },
  { path: '/sign-up/*', element: <div className="min-h-screen flex items-center justify-center"><SoftCard><SignUp routing="path" path="/sign-up" /></SoftCard></div> },
  {
    path: '/',
    element: wrap(<Layout />),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'transactions', element: <Transactions /> },
      { path: 'income', element: <Income /> },
      { path: 'expenses', element: <Expenses /> },
      { path: 'budgets', element: <Budgets /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'query-studio', element: <QueryStudio /> },
      { path: 'schema', element: <SchemaViewer /> },
      { path: 'history', element: <QueryHistory /> },
      { path: 'settings', element: <Settings /> },
      { path: 'profile', element: <div className="p-4"><SoftCard><UserProfile /></SoftCard></div> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function AppRouter() { return <RouterProvider router={router} />; }
