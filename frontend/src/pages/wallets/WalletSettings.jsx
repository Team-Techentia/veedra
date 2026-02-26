import React, { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle, Plus, Trash2, X } from 'lucide-react';
import walletService from '../../services/walletService';
import toast from 'react-hot-toast';
import axios from 'axios';

const WalletSettings = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [pointConfig, setPointConfig] = useState(null);
    const [savingConfig, setSavingConfig] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRule, setNewRule] = useState({ minAmount: '', maxAmount: '', points: '' });
    const [creatingRule, setCreatingRule] = useState(false);

    useEffect(() => {
        fetchRules();
        fetchPointConfig();
    }, []);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('https://api.techentia.in/api/point-rules', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRules(response.data.data);
        } catch (error) {
            toast.error('Failed to load point rules');
            console.error('Error fetching rules:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (id, field, value) => {
        setRules(rules.map(rule =>
            rule._id === id ? { ...rule, [field]: parseInt(value) || 0 } : rule
        ));
    };

    const handleSave = async (rule) => {
        try {
            setSavingId(rule._id);
            const token = localStorage.getItem('token');

            await axios.put(
                `https://api.techentia.in/api/point-rules/${rule._id}`,
                {
                    minAmount: rule.minAmount,
                    maxAmount: rule.maxAmount,
                    points: rule.points
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast.success('Point rule updated successfully');
            fetchRules(); // Refresh to get latest data
        } catch (error) {
            toast.error('Failed to update point rule');
            console.error('Error updating rule:', error);
        } finally {
            setSavingId(null);
        }
    };

    const fetchPointConfig = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('https://api.techentia.in/api/point-rules/config/price', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPointConfig(response.data.data);
        } catch (error) {
            console.error('Error fetching point config:', error);
        }
    };

    const handleConfigChange = (value) => {
        setPointConfig({ ...pointConfig, pointPrice: parseFloat(value) || 1 });
    };

    const handleSaveConfig = async () => {
        try {
            setSavingConfig(true);
            const token = localStorage.getItem('token');
            await axios.put(
                'https://api.techentia.in/api/point-rules/config/price',
                { pointPrice: pointConfig.pointPrice },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Point price updated successfully');
            fetchPointConfig();
        } catch (error) {
            toast.error('Failed to update point price');
            console.error('Error updating config:', error);
        } finally {
            setSavingConfig(false);
        }
    };

    const handleCreateRule = async () => {
        if (!newRule.minAmount || !newRule.maxAmount || !newRule.points) {
            toast.error('Please fill in all fields');
            return;
        }
        if (parseInt(newRule.minAmount) >= parseInt(newRule.maxAmount)) {
            toast.error('Min amount must be less than max amount');
            return;
        }
        try {
            setCreatingRule(true);
            const token = localStorage.getItem('token');
            await axios.post(
                'https://api.techentia.in/api/point-rules',
                {
                    minAmount: parseInt(newRule.minAmount),
                    maxAmount: parseInt(newRule.maxAmount),
                    points: parseInt(newRule.points)
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('New point rule slot created!');
            setShowCreateModal(false);
            setNewRule({ minAmount: '', maxAmount: '', points: '' });
            fetchRules();
        } catch (error) {
            toast.error('Failed to create point rule');
            console.error('Error creating rule:', error);
        } finally {
            setCreatingRule(false);
        }
    };

    const handleDeleteRule = async (id) => {
        if (!window.confirm('Are you sure you want to delete this slot?')) return;
        try {
            setDeletingId(id);
            const token = localStorage.getItem('token');
            await axios.delete(
                `https://api.techentia.in/api/point-rules/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Point rule deleted');
            fetchRules();
        } catch (error) {
            toast.error('Failed to delete point rule');
            console.error('Error deleting rule:', error);
        } finally {
            setDeletingId(null);
        }
    };

    const handleFetchPrintWallet = async () => {
        if (!printMobile || printMobile.length < 10) {
            toast.error('Please enter a valid mobile number');
            return;
        }

        try {
            setLoadingPrintData(true);
            const response = await walletService.getWalletByPhone(printMobile);
            console.log('Wallet Data:', response);
            if (response && response.data) {
                setPrintWalletData(response.data);
                toast.success('Customer details found');
            } else {
                toast.error('Customer not found');
                setPrintWalletData(null);
            }
        } catch (error) {
            console.error('Error fetching wallet for print:', error);
            toast.error('Customer not found or error occurred');
            setPrintWalletData(null);
        } finally {
            setLoadingPrintData(false);
        }
    };

    const handlePrintSlip = () => {
        if (!printWalletData) return;
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Wallet Point Settings</h1>
                <p className="mt-2 text-gray-600">
                    Configure point rewards based on purchase amounts
                </p>
            </div>

            {/* Info Alert */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                    <p className="font-medium">How it works:</p>
                    <p className="mt-1">
                        When a customer makes a purchase, they earn points based on the total amount spent.
                        Update the ranges and points below to customize your reward system.
                    </p>
                </div>
            </div>

            {/* Point Price Configuration */}
            <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3">Point Price Configuration</h2>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            1 Point = ₹
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={pointConfig?.pointPrice || 1}
                            onChange={(e) => handleConfigChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Enter point price"
                        />
                    </div>
                    <div className="pt-7">
                        <button
                            onClick={handleSaveConfig}
                            disabled={savingConfig}
                            className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
                        >
                            {savingConfig ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                </>
                            )}
                        </button>
                    </div>
                </div>
                <p className="mt-2 text-xs text-gray-600">
                    This determines how much 1 point is worth when customers redeem points.
                </p>
            </div>

            {/* Create Slot Button */}
            <div className="mb-4 flex justify-end">
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Slot
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Min Amount (₹)
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Max Amount (₹)
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Points Earned
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {rules.map((rule) => (
                                <tr key={rule._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="number"
                                            value={rule.minAmount}
                                            onChange={(e) => handleInputChange(rule._id, 'minAmount', e.target.value)}
                                            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            min="0"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="number"
                                            value={rule.maxAmount}
                                            onChange={(e) => handleInputChange(rule._id, 'maxAmount', e.target.value)}
                                            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            min="0"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="number"
                                            value={rule.points}
                                            onChange={(e) => handleInputChange(rule._id, 'points', e.target.value)}
                                            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            min="0"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleSave(rule)}
                                                disabled={savingId === rule._id}
                                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                {savingId === rule._id ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4 mr-2" />
                                                        Save
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRule(rule._id)}
                                                disabled={deletingId === rule._id}
                                                className="inline-flex items-center px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                {deletingId === rule._id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Note */}
            <div className="mt-6 text-sm text-gray-500">
                <p>
                    💡 <strong>Tip:</strong> Make sure there are no gaps between ranges to ensure all purchase amounts are covered.
                </p>
            </div>

            {/* Create Slot Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-gray-900">Create New Slot</h3>
                            <button
                                onClick={() => { setShowCreateModal(false); setNewRule({ minAmount: '', maxAmount: '', points: '' }); }}
                                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newRule.minAmount}
                                    onChange={(e) => setNewRule({ ...newRule, minAmount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. 0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newRule.maxAmount}
                                    onChange={(e) => setNewRule({ ...newRule, maxAmount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. 500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Points Earned</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newRule.points}
                                    onChange={(e) => setNewRule({ ...newRule, points: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. 10"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                onClick={() => { setShowCreateModal(false); setNewRule({ minAmount: '', maxAmount: '', points: '' }); }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateRule}
                                disabled={creatingRule}
                                className="inline-flex items-center px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {creatingRule ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Slot
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletSettings;
