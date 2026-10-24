import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '../components/layout/Layout';
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

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
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
    ],
  },
]);

export function AppRouter() { return <RouterProvider router={router} />; }
