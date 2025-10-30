import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Gift,
  Wallet,
  FileText,
  LogOut,
  Menu,
  X,
  Building2,
  Upload,
  CreditCard,
  Scan,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['owner', 'manager', 'staff'] },
    { 
      name: 'POS System', 
      href: '/billing', 
      icon: CreditCard, 
      roles: ['owner', 'manager', 'staff'], 
      highlight: true,
      children: [
        { name: 'New Bill', href: '/billing' },
        { name: 'Bill History', href: '/billing/history' }
      ]
    },
    { 
      name: 'Products', 
      href: '/products', 
      icon: Package, 
      roles: ['owner', 'manager'],
      children: [
        { name: 'View Products', href: '/products' },
        { name: 'Add Product', href: '/products/add' },
        { name: 'Import Products', href: '/products/import' }
      ]
    },
    { name: 'Categories', href: '/categories', icon: Building2, roles: ['owner', 'manager'] },
    { name: 'Vendors', href: '/vendors', icon: Users, roles: ['owner', 'manager'] },
    { name: 'Combos', href: '/combos', icon: Gift, roles: ['owner', 'manager'] },
    // { name: 'Inventory', href: '/inventory', icon: Package, roles: ['owner', 'manager'] },
    // { name: 'Wallets', href: '/wallets', icon: Wallet, roles: ['owner', 'manager'] },
    // { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['owner', 'manager'] },
    // { name: 'Users', href: '/users', icon: Users, roles: ['owner'] },
    // { name: 'Settings', href: '/settings', icon: Settings, roles: ['owner', 'manager', 'staff'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  );

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const toggleDropdown = (itemName) => {
    setDropdownOpen(dropdownOpen === itemName ? null : itemName);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">POS & Billing System</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                
                return (
                  <div key={item.name} className="relative">
                    <button
                      onClick={() => {
                        if (hasChildren) {
                          toggleDropdown(item.name);
                        } else {
                          navigate(item.href);
                          setDropdownOpen(null);
                        }
                      }}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive(item.href)
                          ? item.highlight 
                            ? 'bg-green-100 text-green-900 border border-green-300' 
                            : 'bg-blue-100 text-blue-900'
                          : item.highlight
                            ? 'text-green-700 hover:bg-green-50 hover:text-green-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                      {hasChildren && <ChevronDown className="ml-1 h-3 w-3" />}
                    </button>

                    {/* Dropdown Menu */}
                    {hasChildren && dropdownOpen === item.name && (
                      <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                        <div className="py-1">
                          {item.children.map((child) => (
                            <button
                              key={child.name}
                              onClick={() => {
                                navigate(child.href);
                                setDropdownOpen(null);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            >
                              {child.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>

              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => {
                        navigate(item.href);
                        setMobileMenuOpen(false);
                      }}
                      className={`group flex items-center px-3 py-2 text-base font-medium rounded-md w-full text-left ${
                        isActive(item.href)
                          ? item.highlight 
                            ? 'bg-green-100 text-green-900' 
                            : 'bg-blue-100 text-blue-900'
                          : item.highlight
                            ? 'text-green-700 hover:bg-green-50'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </button>
                    
                    {/* Mobile dropdown items */}
                    {item.children && (
                      <div className="ml-8 space-y-1">
                        {item.children.map((child) => (
                          <button
                            key={child.name}
                            onClick={() => {
                              navigate(child.href);
                              setMobileMenuOpen(false);
                            }}
                            className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Mobile user info */}
            <div className="border-t border-gray-200 px-4 py-3">
              <div className="text-base font-medium text-gray-800">{user?.name}</div>
              <div className="text-sm text-gray-500 capitalize">{user?.role}</div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content - Full width */}
      <main className="flex-1">
        <div className="w-full">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;