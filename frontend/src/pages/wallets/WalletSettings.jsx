import React, { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle, Printer, Search } from 'lucide-react';
import walletService from '../../services/walletService';
import toast from 'react-hot-toast';
import axios from 'axios';

const WalletSettings = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [pointConfig, setPointConfig] = useState(null);
    const [savingConfig, setSavingConfig] = useState(false);

    // Print Bill State
    const [printMobile, setPrintMobile] = useState('');
    const [printWalletData, setPrintWalletData] = useState(null);
    const [loadingPrintData, setLoadingPrintData] = useState(false);

    useEffect(() => {
        fetchRules();
        fetchPointConfig();
    }, []);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/point-rules', {
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
                `http://localhost:5000/api/point-rules/${rule._id}`,
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
            const response = await axios.get('http://localhost:5000/api/point-rules/config/price', {
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
                'http://localhost:5000/api/point-rules/config/price',
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
                                    Action
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

            {/* Print Bill Section */}
            <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Printer className="h-6 w-6 text-indigo-600" />
                    <h2 className="text-xl font-bold text-gray-900">Print Loyalty Points Slip</h2>
                </div>

                <div className="flex gap-4 items-end">
                    <div className="flex-1 max-w-md">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Mobile Number
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={printMobile}
                                onChange={(e) => setPrintMobile(e.target.value)}
                                placeholder="Enter mobile number"
                                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                onKeyDown={(e) => e.key === 'Enter' && handleFetchPrintWallet()}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                {loadingPrintData ? (
                                    <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4 text-gray-400" />
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleFetchPrintWallet}
                        disabled={loadingPrintData}
                        className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Search
                    </button>

                    {printWalletData && (
                        <button
                            onClick={handlePrintSlip}
                            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center"
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            Print Bill
                        </button>
                    )}
                </div>

                {/* Preview Area */}
                {printWalletData && (
                    <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50 max-w-md">
                        <p className="text-sm text-gray-500 mb-2 font-medium">Preview:</p>
                        <div className="bg-white p-4 shadow-sm border border-gray-100 font-mono text-sm leading-relaxed">
                            <div className="text-center font-bold mb-2">
                                <div className="text-lg">VEEDRA THE BRAND</div>
                                <div>LOYALTY POINTS SLIP</div>
                            </div>
                            <div className="border-b-2 border-dashed border-gray-300 my-2"></div>

                            <div className="space-y-1">
                                <div className="flex gap-2">
                                    <span>NAME :</span>
                                    <span className="font-semibold">{printWalletData.customerName || printWalletData.name || 'Customer'}</span>
                                </div>
                                <div>
                                    <span>MOBILE : </span>
                                    <span className="font-semibold">{printWalletData.phone}</span>
                                </div>
                                <div>
                                    <span>DATE : </span>
                                    <span>{new Date().toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="border-b-2 border-dashed border-gray-300 my-2"></div>

                            <div className="text-center py-2">
                                <div className="text-3xl font-bold">{Math.floor(printWalletData.points || 0)} POINTS</div>
                            </div>

                            <div className="border-b-2 border-dashed border-gray-300 my-2"></div>

                            <div className="text-center font-semibold mt-2">
                                <div>THANK YOU</div>
                                <div>VISIT AGAIN</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Hidden Printable Area */}
            {printWalletData && (
                <div id="printable-slip" className="printable hidden print:block print:absolute print:top-0 print:left-0 print:w-full print:bg-white print:z-50 p-4 font-mono">
                    <div className="max-w-[80mm] mx-auto text-black">
                        <div className="text-center font-bold mb-2">
                            <div className="text-lg">VEEDRA THE BRAND</div>
                            <div className="text-base">LOYALTY POINTS SLIP</div>
                        </div>
                        <div className="border-b-2 border-dashed border-black my-2"></div>

                        <div className="space-y-1 text-sm">
                            <div className="flex gap-2">
                                <span className="font-bold">NAME :</span>
                                <span>{printWalletData.customerName || printWalletData.name || 'Customer'}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold">MOBILE :</span>
                                <span>{printWalletData.phone}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold">DATE :</span>
                                <span>{new Date().toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="border-b-2 border-dashed border-black my-2"></div>

                        <div className="text-center py-4">
                            <div className="text-3xl font-bold">{Math.floor(printWalletData.points || 0)} POINTS</div>
                        </div>

                        <div className="border-b-2 border-dashed border-black my-2"></div>

                        <div className="text-center font-bold mt-2 text-sm">
                            <div>THANK YOU</div>
                            <div>VISIT AGAIN</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletSettings;
