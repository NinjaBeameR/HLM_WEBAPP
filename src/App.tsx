import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import AuthForm from './components/AuthForm';
import { Loader2 } from 'lucide-react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MasterData from './pages/MasterData';
import DailyEntry from './pages/DailyEntry';
import Payments from './pages/Payments';
import Reports from './pages/Reports';

function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'master':
        return <MasterData />;
      case 'attendance':
        return <DailyEntry />;
      case 'payments':
        return <Payments />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;