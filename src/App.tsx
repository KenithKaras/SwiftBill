import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';

// Lazy load pages for performance and code-splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateInvoice = lazy(() => import('./pages/CreateInvoice'));
const History = lazy(() => import('./pages/History'));
const Products = lazy(() => import('./pages/Products'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Landing = lazy(() => import('./pages/Landing'));

// Premium loading spinner component to render during suspense fallback
const RouteFallbackSpinner = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 font-sans">
    <div className="relative flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600"></div>
      <div className="absolute w-5 h-5 bg-blue-500 rounded-full animate-ping opacity-75"></div>
    </div>
    <p className="text-[10px] text-grey font-semibold uppercase tracking-[0.14em] mt-4 animate-pulse">
      Loading SwiftBill...
    </p>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<RouteFallbackSpinner />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              <Route path="/dashboard" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="create" element={<CreateInvoice />} />
                <Route path="history" element={<History />} />
                <Route path="products" element={<Products />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

