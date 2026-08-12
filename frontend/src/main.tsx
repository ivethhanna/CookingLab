import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { AdminPanel } from './pages/AdminPanel';
import { Login } from './pages/Login';
import { WorkshopDetail } from './pages/WorkshopDetail';
import { WorkshopList } from './pages/WorkshopList';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <WorkshopList /> },
      { path: 'workshops/:id', element: <WorkshopDetail /> },
      { path: 'admin', element: <AdminPanel /> },
      { path: 'login', element: <Login /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
