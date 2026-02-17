import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Printer, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const LoyaltyPointsPrintPage = () => {
    const [mobile, setMobile] = useState('');
    const [customerData, setCustomerData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!mobile || mobile.length < 10) {
            toast.error('Please enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/wallets/phone/${mobile}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Customer not found');
            }

            const data = await response.json();
            setCustomerData(data.data);
        } catch (error) {
            console.error('Error fetching customer:', error);
            toast.error('Customer not found');
            setCustomerData(null);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (!customerData) {
            toast.error('Please search for a customer first');
            return;
        }

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
      <html>
        <head>
          <title>Loyalty Points Slip - ${customerData.customerName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Arial', sans-serif;
              padding: 40px;
              background: #f9fafb;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              font-size: 28px;
              color: #1e293b;
              margin-bottom: 5px;
            }
            .header .subtitle {
              color: #64748b;
              font-size: 16px;
              margin-bottom: 10px;
            }
            .header .date {
              color: #94a3b8;
              font-size: 14px;
            }
            .info-section {
              margin: 30px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 600;
              color: #475569;
            }
            .info-value {
              color: #1e293b;
            }
            .points-highlight {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              padding: 30px;
              border-radius: 12px;
              text-align: center;
              margin: 30px 0;
              box-shadow: 0 10px 25px rgba(37, 99, 235, 0.2);
            }
            .points-highlight .label {
              font-size: 14px;
              opacity: 0.9;
              letter-spacing: 1px;
              text-transform: uppercase;
              margin-bottom: 10px;
            }
            .points-highlight .points {
              font-size: 48px;
              font-weight: bold;
              margin: 10px 0;
            }
            .points-highlight .subtext {
              font-size: 13px;
              opacity: 0.8;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 30px 0;
            }
            .stat-card {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #2563eb;
            }
            .stat-label {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #1e293b;
            }
            .stat-card.earned {
              border-left-color: #10b981;
            }
            .stat-card.used {
              border-left-color: #ef4444;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
            }
            .footer .thank-you {
              font-size: 18px;
              color: #2563eb;
              font-weight: 600;
              margin-bottom: 10px;
            }
            .footer .note {
              font-size: 12px;
              color: #94a3b8;
            }
            @media print {
              body { background: white; padding: 0; }
              .container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏪 POS & Billing System</h1>
              <div class="subtitle">Loyalty Points Statement</div>
              <div class="date">${new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}</div>
            </div>

            <div class="info-section">
              <div class="info-row">
                <span class="info-label">Customer Name</span>
                <span class="info-value">${customerData.customerName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Mobile Number</span>
                <span class="info-value">${customerData.phone}</span>
              </div>
              ${customerData.email ? `
                <div class="info-row">
                  <span class="info-label">Email</span>
                  <span class="info-value">${customerData.email}</span>
                </div>
              ` : ''}
              ${customerData.place ? `
                <div class="info-row">
                  <span class="info-label">Place</span>
                  <span class="info-value">${customerData.place}</span>
                </div>
              ` : ''}
            </div>

            <div class="points-highlight">
              <div class="label">Available Loyalty Points</div>
              <div class="points">${customerData.points || 0}</div>
              <div class="subtext">Ready to redeem</div>
            </div>

            <div class="stats-grid">
              <div class="stat-card earned">
                <div class="stat-label">Total Earned</div>
                <div class="stat-value">${customerData.loyaltyStats?.totalEarned || 0}</div>
              </div>
              <div class="stat-card used">
                <div class="stat-label">Total Used</div>
                <div class="stat-value">${customerData.loyaltyStats?.totalUsed || 0}</div>
              </div>
            </div>

            <div class="footer">
              <div class="thank-you">Thank You for Your Loyalty! 🎉</div>
              <div class="note">This is a system-generated document. No signature required.</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
        printWindow.document.close();
    };

    return (
        <div className="p-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Printer className="h-6 w-6 text-indigo-600" />
                        Print Loyalty Points Slip
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Search Section */}
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Customer Mobile Number
                                </label>
                                <input
                                    type="text"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="Enter 10-digit mobile number"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Search className="h-4 w-4" />
                                    {loading ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        </div>

                        {/* Customer Details Preview */}
                        {customerData && (
                            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                                <h3 className="text-lg font-semibold mb-4">Customer Details</h3>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <p className="text-sm text-gray-600">Name</p>
                                        <p className="font-medium">{customerData.customerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Mobile</p>
                                        <p className="font-medium">{customerData.phone}</p>
                                    </div>
                                    {customerData.place && (
                                        <div>
                                            <p className="text-sm text-gray-600">Place</p>
                                            <p className="font-medium">{customerData.place}</p>
                                        </div>
                                    )}
                                    {customerData.email && (
                                        <div>
                                            <p className="text-sm text-gray-600">Email</p>
                                            <p className="font-medium">{customerData.email}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Points Summary */}
                                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg p-6 mb-4">
                                    <p className="text-sm opacity-90 mb-2">Available Points</p>
                                    <p className="text-4xl font-bold">{customerData.points || 0}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <p className="text-sm text-green-700">Total Earned</p>
                                        <p className="text-2xl font-bold text-green-800">
                                            {customerData.loyaltyStats?.totalEarned || 0}
                                        </p>
                                    </div>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-sm text-red-700">Total Used</p>
                                        <p className="text-2xl font-bold text-red-800">
                                            {customerData.loyaltyStats?.totalUsed || 0}
                                        </p>
                                    </div>
                                </div>

                                {/* Print Button */}
                                <button
                                    onClick={handlePrint}
                                    className="w-full mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 font-medium"
                                >
                                    <Printer className="h-5 w-5" />
                                    Print Loyalty Points Slip
                                </button>
                            </div>
                        )}

                        {/* Help Text */}
                        {!customerData && !loading && (
                            <div className="text-center py-12 text-gray-500">
                                <Printer className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p>Enter customer mobile number to load details and print</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoyaltyPointsPrintPage;
