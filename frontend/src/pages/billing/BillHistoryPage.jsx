import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Search, Filter, Calendar, Download, Eye, Receipt, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import billingService from '../../services/billingService';
import walletService from '../../services/walletService';
import generateReceiptHTML from '../../utils/receiptGenerator';

// GST calculation function (same as POSBillingPage)
const calculateGSTBreakdown = (items = []) => {
  // Check if any individual product has price > 2500
  const hasHighValueProduct = items.some(item => {
    const itemPrice = item.isCombo ? item.comboPrice : item.price;
    return (itemPrice || 0) > 2500;
  });

  // Calculate total bill amount
  const totalBillAmount = items.reduce((sum, item) => {
    if (item.isCombo) {
      return sum + ((item.comboPrice || 0) * (item.quantity || 1));
    } else {
      return sum + ((item.price || 0) * (item.quantity || 1));
    }
  }, 0);

  let totalWithoutGST = 0;
  let gstAmount = 0;
  let isHighGST = hasHighValueProduct;

  // Determine GST rate based on individual product prices
  if (hasHighValueProduct) {
    // 12% GST - reverse calculation
    totalWithoutGST = totalBillAmount / 1.12;
    gstAmount = totalBillAmount - totalWithoutGST;
  } else {
    // 5% GST - reverse calculation  
    totalWithoutGST = totalBillAmount / 1.05;
    gstAmount = totalBillAmount - totalWithoutGST;
  }

  // Split GST into SGST and CGST
  const sgst = gstAmount / 2;
  const cgst = gstAmount / 2;

  return {
    totalWithoutGST: Math.round(totalWithoutGST),
    totalGST: Math.round(gstAmount),
    sgst5: isHighGST ? 0 : Math.round(sgst),
    cgst5: isHighGST ? 0 : Math.round(cgst),
    sgst12: isHighGST ? Math.round(sgst) : 0,
    cgst12: isHighGST ? Math.round(cgst) : 0,
    gstRate: isHighGST ? 12 : 5
  };
};

