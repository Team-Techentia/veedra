import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users,
  BarChart3,
  PieChart,
  FileText
} from 'lucide-react';

import reportService from '../../services/reportService';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    loadReportData();
  }, [reportType, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      let data;
      const params = { period: dateRange };
      
      switch (reportType) {
        case 'sales':
          data = await reportService.getSalesReport(params);
          break;
        case 'inventory':
          data = await reportService.getInventoryReport(params);
          break;
        case 'staff':
        case 'vendors':
          data = await reportService.getCommissionReport({ ...params, type: reportType });
          break;
        default:
          data = await reportService.getSalesReport(params);
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Error loading report data:', error);
      console.log('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (format) => {
    try {
      const reportBlob = await reportService.exportReport({
        type: reportType,
        period: dateRange,
        format: format
      });
      
      // Create download link
      const url = window.URL.createObjectURL(reportBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-report-${dateRange}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`${reportType} report downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error downloading report:', error);
      console.log('Failed to download report');
    }
  };

  const getReportIcon = (type) => {
    switch (type) {
      case 'sales': return <TrendingUp className="h-5 w-5" />;
      case 'inventory': return <Package className="h-5 w-5" />;
      case 'staff': return <Users className="h-5 w-5" />;
      case 'vendors': return <Users className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const currentData = reportData?.[reportType];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Generate insights and download reports</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleDownloadReport('pdf')}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </button>
          <button
            onClick={() => handleDownloadReport('csv')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-gray-400" />
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="sales">Sales Report</option>
                <option value="inventory">Inventory Report</option>
                <option value="staff">Staff Performance</option>
                <option value="vendors">Vendor Report</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {currentData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {reportType === 'sales' && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">₹{currentData.totalSales?.toLocaleString()}</p>
                      <p className="text-gray-600">Total Sales</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{currentData.totalOrders}</p>
                      <p className="text-gray-600">Total Orders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">₹{currentData.avgOrderValue?.toLocaleString()}</p>
                      <p className="text-gray-600">Avg Order Value</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{currentData.topProducts?.length}</p>
                      <p className="text-gray-600">Top Products</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          
          {reportType === 'inventory' && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Package className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{currentData.totalProducts}</p>
                      <p className="text-gray-600">Total Products</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Package className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{currentData.lowStockItems}</p>
                      <p className="text-gray-600">Low Stock</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Package className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{currentData.outOfStockItems}</p>
                      <p className="text-gray-600">Out of Stock</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">₹{currentData.totalValue?.toLocaleString()}</p>
                      <p className="text-gray-600">Total Value</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          
          {(reportType === 'staff' || reportType === 'vendors') && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">
                        {reportType === 'staff' ? currentData.totalStaff : currentData.totalVendors}
                      </p>
                      <p className="text-gray-600">Total {reportType === 'staff' ? 'Staff' : 'Vendors'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">
                        {reportType === 'staff' ? currentData.activeStaff : currentData.activeVendors}
                      </p>
                      <p className="text-gray-600">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">₹{currentData.totalCommissions?.toLocaleString()}</p>
                      <p className="text-gray-600">Total Commissions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">
                        {reportType === 'staff' ? currentData.topPerformers?.length : currentData.topVendors?.length}
                      </p>
                      <p className="text-gray-600">Top Performers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Detailed Reports */}
      {currentData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {getReportIcon(reportType)}
                <span className="ml-2">
                  {reportType === 'sales' && 'Top Selling Products'}
                  {reportType === 'inventory' && 'Top Moving Products'}
                  {reportType === 'staff' && 'Top Performers'}
                  {reportType === 'vendors' && 'Top Vendors'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(currentData.topProducts || currentData.topMovingProducts || currentData.topPerformers || currentData.topVendors)?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.sales && `Sales: ${item.sales}`}
                        {item.movement && `Movement: ${item.movement}`}
                        {item.revenue && ` | Revenue: ₹${item.revenue.toLocaleString()}`}
                        {item.commission && ` | Commission: ₹${item.commission.toLocaleString()}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-yellow-400' :
                        index === 1 ? 'bg-gray-400' :
                        'bg-orange-400'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sales Trend (for sales report) */}
          {reportType === 'sales' && currentData.salesByDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Sales Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentData.salesByDate.map((day, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">Daily Sales</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">₹{day.sales.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Chart Placeholder */}
          {reportType !== 'sales' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  {reportType === 'inventory' && 'Stock Distribution'}
                  {reportType === 'staff' && 'Performance Distribution'}
                  {reportType === 'vendors' && 'Vendor Performance'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Chart visualization would appear here</p>
                    <p className="text-sm text-gray-500">Interactive charts coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
