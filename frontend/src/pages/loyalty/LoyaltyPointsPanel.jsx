import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import walletService from '../../services/walletService';
import toast from 'react-hot-toast';

const LoyaltyPointsPanel = () => {
    const [phone, setPhone] = useState('');
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(false);

    // Bonus points form
    const [bonusType, setBonusType] = useState('');
    const [bonusPoints, setBonusPoints] = useState('');

    // Track last bonus addition for print
    const [lastBonus, setLastBonus] = useState(null);

    const bonusTypes = [
        { value: '', label: 'Select Bonus Type' },
        { value: 'Google Review', label: 'Google Review' },
        { value: 'Instagram Story', label: 'Instagram Story' },
        { value: 'Customer Referral', label: 'Customer Referral' },
        { value: 'Custom', label: 'Custom' }
    ];

    // Search customer by phone
    const handleSearch = async () => {
        if (!phone || phone.length !== 10) {
            toast.error('Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        try {
            const response = await walletService.getWalletByPhone(phone);
            setCustomer(response.data);
            toast.success('Customer found!');
        } catch (error) {
            toast.error('Customer not found');
            setCustomer(null);
        } finally {
            setLoading(false);
        }
    };

    // Add bonus points
    const handleAddPoints = async () => {
        if (!customer) {
            toast.error('Please search for a customer first');
            return;
        }

        if (!bonusType || !bonusPoints || bonusPoints <= 0) {
            toast.error('Please select bonus type and enter valid points');
            return;
        }

        try {
            await walletService.adjustPoints(customer._id, parseInt(bonusPoints), bonusType);
            toast.success(`${bonusPoints} points added successfully!`);

            // Save bonus details for print
            setLastBonus({
                type: bonusType,
                points: parseInt(bonusPoints)
            });

            // Refresh customer data
            const response = await walletService.getWalletByPhone(phone);
            setCustomer(response.data);

            // Reset form
            setBonusType('');
            setBonusPoints('');
        } catch (error) {
            toast.error('Failed to add points');
        }
    };

    // Print loyalty slip
    const handlePrintSlip = () => {
        if (!customer) {
            toast.error('Please search for a customer first');
            return;
        }

        const printWindow = window.open('', '_blank');
        const currentDate = new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).replace(',', '');

        const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Loyalty Slip</title>
        <style>
          @media print {
            @page {
              margin: 0;
              size: 80mm auto;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            padding: 10px;
            margin: 0;
            max-width: 300px;
            font-size: 14px;
            line-height: 1.4;
          }
          .center {
            text-align: center;
          }
          .header {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .line {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }
          .points {
            font-size: 24px;
            font-weight: bold;
            margin: 15px 0;
          }
          .footer {
            font-size: 14px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="center header">VEEDRA THE BRAND</div>
        <div class="center subtitle">LOYALTY POINTS SLIP</div>
        <div class="line"></div>
        <div>NAME : ${customer.customerName}</div>
        <div>MOBILE : ${customer.phone}</div>
        <div>DATE : ${currentDate}</div>
        <div class="line"></div>
        ${lastBonus ? `<div>BONUS : ${lastBonus.type}</div>
        <div>POINTS ADDED : +${lastBonus.points}</div>
        <div class="line"></div>
        ` : ''}<div class="center points">${customer.points} POINTS</div>
        <div class="line"></div>
        <div class="center footer">THANK YOU ❤️</div>
        <div class="center footer">VISIT AGAIN</div>
      </body>
      </html>
    `;

        printWindow.document.write(printContent);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    const [activeTab, setActiveTab] = useState('search'); // 'search' or 'slots'
    const [pointRules, setPointRules] = useState([]);
    const [newRule, setNewRule] = useState({ minAmount: '', maxAmount: '', points: '' });

    // Fetch rules when entering slots tab
    const handleTabChange = async (tab) => {
        setActiveTab(tab);
        if (tab === 'slots') {
            try {
                const response = await walletService.getPointRules();
                setPointRules(response.data);
            } catch (error) {
                toast.error('Failed to load point rules');
            }
        }
    };

    // Add new rule
    const handleAddRule = async () => {
        if (!newRule.minAmount || !newRule.maxAmount || !newRule.points) {
            toast.error('Please fill all fields');
            return;
        }

        try {
            await walletService.addPointRule({
                minAmount: Number(newRule.minAmount),
                maxAmount: Number(newRule.maxAmount),
                points: Number(newRule.points)
            });
            toast.success('Rule added successfully');
            setNewRule({ minAmount: '', maxAmount: '', points: '' });
            // Refresh
            const response = await walletService.getPointRules();
            setPointRules(response.data);
        } catch (error) {
            toast.error(error.message || 'Failed to add rule');
        }
    };

    // Delete rule
    const handleDeleteRule = async (id) => {
        if (!window.confirm('Are you sure you want to delete this rule?')) return;
        try {
            await walletService.deletePointRule(id);
            toast.success('Rule deleted');
            // Refresh
            const response = await walletService.getPointRules();
            setPointRules(response.data);
        } catch (error) {
            toast.error('Failed to delete rule');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center border-b relative">
                    <div className="absolute right-4 top-4">
                        <button
                            onClick={() => handleTabChange(activeTab === 'search' ? 'slots' : 'search')}
                            className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition"
                        >
                            {activeTab === 'search' ? '⚙️ Manage Slots' : '🔍 Customer Search'}
                        </button>
                    </div>
                    <CardTitle className="text-2xl font-bold">VEEDRA THE BRAND</CardTitle>
                    <p className="text-gray-600 mt-1">Loyalty Points Panel</p>
                </CardHeader>

                <CardContent className="p-6">
                    {activeTab === 'search' ? (
                        <div className="space-y-4">
                            {/* Phone Search */}
                            <div className="space-y-3">
                                <input
                                    type="tel"
                                    maxLength="10"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Enter 10-digit mobile number"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-center text-lg"
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 font-medium text-lg"
                                >
                                    {loading ? 'Searching...' : 'Search'}
                                </button>
                            </div>

                            {/* Customer Details */}
                            {customer && (
                                <>
                                    <div className="border-t border-gray-200 pt-4 space-y-3">
                                        <div>
                                            <span className="font-bold">Name:</span> {customer.customerName}
                                        </div>
                                        <div>
                                            <span className="font-bold">Available Points:</span> {customer.points}
                                        </div>
                                    </div>

                                    {/* Add Bonus Points */}
                                    <div className="border-t border-gray-200 pt-4">
                                        <h3 className="font-bold text-lg mb-3">Add Bonus Points</h3>
                                        <div className="space-y-3">
                                            <select
                                                value={bonusType}
                                                onChange={(e) => setBonusType(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                            >
                                                {bonusTypes.map(type => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>

                                            <input
                                                type="number"
                                                min="1"
                                                value={bonusPoints}
                                                onChange={(e) => setBonusPoints(e.target.value)}
                                                placeholder="Enter Points"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                            />

                                            <button
                                                onClick={handleAddPoints}
                                                disabled={!bonusType || !bonusPoints}
                                                className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                                            >
                                                Add Points
                                            </button>

                                            <button
                                                onClick={handlePrintSlip}
                                                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                            >
                                                Print Loyalty Slip
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* No Customer Message */}
                            {!customer && !loading && phone.length === 10 && (
                                <div className="text-center text-gray-500 py-4">
                                    Click search to find customer
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <h3 className="font-bold text-lg border-b pb-2">Manage Point Slots</h3>

                            {/* Add New Rule Form */}
                            <div className="grid grid-cols-4 gap-2 items-end bg-gray-50 p-3 rounded-lg border">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500">Min Amount</label>
                                    <input
                                        type="number"
                                        value={newRule.minAmount}
                                        onChange={(e) => setNewRule({ ...newRule, minAmount: e.target.value })}
                                        className="w-full p-2 border rounded"
                                        placeholder="Min"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500">Max Amount</label>
                                    <input
                                        type="number"
                                        value={newRule.maxAmount}
                                        onChange={(e) => setNewRule({ ...newRule, maxAmount: e.target.value })}
                                        className="w-full p-2 border rounded"
                                        placeholder="Max"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500">Points</label>
                                    <input
                                        type="number"
                                        value={newRule.points}
                                        onChange={(e) => setNewRule({ ...newRule, points: e.target.value })}
                                        className="w-full p-2 border rounded"
                                        placeholder="Pts"
                                    />
                                </div>
                                <button
                                    onClick={handleAddRule}
                                    className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 font-medium h-[42px]"
                                >
                                    Add
                                </button>
                            </div>

                            {/* Rules Table */}
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Min Amount</th>
                                            <th className="px-4 py-2 text-left">Max Amount</th>
                                            <th className="px-4 py-2 text-left">Points</th>
                                            <th className="px-4 py-2 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pointRules.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="text-center py-4 text-gray-500">No slots defined yet.</td>
                                            </tr>
                                        ) : (
                                            pointRules.map((rule) => (
                                                <tr key={rule._id} className="border-t hover:bg-gray-50">
                                                    <td className="px-4 py-3">₹{rule.minAmount}</td>
                                                    <td className="px-4 py-3">₹{rule.maxAmount}</td>
                                                    <td className="px-4 py-3 font-bold text-green-600">+{rule.points}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => handleDeleteRule(rule._id)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="text-xs text-gray-500 flex items-center gap-1 bg-yellow-50 p-2 rounded">
                                <span>💡</span>
                                <span>Tip: Ensure there are no gaps between ranges (e.g., 0-100, 101-200).</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default LoyaltyPointsPanel;