const BillHistoryPage = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [selectedBill, setSelectedBill] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadBills();
  }, []);

  // Reload bills when search term changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        loadBills();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadBills = async () => {
    setLoading(true);
    try {
      // Fetch real bills from the backend
      const result = await billingService.getBills({
        search: searchTerm,
        // Add date filters if needed
      });

      setBills(result.data || []);
    } catch (error) {
      console.error('Error loading bills:', error);
      toast.error('Failed to load bill history');
      setBills([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (bill) => {
    setSelectedBill(bill);
    setShowDetails(true);
  };

  const handlePrintBill = async (bill) => {
    const loadingToast = toast.loading('Preparing receipt...');

    try {
      let loyaltyData = null;

      // Fetch wallet data if customer phone exists
      if (bill.customerPhone && bill.customerPhone !== 'N/A' && /^\d{10}$/.test(bill.customerPhone)) {
        try {
          // We need to fetch wallet details to show Total Points
          const response = await walletService.getWalletByPhone(bill.customerPhone);
          const wallet = response.data || response;

          if (wallet) {
            let redeemedPoints = 0;
            let pointValue = 0;

            // Try to find if points were redeemed for THIS bill
            if (wallet.transactions && Array.isArray(wallet.transactions)) {
              const redemptionTxn = wallet.transactions.find(t =>
                (t.type === 'redeem' || t.type === 'redeemed') &&
                (t.description?.includes(bill.billNumber) || t.metadata?.billNumber === bill.billNumber)
              );

              if (redemptionTxn) {
                redeemedPoints = Math.abs(redemptionTxn.points);
              }
            }

            // Fetch point price for calculation
            let currentPointPrice = 1; // Default
            try {
              const configResponse = await walletService.getPointPriceConfig();
              if (configResponse && configResponse.data) {
                currentPointPrice = configResponse.data.price || 1;
              } else if (configResponse && configResponse.price) {
                currentPointPrice = configResponse.price || 1;
              }
            } catch (e) {
              console.warn('Could not fetch point price', e);
            }

            if (redeemedPoints > 0) {
              pointValue = redeemedPoints * currentPointPrice;
            }

            loyaltyData = {
              totalPoints: wallet.points, // Current balance
              redeemedPoints: redeemedPoints,
              pointValue: pointValue
            };
          }
        } catch (err) {
          console.warn('Failed to fetch wallet for receipt', err);
        }
      }

      // Construct enhanced bill object
      const billWithLoyalty = {
        ...bill,
        loyalty: loyaltyData
      };

      const printWindow = window.open('', '_blank', 'width=800,height=700');
      if (!printWindow) {
        toast.error('Please allow popups to print bills');
        toast.dismiss(loadingToast);
        return;
      }

      const receiptHTML = generateReceiptHTML(billWithLoyalty, true);

      printWindow.document.write(receiptHTML);
      printWindow.document.close();

      // Auto print logic is handled by receiptGenerator with autoPrint=true
      printWindow.focus();

      toast.dismiss(loadingToast);
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print receipt');
      toast.dismiss(loadingToast);
    }
  };








  const handleDownloadReport = async () => {
    try {
      toast.loading('Generating sales report...');

      // Get date range based on filter
      let startDate, endDate;
      const now = new Date();

      switch (filterPeriod) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'week':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          endDate = new Date();
          break;
        case 'month':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          endDate = new Date();
          break;
        default:
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // Last year
          endDate = new Date();
      }

      // Fetch sales report data
      const response = await billingService.getBills({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const reportData = response.data || [];

      // Generate CSV content
      const csvContent = generateCSVReport(reportData, filterPeriod);

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `sales-report-${filterPeriod}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss();
      toast.success('Sales report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.dismiss();
      toast.error('Failed to download sales report');
    }
  };

  const generateCSVReport = (bills, period) => {
    // Calculate summary statistics
    const totalSales = bills.reduce((sum, bill) => sum + bill.total, 0);
    const billCount = bills.length;

    // Group by payment method
    const paymentMethods = bills.reduce((acc, bill) => {
      const method = bill.paymentMethod;
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0 };
      }
      acc[method].count++;
      acc[method].amount += bill.total;
      return acc;
    }, {});

    // CSV Header
    let csvContent = '\uFEFF'; // BOM for Excel compatibility
    csvContent += `Sales Report - ${period.charAt(0).toUpperCase() + period.slice(1)}\n`;
    csvContent += `Generated on: ${new Date().toLocaleString()}\n\n`;

    // Summary Section
    csvContent += 'SUMMARY\n';
    csvContent += `Report Period,${period.charAt(0).toUpperCase() + period.slice(1)}\n`;
    csvContent += `Total Bills,${billCount}\n`;
    csvContent += `Total Sales,₹${totalSales.toLocaleString()}\n`;
    csvContent += `Average Bill Value,₹${billCount > 0 ? (totalSales / billCount).toFixed(2) : 0}\n\n`;

    // Payment Methods Section
    csvContent += 'PAYMENT METHODS BREAKDOWN\n';
    csvContent += 'Method,Bills Count,Total Amount,Percentage\n';
    Object.entries(paymentMethods).forEach(([method, data]) => {
      const percentage = totalSales > 0 ? ((data.amount / totalSales) * 100).toFixed(1) : 0;
      csvContent += `${method},${data.count},₹${data.amount.toLocaleString()},${percentage}%\n`;
    });
    csvContent += '\n';

    // Staff Performance Section
    const staffPerformance = bills.reduce((acc, bill) => {
      const staffName = bill.staffName;
      if (!acc[staffName]) {
        acc[staffName] = { count: 0, amount: 0 };
      }
      acc[staffName].count++;
      acc[staffName].amount += bill.total;
      return acc;
    }, {});

    csvContent += 'STAFF PERFORMANCE\n';
    csvContent += 'Staff Name,Bills Count,Total Sales,Average Bill Value\n';
    Object.entries(staffPerformance).forEach(([staff, data]) => {
      const avgBill = data.count > 0 ? (data.amount / data.count).toFixed(2) : 0;
      csvContent += `"${staff}",${data.count},₹${data.amount.toLocaleString()},₹${avgBill}\n`;
    });
    csvContent += '\n';

    // Bills Detail Section
    csvContent += 'BILL DETAILS\n';
    csvContent += 'Bill Number,Customer Name,Customer Phone,Items Count,Total,Payment Method,Staff,Date,Time\n';

    bills.forEach(bill => {
      const date = new Date(bill.createdAt);
      csvContent += `${bill.billNumber},`;
      csvContent += `"${bill.customerName}",`;
      csvContent += `${bill.customerPhone},`;
      csvContent += `${bill.items.length},`;
      csvContent += `₹${bill.total.toLocaleString()},`;
      csvContent += `${bill.paymentMethod},`;
      csvContent += `"${bill.staffName}",`;
      csvContent += `${date.toLocaleDateString()},`;
      csvContent += `${date.toLocaleTimeString()}\n`;
    });

    return csvContent;
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.customerPhone.includes(searchTerm);

    if (filterPeriod === 'today') {
      const today = new Date().toDateString();
      return matchesSearch && new Date(bill.createdAt).toDateString() === today;
    }
    if (filterPeriod === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return matchesSearch && new Date(bill.createdAt) >= weekAgo;
    }
    if (filterPeriod === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return matchesSearch && new Date(bill.createdAt) >= monthAgo;
    }
    return matchesSearch;
  });

  const totalSales = filteredBills.reduce((sum, bill) => sum + bill.total, 0);

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
          <h1 className="text-3xl font-bold text-gray-900">Bill History</h1>
          <p className="text-gray-600 mt-2">View and manage all transactions</p>
        </div>
        <button
          onClick={handleDownloadReport}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Receipt className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{filteredBills.length}</p>
                <p className="text-gray-600">Total Bills</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">₹{totalSales.toLocaleString()}</p>
                <p className="text-gray-600">Total Sales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">₹{(totalSales / filteredBills.length || 0).toFixed(0)}</p>
                <p className="text-gray-600">Average Bill</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by bill number, customer name, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{bill.billNumber}</div>
                        <div className="text-sm text-gray-500">by {bill.staffName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{bill.customerName}</div>
                        <div className="text-sm text-gray-500">{bill.customerPhone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {bill.items.length} item{bill.items.length > 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {bill.items.some(item => item.isComboApplied || item.isCombo) && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            Combo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₹{bill.total.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bill.paymentMethod.toLowerCase() === 'cash' ? 'bg-green-100 text-green-800' :
                        bill.paymentMethod.toLowerCase() === 'upi' ? 'bg-blue-100 text-blue-800' :
                          bill.paymentMethod.toLowerCase() === 'card' ? 'bg-purple-100 text-purple-800' :
                            bill.paymentMethod.toLowerCase() === 'mix' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                        }`}>
                        {bill.paymentMethod.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(bill.createdAt).toLocaleDateString()}
                      <div className="text-xs text-gray-500">
                        {new Date(bill.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(bill)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePrintBill(bill)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Print Bill"
                        >
                          <Receipt className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredBills.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bills found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Bill Details Modal */}
      {showDetails && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Bill Details - {selectedBill.billNumber}</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium">{selectedBill.customerName}</p>
                    <p className="text-sm text-gray-600">{selectedBill.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Staff</p>
                    <p className="font-medium">{selectedBill.staffName}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Items</p>
                  <div className="border rounded-lg">
                    {selectedBill.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {(item.isComboApplied || item.isCombo) && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                {item.appliedComboName || 'Combo'}
                              </span>
                              {item.comboSavings > 0 && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Saved ₹{item.comboSavings.toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p>{item.quantity} × ₹{item.price}</p>
                          <p className="font-medium">₹{item.total}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Combo Summary */}
                {selectedBill.combos && selectedBill.combos.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Applied Combos</h4>
                    {selectedBill.combos.map((combo, index) => (
                      <div key={index} className="flex justify-between text-sm text-green-700 mb-1">
                        <span>⭐ {combo.name || combo.comboName}</span>
                        <span>₹{combo.offerPrice ? combo.offerPrice.toLocaleString() : 'N/A'}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-medium text-green-800 border-t border-green-200 pt-2 mt-2">
                      <span>Total Savings:</span>
                      <span>₹{selectedBill.items.reduce((sum, item) => sum + (item.comboSavings || 0), 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    {(() => {
                      const gstData = calculateGSTBreakdown(selectedBill.items || []);
                      return (
                        <>
                          <div className="flex justify-between">
                            <span>Product Price (Excl. GST):</span>
                            <span>₹{gstData.totalWithoutGST.toLocaleString()}</span>
                          </div>

                          {/* GST Breakdown */}
                          <div className="border-t pt-2">
                            <div className="text-sm text-gray-600 mb-2">GST Breakdown:</div>
                            {gstData.sgst5 > 0 && (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span>SGST (2.5%):</span>
                                  <span>₹{gstData.sgst5.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>CGST (2.5%):</span>
                                  <span>₹{gstData.cgst5.toLocaleString()}</span>
                                </div>
                              </>
                            )}
                            {gstData.sgst12 > 0 && (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span>SGST (6%):</span>
                                  <span>₹{gstData.sgst12.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>CGST (6%):</span>
                                  <span>₹{gstData.cgst12.toLocaleString()}</span>
                                </div>
                              </>
                            )}
                          </div>

                          {selectedBill.combos && selectedBill.combos.length > 0 && (
                            <div className="flex justify-between text-green-600 border-t pt-2">
                              <span>Combo Discount:</span>
                              <span>-₹{selectedBill.items.reduce((sum, item) => sum + (item.comboSavings || 0), 0).toLocaleString()}</span>
                            </div>
                          )}

                          <div className="flex justify-between font-bold text-lg border-t pt-2">
                            <span>Total Amount (Incl. GST):</span>
                            <span>₹{selectedBill.total.toLocaleString()}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium">{selectedBill.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="font-medium">
                      {new Date(selectedBill.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handlePrintBill(selectedBill)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Print Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillHistoryPage;