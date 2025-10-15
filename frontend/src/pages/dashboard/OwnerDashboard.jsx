import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { 
  DollarSign, 
  Users, 
  Package, 
  TrendingUp, 
  ShoppingCart, 
  AlertTriangle 
} from 'lucide-react';

import api from '../../services/api';

const OwnerDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalProducts: 0,
    totalVendors: 0,
    lowStockItems: 0,
    todaysSales: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      console.log('Loading dashboard data...');
      console.log('User:', user);
      console.log('Token in localStorage:', localStorage.getItem('token'));
      
      const response = await api.get('/dashboard/owner');
      console.log('Dashboard API response:', response);
      
      if (response?.data) {
        const data = response.data;
        console.log('Dashboard data received:', data);
        setDashboardData({
          totalRevenue: data.summary?.totalProducts * 1000 || 125000,
          totalProducts: data.summary?.totalProducts || 0,
          totalVendors: data.summary?.totalVendors || 0,
          lowStockItems: data.summary?.lowStockCount || 0,
          todaysSales: data.sales?.todaySales || 0,
          monthlyGrowth: 12.5
        });
        console.log('Dashboard state updated with:', {
          totalProducts: data.summary?.totalProducts || 0,
          totalVendors: data.summary?.totalVendors || 0,
          lowStockItems: data.summary?.lowStockCount || 0
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.log('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your business today.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Today's Date</p>
          <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{loading ? '...' : dashboardData.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : dashboardData.totalProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : dashboardData.totalVendors}
            </div>
            <p className="text-xs text-muted-foreground">
              Reliable partners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {loading ? '...' : dashboardData.lowStockItems}
            </div>
            <p className="text-xs text-muted-foreground">
              Items need restocking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest transactions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <ShoppingCart className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">New order #ORD001234</p>
                <p className="text-xs text-gray-500">₹2,500 • 2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Package className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Product restocked: iPhone Cases</p>
                <p className="text-xs text-gray-500">50 units added • 1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Users className="h-4 w-4 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">New vendor registered</p>
                <p className="text-xs text-gray-500">TechHub Solutions • 3 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/products/add')}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Package className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium">Add Product</span>
            </button>
            {/* <button 
              onClick={() => navigate('/users')}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium">Manage Staff</span>
            </button>
            <button 
              onClick={() => navigate('/reports')}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium">View Reports</span>
            </button>
            <button 
              onClick={() => navigate('/billing')}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium">Process Order</span>
            </button> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerDashboard;