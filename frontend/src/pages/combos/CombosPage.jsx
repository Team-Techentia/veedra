import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Package, 
  DollarSign,
  Calendar,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import comboService from '../../services/comboService';

const CombosPage = () => {
  const navigate = useNavigate();
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deletingIds, setDeletingIds] = useState(new Set());

  // Fetch combos from API
  useEffect(() => {
    fetchCombos();
  }, []);

  // Refresh when page becomes visible (for when navigating back)
  useEffect(() => {
    const handleFocus = () => {
      fetchCombos();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchCombos = async () => {
    try {
      setLoading(true);
      const response = await comboService.getCombos();
      console.log('Fetched combos response:', response);
      setCombos(response.data || response || []);
    } catch (error) {
      console.error('Error fetching combos:', error);
      toast.error('Failed to load combos');
      setCombos([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCombos = combos.filter(combo => {
    const matchesSearch = combo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         combo.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && combo.isActive) ||
                         (filterStatus === 'inactive' && !combo.isActive);
    
    return matchesSearch && matchesFilter;
  });

  const handleDeleteCombo = async (comboId) => {
    // Prevent multiple deletion attempts
    if (deletingIds.has(comboId)) return;
    
    if (window.confirm('Are you sure you want to delete this combo?')) {
      try {
        setDeletingIds(prev => new Set([...prev, comboId]));
        await comboService.deleteCombo(comboId);
        // Remove from local state immediately
        setCombos(prev => prev.filter(combo => combo._id !== comboId));
        toast.success('Combo deleted successfully');
        // Refresh the list to ensure consistency
        setTimeout(() => fetchCombos(), 500);
      } catch (error) {
        console.error('Error deleting combo:', error);
        if (error.response?.status === 404) {
          // If combo doesn't exist, remove it from UI anyway
          setCombos(prev => prev.filter(combo => combo._id !== comboId));
          toast.success('Combo removed from list');
        } else {
          toast.error('Failed to delete combo');
        }
      } finally {
        setDeletingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(comboId);
          return newSet;
        });
      }
    }
  };

  const handleToggleStatus = async (comboId) => {
    try {
      await comboService.toggleComboStatus(comboId);
      setCombos(prev => prev.map(combo => 
        combo._id === comboId 
          ? { ...combo, isActive: !combo.isActive }
          : combo
      ));
      toast.success('Combo status updated');
    } catch (error) {
      console.error('Error updating combo status:', error);
      if (error.response?.status === 404) {
        toast.error('Combo not found - refreshing list');
        fetchCombos();
      } else {
        toast.error('Failed to update combo status');
      }
    }
  };

  const getMaxSavings = (combo) => {
    if (!combo) return 0;
    
    if (combo.discountType === 'percentage') {
      // For percentage discount, estimate based on highest price slot
      const maxSlotPrice = Math.max(...(combo.priceSlots || []).map(slot => slot.maxPrice || 0));
      if (maxSlotPrice > 0) {
        return Math.round((maxSlotPrice * (combo.discountValue || 0)) / 100);
      }
      return combo.discountValue || 0;
    } else if (combo.discountType === 'fixed') {
      return combo.discountValue || 0;
    }
    return 0;
  };

  const getMaxQuantity = (priceSlots) => {
    if (!priceSlots || priceSlots.length === 0) return 0;
    return Math.max(...priceSlots.map(slot => slot.quantity || slot.maxProducts || 0));
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Combo Offers</h1>
          <p className="text-gray-600 mt-2">Manage your product combo offers and bundles</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchCombos}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            disabled={loading}
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => navigate('/combos/create')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Combo
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{combos.length}</p>
                <p className="text-gray-600">Total Combos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{combos.filter(c => c.isActive).length}</p>
                <p className="text-gray-600">Active Combos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{combos.reduce((sum, combo) => sum + (combo.usageLimits?.usageCount || 0), 0)}</p>
                <p className="text-gray-600">Total Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">₹{combos.reduce((sum, combo) => sum + (combo.analytics?.totalSavings || 0), 0).toLocaleString()}</p>
                <p className="text-gray-600">Total Savings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search combos by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Combos List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCombos.map((combo) => (
          <Card key={combo._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{combo.name}</CardTitle>
                  <p className="text-sm text-gray-500">{combo.code}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => navigate(`/combos/${combo._id}`)}
                    className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/combos/${combo._id}/edit`)}
                    className="p-1 text-gray-600 hover:text-green-600 transition-colors"
                    title="Edit Combo"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCombo(combo._id)}
                    disabled={deletingIds.has(combo._id)}
                    className={`p-1 transition-colors ${
                      deletingIds.has(combo._id) 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-600 hover:text-red-600'
                    }`}
                    title="Delete Combo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">{combo.description}</p>
              
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  combo.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {combo.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => handleToggleStatus(combo._id)}
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Toggle Status
                </button>
              </div>

              {/* Products */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Products:</h4>
                <div className="space-y-1">
                  {(combo.applicableProducts || combo.products || []).slice(0, 2).map((product, index) => (
                    <p key={index} className="text-xs text-gray-600">
                      • {product.name || product} {product.quantity && `(x${product.quantity})`}
                    </p>
                  ))}
                  {(combo.applicableProducts || combo.products || []).length > 2 && (
                    <p className="text-xs text-gray-500">
                      +{(combo.applicableProducts || combo.products || []).length - 2} more items
                    </p>
                  )}
                  {(!combo.applicableProducts || combo.applicableProducts.length === 0) && 
                   (!combo.products || combo.products.length === 0) && (
                    <p className="text-xs text-gray-500">No products selected</p>
                  )}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm font-medium text-gray-700">Max Savings</p>
                  <p className="text-lg font-bold text-green-600">₹{getMaxSavings(combo)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Sold</p>
                  <p className="text-lg font-bold text-blue-600">{combo.totalSold}</p>
                </div>
              </div>

              {/* Price Slots Preview */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500 mb-2">Price Slots:</p>
                <div className="text-xs text-gray-600">
                  <span>1 unit: ₹{combo.priceSlots[0]?.price}</span>
                  {combo.priceSlots.length > 1 && (
                    <span className="ml-2">
                      | {getMaxQuantity(combo.priceSlots)} units: ₹{combo.priceSlots[combo.priceSlots.length - 1]?.price}
                    </span>
                  )}
                </div>
              </div>

              {/* Last Updated */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Updated: {new Date(combo.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCombos.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No combos found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first combo offer'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => navigate('/combos/create')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Combo
              </button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CombosPage;