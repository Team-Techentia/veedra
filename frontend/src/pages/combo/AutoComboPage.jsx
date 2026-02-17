import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Edit, Play, Pause } from 'lucide-react';
import toast from 'react-hot-toast';
import comboService from '../../services/comboService';

const AutoComboPage = () => {
    const [combos, setCombos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        minPrice: '',
        maxPrice: '',
        slabs: [{ minQuantity: 1, slabPrice: '' }]
    });

    // Fetch auto-combos
    const fetchCombos = async () => {
        try {
            setLoading(true);
            console.log('🔍 Fetching auto-combos...');
            const response = await comboService.getCombos();
            console.log('✅ API Response:', response);

            // Handle both response formats
            const combosData = response.data || response;
            const autoCombos = Array.isArray(combosData)
                ? combosData.filter(combo => combo.comboType === 'quantity_slab')
                : [];

            console.log('📦 Auto-combos found:', autoCombos.length);
            setCombos(autoCombos);
        } catch (error) {
            console.error('❌ Error fetching auto-combos:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            toast.error(error.response?.data?.message || 'Failed to load auto-combos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCombos();
    }, []);

    // Add new slab row
    const addSlab = () => {
        const lastSlab = formData.slabs[formData.slabs.length - 1];
        const nextQuantity = lastSlab ? parseInt(lastSlab.minQuantity) + 1 : 1;

        setFormData({
            ...formData,
            slabs: [...formData.slabs, { minQuantity: nextQuantity, slabPrice: '' }]
        });
    };

    // Remove slab row
    const removeSlab = (index) => {
        if (formData.slabs.length > 1) {
            const newSlabs = formData.slabs.filter((_, i) => i !== index);
            setFormData({ ...formData, slabs: newSlabs });
        }
    };

    // Update slab value
    const updateSlab = (index, field, value) => {
        const newSlabs = [...formData.slabs];
        newSlabs[index][field] = value;
        setFormData({ ...formData, slabs: newSlabs });
    };

    // Handle edit - pre-fill form
    const handleEdit = (combo) => {
        setEditingId(combo._id);
        setFormData({
            name: combo.name,
            minPrice: combo.quantitySlabConfig?.minPrice || '',
            maxPrice: combo.quantitySlabConfig?.maxPrice || '',
            slabs: combo.quantitySlabConfig?.slabs || [{ minQuantity: 1, slabPrice: '' }]
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.minPrice || !formData.maxPrice) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Validate price range
        if (parseFloat(formData.minPrice) > parseFloat(formData.maxPrice)) {
            toast.error('Min Price cannot be greater than Max Price');
            return;
        }

        // Validate slabs
        for (let slab of formData.slabs) {
            if (!slab.minQuantity || !slab.slabPrice) {
                toast.error('All slab fields are required');
                return;
            }
        }

        try {
            setLoading(true);

            const payload = {
                name: formData.name,
                minPrice: parseFloat(formData.minPrice),
                maxPrice: parseFloat(formData.maxPrice),
                slabs: formData.slabs.map(slab => ({
                    minQuantity: parseInt(slab.minQuantity),
                    slabPrice: parseFloat(slab.slabPrice)
                }))
            };

            if (editingId) {
                // Update existing combo
                await comboService.updateCombo(editingId, {
                    ...payload,
                    quantitySlabConfig: {
                        enabled: true,
                        minPrice: payload.minPrice,
                        maxPrice: payload.maxPrice,
                        slabs: payload.slabs,
                        applyLastSlabForHigher: true,
                        autoApply: true
                    }
                });
                toast.success('Auto-combo updated successfully!');
            } else {
                // Create new combo
                await comboService.createQuantitySlabCombo(payload);
                toast.success('Auto-combo created successfully!');
            }

            setShowForm(false);
            setEditingId(null);
            setFormData({
                name: '',
                minPrice: '',
                maxPrice: '',
                slabs: [{ minQuantity: 1, slabPrice: '' }]
            });
            fetchCombos();
        } catch (error) {
            console.error('Error saving auto-combo:', error);
            toast.error(error.response?.data?.message || 'Failed to save auto-combo');
        } finally {
            setLoading(false);
        }
    };

    // Delete combo
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this auto-combo?')) {
            try {
                await comboService.deleteCombo(id);
                toast.success('Auto-combo deleted successfully!');
                fetchCombos();
            } catch (error) {
                console.error('Error deleting combo:', error);
                toast.error('Failed to delete auto-combo');
            }
        }
    };

    const handleToggle = async (id, currentStatus) => {
        try {
            const result = await comboService.toggleComboStatus(id);
            toast.success(result.message || `Combo ${!currentStatus ? 'activated' : 'paused'}`);
            fetchCombos();
        } catch (error) {
            console.error('Error toggling combo status:', error);
            toast.error('Failed to toggle combo status');
        }
    };
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            ✨ Auto-Combo Management
                        </h1>
                        <p className="text-gray-600">Create quantity-based automatic pricing combos</p>
                    </div>
                    <button
                        onClick={() => {
                            if (showForm) {
                                setShowForm(false);
                                setEditingId(null);
                                setFormData({
                                    name: '',
                                    minPrice: '',
                                    maxPrice: '',
                                    slabs: [{ minQuantity: 1, slabPrice: '' }]
                                });
                            } else {
                                setShowForm(true);
                            }
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2 shadow-lg"
                    >
                        {showForm ? (
                            <>
                                <X className="h-5 w-5" />
                                <span>Cancel</span>
                            </>
                        ) : (
                            <>
                                <Plus className="h-5 w-5" />
                                <span>Create New Auto-Combo</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Create Form */}
                {showForm && (
                    <div className="bg-white rounded-xl shadow-xl p-6 mb-6 border-2 border-purple-200">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            {editingId ? 'Edit Auto-Combo' : 'Create New Auto-Combo'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Combo Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Combo Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="e.g., Bulk Discount Tier"
                                    required
                                />
                            </div>

                            {/* Price Range */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price Range (₹) *
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.minPrice}
                                            onChange={(e) => setFormData({ ...formData, minPrice: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            placeholder="e.g., 300"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.maxPrice}
                                            onChange={(e) => setFormData({ ...formData, maxPrice: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            placeholder="e.g., 350"
                                            required
                                        />
                                    </div>
                                </div>


                            </div>

                            {/* Quantity Slabs */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Quantity Slabs *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addSlab}
                                        className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-1"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>Add Slab</span>
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {formData.slabs.map((slab, index) => (
                                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex-1">
                                                <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={slab.minQuantity}
                                                    onChange={(e) => updateSlab(index, 'minQuantity', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                    placeholder="Qty"
                                                    required
                                                />
                                            </div>
                                            <span className="text-gray-500 text-xl self-end pb-2">→</span>
                                            <div className="flex-1">
                                                <label className="block text-xs text-gray-600 mb-1">Price (₹)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={slab.slabPrice}
                                                    onChange={(e) => updateSlab(index, 'slabPrice', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                    placeholder="Price"
                                                    required
                                                />
                                            </div>
                                            {formData.slabs.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSlab(index)}
                                                    className="self-end pb-2 p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    💡 Prices should generally decrease as quantity increases
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
                            >
                                <Save className="h-5 w-5" />
                                <span>{loading ? 'Saving...' : editingId ? 'Update Auto-Combo' : 'Create Auto-Combo'}</span>
                            </button>
                        </form>
                    </div>
                )}

                {/* Auto-Combo List */}
                <div className="bg-white rounded-xl shadow-xl p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Active Auto-Combos</h2>

                    {loading && !combos.length ? (
                        <div className="text-center py-8 text-gray-500">Loading auto-combos...</div>
                    ) : combos.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No auto-combos created yet. Create one to get started!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {combos.map((combo) => (
                                <div
                                    key={combo._id}
                                    className="border-2 border-blue-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-800">{combo.name}</h3>
                                            <p className="text-sm text-gray-600">SKU: {combo.sku}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleToggle(combo._id, combo.isActive)}
                                                className={`p-2 rounded-lg transition-colors ${combo.isActive
                                                        ? 'text-orange-500 hover:bg-orange-100'
                                                        : 'text-green-500 hover:bg-green-100'
                                                    }`}
                                                title={combo.isActive ? 'Pause Combo' : 'Activate Combo'}
                                            >
                                                {combo.isActive ? (
                                                    <Pause className="h-5 w-5" />
                                                ) : (
                                                    <Play className="h-5 w-5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(combo)}
                                                className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(combo._id)}
                                                className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <p className="text-sm font-medium text-gray-700 mb-1">
                                            Price Range: <span className="text-blue-600 font-bold">₹{combo.quantitySlabConfig?.minPrice} - ₹{combo.quantitySlabConfig?.maxPrice}</span>
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-700">Quantity Slabs:</p>
                                        {combo.quantitySlabConfig?.slabs?.map((slab, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 bg-white rounded-lg border border-blue-200"
                                            >
                                                <span className="text-sm text-gray-600">
                                                    Qty {slab.minQuantity}{slab.maxQuantity ? `-${slab.maxQuantity}` : '+'}
                                                </span>
                                                <span className="text-sm font-bold text-green-600">
                                                    ₹{slab.slabPrice}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${combo.isActive
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {combo.isActive ? '✅ Active' : '⏸ Paused'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AutoComboPage;
