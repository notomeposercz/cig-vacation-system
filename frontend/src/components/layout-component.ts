import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  UserIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Navigační položky
  const navigationItems = [
    {
      name: 'Kalendář',
      icon: CalendarIcon,
      href: '/calendar',
      current: location.pathname === '/calendar',
    },
    {
      name: 'Můj profil',
      icon: UserIcon,
      href: '/profile',
      current: location.pathname === '/profile',
    },
    {
      name: 'Statistiky',
      icon: ChartBarIcon,
      href: '/dashboard',
      current: location.pathname === '/dashboard',
    },
  ];

  // Admin položka (pouze pro adminy)
  if (hasRole('admin')) {
    navigationItems.push({
      name: 'Administrace',
      icon: Cog6ToothIcon,
      href: '/admin',
      current: location.pathname === '/admin',
    });
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="text-xl font-semibold text-blue-700">CIG</div>
            <div className="text-lg font-medium hidden sm:block">Systém dovolených</div>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Otevřít menu</span>
            {mobileMenuOpen ? (
              <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
            )}
          </button>

          <div className="hidden sm:flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  <span>{`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`}</span>
                </div>
                <span className="text-sm font-medium">
                  {`${user.firstName} ${user.lastName}`}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`sm:hidden ${
          mobileMenuOpen ? 'block' : 'hidden'
        } bg-white border-b border-gray-200`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`${
                item.current
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              } block px-3 py-2 rounded-md text-base font-medium`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center">
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </div>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left text-gray-700 hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium"
          >
            <div className="flex items-center">
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
              Odhlásit se
            </div>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden sm:block w-64 bg-white border-r border-gray-200">
          <div className="p-4">
            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    item.current
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon
                    className={`${
                      item.current ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-600'
                    } mr-3 h-5 w-5`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
