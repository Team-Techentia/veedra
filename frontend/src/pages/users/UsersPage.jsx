import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import {
  Search, Edit, Trash2, Plus, Minus, Eye, Calendar,
  Award, TrendingUp, Users, ChevronLeft, ChevronRight, Printer, ChevronDown
} from 'lucide-react';
import {
  getCustomers,
  updateCustomer,
  deleteCustomer,
  getTopLoyaltyHolders,
  adjustCustomerPoints,
  getCustomerBills
} from '../../services/customerService';
import toast from 'react-hot-toast';

const UsersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [topHolders, setTopHolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // New features
  const [maskMobileNumbers, setMaskMobileNumbers] = useState(false);
  const [sortBy, setSortBy] = useState(''); // 'earned-desc', 'earned-asc', 'available-desc', 'available-asc'
  const [rankLimit, setRankLimit] = useState(50); // 10, 20, 50, 100

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showBillsModal, setShowBillsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [openPrintDropdown, setOpenPrintDropdown] = useState(null);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerBills, setCustomerBills] = useState([]);
  const printDropdownRef = useRef(null);

  const [editForm, setEditForm] = useState({
    customerName: '',
    place: '',
    dateOfBirth: '',
    email: ''
  });

  const [pointsForm, setPointsForm] = useState({
    points: 0,
    reason: ''
  });

  useEffect(() => {
    loadCustomers();
  }, [currentPage, searchTerm, dateFrom, dateTo]);

  useEffect(() => {
    loadTopHolders();
  }, [rankLimit, dateFrom, dateTo]);

  // Utility function to mask mobile numbers
  const maskMobile = (phone) => {
    if (!phone || !maskMobileNumbers) return phone;
    return 'xxxxxxx' + phone.slice(-3);
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await getCustomers(currentPage, 30, searchTerm, dateFrom, dateTo);
      setCustomers(response.data || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const loadTopHolders = async () => {
    try {
      const response = await getTopLoyaltyHolders(rankLimit, dateFrom || null, dateTo || null);
      setTopHolders(response.data || []);
    } catch (error) {
      console.error('Error loading top holders:', error);
    }
  };

  // Sorted customers based on sortBy state
  const sortedCustomers = React.useMemo(() => {
    if (!sortBy) return customers;

    return [...customers].sort((a, b) => {
      if (sortBy === 'earned-desc') return (b.loyaltyStats?.totalEarned || 0) - (a.loyaltyStats?.totalEarned || 0);
      if (sortBy === 'earned-asc') return (a.loyaltyStats?.totalEarned || 0) - (b.loyaltyStats?.totalEarned || 0);
      if (sortBy === 'available-desc') return (b.points || 0) - (a.points || 0);
      if (sortBy === 'available-asc') return (a.points || 0) - (b.points || 0);
      return 0;
    });
  }, [customers, sortBy]);

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setEditForm({
      customerName: customer.customerName || '',
      place: customer.place || '',
      dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.split('T')[0] : '',
      email: customer.email || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      await updateCustomer(selectedCustomer._id, editForm);
      toast.success('Customer updated successfully');
      loadCustomers();
      loadTopHolders();
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    }
  };

  const handleDeleteClick = (customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await deleteCustomer(selectedCustomer._id);
      toast.success('Customer deleted successfully');
      loadCustomers();
      loadTopHolders();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  const handlePointsClick = (customer) => {
    setSelectedCustomer(customer);
    setPointsForm({ points: 0, reason: '' });
    setShowPointsModal(true);
  };

  const handleAdjustPoints = async (e) => {
    e.preventDefault();
    try {
      await adjustCustomerPoints(selectedCustomer._id, parseInt(pointsForm.points), pointsForm.reason);
      toast.success(`Points ${pointsForm.points > 0 ? 'added' : 'deducted'} successfully`);
      loadCustomers();
      loadTopHolders();
      setShowPointsModal(false);
    } catch (error) {
      console.error('Error adjusting points:', error);
      toast.error('Failed to adjust points');
    }
  };

  const handleViewBills = async (customer) => {
    setSelectedCustomer(customer);
    try {
      const response = await getCustomerBills(customer._id);
      setCustomerBills(response.data || []);
      setShowBillsModal(true);
    } catch (error) {
      console.error('Error loading bills:', error);
      toast.error('Failed to load bills');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            Customer Management
          </h1>
          <p className="text-gray-600 mt-1">Manage customers and loyalty points</p>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name, phone, email, place..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="From Date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="To Date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers ({customers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Sorting and Masking Controls */}
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No Sorting</option>
                <option value="earned-desc">Total Earned: High to Low</option>
                <option value="earned-asc">Total Earned: Low to High</option>
                <option value="available-desc">Available Points: High to Low</option>
                <option value="available-asc">Available Points: Low to High</option>
              </select>
            </div>
            <div className="pt-6">
              <button
                onClick={() => setMaskMobileNumbers(!maskMobileNumbers)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${maskMobileNumbers
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {maskMobileNumbers ? '🔒 Unhide' : '👁️ Hide'} Mobile Numbers
              </button>
            </div>
          </div>
        </CardContent>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sl No.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Place</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DOB</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Earned</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Used</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expired</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Available</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedCustomers.map((customer, index) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {(currentPage - 1) * 30 + index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {customer.customerName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {maskMobile(customer.phone)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {customer.place || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(customer.dateOfBirth)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {customer.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                      {customer.loyaltyStats?.totalEarned || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                      {customer.loyaltyStats?.totalUsed || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-orange-600 font-medium">
                      {customer.loyaltyStats?.totalExpired || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-blue-600 font-bold">
                      {customer.points || 0}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePointsClick(customer)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Manage Points"
                        >
                          <Award className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleViewBills(customer)}
                          className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                          title="View Bills"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(customer)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
              &nbsp;({customers.length} records on this page)
            </div>
            <div className="flex items-center gap-1">
              {/* Previous */}
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>

              {/* Page number buttons */}
              {(() => {
                const pages = [];
                const delta = 2; // pages to show on each side of current
                const left = Math.max(1, currentPage - delta);
                const right = Math.min(totalPages, currentPage + delta);

                // First page + ellipsis
                if (left > 1) {
                  pages.push(
                    <button key={1} onClick={() => setCurrentPage(1)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      1
                    </button>
                  );
                  if (left > 2) pages.push(<span key="left-ellipsis" className="px-1 text-gray-400 select-none">…</span>);
                }

                // Windowed pages
                for (let p = left; p <= right; p++) {
                  pages.push(
                    <button key={p} onClick={() => setCurrentPage(p)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors font-medium ${p === currentPage
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'border-gray-300 hover:bg-gray-50'
                        }`}>
                      {p}
                    </button>
                  );
                }

                // Ellipsis + last page
                if (right < totalPages) {
                  if (right < totalPages - 1) pages.push(<span key="right-ellipsis" className="px-1 text-gray-400 select-none">…</span>);
                  pages.push(
                    <button key={totalPages} onClick={() => setCurrentPage(totalPages)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      {totalPages}
                    </button>
                  );
                }

                return pages;
              })()}

              {/* Next */}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 50 Loyalty Table */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            {/* Line 1: Filters */}
            <div className="flex flex-wrap gap-3 items-end justify-end mb-3">
              {/* From Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              {/* To Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              {/* Rank Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Rank Filter</label>
                <select
                  value={rankLimit}
                  onChange={(e) => setRankLimit(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                  <option value={50}>Top 50</option>
                  <option value={100}>Top 100</option>
                </select>
              </div>
            </div>
            {/* Line 2: Title */}
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
              {(dateFrom || dateTo) ? (
                <span>
                  Top {rankLimit} Loyalty Points Holders from {dateFrom ? new Date(dateFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'beginning'} to {dateTo ? new Date(dateTo).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'now'}
                </span>
              ) : (
                <span>Top {rankLimit} Loyalty Points Holders</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-yellow-50 border-b border-yellow-200">
                  <tr>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                    <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase">Place</th>
                    <th className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-3 py-1 text-right text-xs font-medium text-gray-500 uppercase">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topHolders.map((holder, index) => (
                    <tr
                      key={holder._id}
                      className={`hover:bg-gray-50 ${index < 10 ? 'bg-green-50' : ''}`}
                    >
                      <td className="px-2 py-1 text-sm font-bold text-gray-900">
                        {index < 3 ? (
                          <span className="text-yellow-600">🏆 #{index + 1}</span>
                        ) : (
                          <span>#{index + 1}</span>
                        )}
                      </td>
                      <td className="px-3 py-1 text-sm font-medium text-gray-900">
                        {holder.customerName}
                      </td>
                      <td className="px-3 py-1 text-sm text-gray-900">
                        {maskMobile(holder.phone)}
                      </td>
                      <td className="px-3 py-1 text-sm text-gray-600">
                        {holder.place || '-'}
                      </td>
                      <td className="px-3 py-1 text-sm text-gray-600">
                        {holder.email || '-'}
                      </td>
                      <td className="px-3 py-1 text-sm text-right font-bold text-blue-600">
                        {holder.points} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Edit Customer</h3>
              <form onSubmit={handleUpdateCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.customerName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
                  <input
                    type="text"
                    value={editForm.place}
                    onChange={(e) => setEditForm(prev => ({ ...prev, place: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={(e) => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Points Management Modal */}
      {showPointsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Manage Points - {selectedCustomer?.customerName}</h3>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Current Points: <span className="font-bold text-blue-600">{selectedCustomer?.points}</span></p>
              </div>
              <form onSubmit={handleAdjustPoints} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points (use negative for deduction)
                  </label>
                  <input
                    type="number"
                    value={pointsForm.points}
                    onChange={(e) => setPointsForm(prev => ({ ...prev, points: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    value={pointsForm.reason}
                    onChange={(e) => setPointsForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPointsModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-lg ${pointsForm.points >= 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                      }`}
                  >
                    {pointsForm.points >= 0 ? 'Add Points' : 'Deduct Points'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bills Modal */}
      {showBillsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Bill History - {selectedCustomer?.customerName}</h3>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Bill No</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {customerBills.map((bill) => (
                      <tr key={bill._id}>
                        <td className="px-4 py-2 text-sm">{bill.billNumber}</td>
                        <td className="px-4 py-2 text-sm">{formatDate(bill.createdAt)}</td>
                        <td className="px-4 py-2 text-sm text-right">₹{bill.total?.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-right text-green-600 font-medium">
                          {bill.loyalty?.pointsEarned || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowBillsModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4 text-red-600">Delete Customer</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{selectedCustomer?.customerName}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
