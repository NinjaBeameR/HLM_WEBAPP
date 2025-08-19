import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  FileText, 
  BarChart3, 
  Menu, 
  X,
  Home
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'master', label: 'Worker Master', icon: Users },
    { id: 'attendance', label: 'Daily Entry', icon: Calendar },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-2 flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-900 truncate">
            <span className="text-blue-600">Hulimane</span> Labour
          </h1>
          {/* Mobile menu button always visible */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-600 hover:text-gray-900 p-2 focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
        {/* Mobile Navigation (primary) */}
        <nav className={`md:hidden transition-all duration-200 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pb-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-base font-semibold ${
                    currentPage === item.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-700 hover:text-blue-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={22} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
        {/* Desktop Navigation (fallback, minimal) */}
        <nav className="hidden md:flex space-x-2 px-4 py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  currentPage === item.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>
      {/* Main Content */}
      <main className="flex-1 px-2 py-4 sm:px-4 sm:py-6 max-w-full">
        {children}
      </main>
    </div>
  );
};

export default Layout;