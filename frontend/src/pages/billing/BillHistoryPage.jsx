import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Search, Filter, Calendar, Download, Eye, Receipt, DollarSign, XCircle, Trash2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import billingService from '../../services/billingService';
import walletService from '../../services/walletService';
import generateReceiptHTML from '../../utils/receiptGenerator';

// GST calculation function
const calculateGSTBreakdown = (items = []) => {
  const hasHighValueProduct = items.some(item => {
    const itemPrice = item.isCombo ? item.comboPrice : item.price;
    return (itemPrice || 0) > 2500;
  });

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

  if (hasHighValueProduct) {
    totalWithoutGST = totalBillAmount / 1.12;
    gstAmount = totalBillAmount - totalWithoutGST;
  } else {
    totalWithoutGST = totalBillAmount / 1.05;
    gstAmount = totalBillAmount - totalWithoutGST;
  }

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

  // Advanced Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hsnFilter, setHsnFilter] = useState('');

  const [selectedBill, setSelectedBill] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    count: 0,
    sales: 0,
    average: 0
  });

  useEffect(() => {
    loadBills();
  }, [startDate, endDate, paymentFilter, statusFilter, hsnFilter]);
  // Trigger load on filter change (debounced search handles its own)

  // Reload bills when search term changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadBills();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadBills = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm,
        paymentMethod: paymentFilter,
        status: statusFilter,
        hsnCode: hsnFilter
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const result = await billingService.getBills(params);

      const fetchedBills = result.data || [];
      setBills(fetchedBills);

      // Calculate Stats Locally based on fetched filtered data
      // (Backend pagination might affect this if we had huge data, but for now client-side aggregation of fetched page or we rely on backend stats if implemented. 
      // Current usage implies fetching all matching or first page. If pagination exists, this total might be just page total. 
      // For accurate totals with pagination, backend should return stats. 
      // Assuming 'limit' is high or we sum up what we got.)

      const totalSales = fetchedBills.reduce((sum, bill) => sum + (bill.total || 0), 0);
      setStats({
        count: fetchedBills.length,
        sales: totalSales,
        average: fetchedBills.length > 0 ? totalSales / fetchedBills.length : 0
      });

    } catch (error) {
      console.error('Error loading bills:', error);
      toast.error('Failed to load bill history');
      setBills([]);
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
      if (bill.customerPhone && bill.customerPhone !== 'N/A' && /^\d{10}$/.test(bill.customerPhone)) {
        try {
          const response = await walletService.getWalletByPhone(bill.customerPhone);
          const wallet = response.data || response;
          if (wallet) {
            let redeemedPoints = 0;
            let pointValue = 0;
            if (wallet.transactions && Array.isArray(wallet.transactions)) {
              const redemptionTxn = wallet.transactions.find(t =>
                (t.type === 'redeem' || t.type === 'redeemed') &&
                (t.description?.includes(bill.billNumber) || t.metadata?.billNumber === bill.billNumber)
              );
              if (redemptionTxn) redeemedPoints = Math.abs(redemptionTxn.points);
            }
            let currentPointPrice = 1;
            try {
              const configResponse = await walletService.getPointConfig();
              if (configResponse?.data?.pointPrice) currentPointPrice = configResponse.data.pointPrice;
            } catch (e) {
              // ignore
            }
            if (redeemedPoints > 0) pointValue = redeemedPoints * currentPointPrice;
            loyaltyData = { totalPoints: wallet.points, redeemedPoints, pointValue };
          }
        } catch (err) { console.warn('Failed to fetch wallet', err); }
      }
      const billWithLoyalty = { ...bill, loyalty: loyaltyData };
      const printWindow = window.open('', '_blank', 'width=800,height=700');
      if (!printWindow) {
        toast.error('Please allow popups');
        return;
      }
      const receiptHTML = generateReceiptHTML(billWithLoyalty, true);
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.focus();
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print receipt');
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const handleCancelBill = async (bill) => {
    if (!window.confirm(`Are you sure you want to cancel Bill ${bill.billNumber}? \n\nThis will restore stock and rollback wallet points.`)) {
      return;
    }
    const loadingToast = toast.loading('Cancelling bill...');
    try {
      await billingService.cancelBill(bill._id);
      toast.success('Bill cancelled successfully');
      loadBills();
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel bill');
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const handleDeleteOldBills = async () => {
    if (!startDate) {
      toast.error('Please select a "From Date" to define the cutoff for deletion.');
      return;
    }
    const cutoffDate = new Date(startDate);
    const confirmMsg = `WARNING: This will PERMANENTLY DELETE all bills created BEFORE ${cutoffDate.toDateString()}.\n\nThis action cannot be undone.\n\nAre you absolutely sure?`;

    if (window.confirm(confirmMsg)) {
      if (window.confirm('Double Check: Require confirmation to proceed with BULK DELETION.')) {
        const loadingToast = toast.loading('Deleting old bills...');
        try {
          const result = await billingService.deleteOldBills(startDate);
          toast.success(`Deleted ${result.deletedCount} old bills.`);
          loadBills();
        } catch (error) {
          console.error('Delete error', error);
          toast.error('Failed to delete old bills');
        } finally {
          toast.dismiss(loadingToast);
        }
      }
    }
  };

  const handleDownloadReport = async (type = 'csv') => {
    try {
      toast.loading(`Generating ${type.toUpperCase()} report...`);
      // Use current filters
      const params = {
        startDate,
        endDate,
        paymentMethod: paymentFilter,
        status: statusFilter,
        hsnCode: hsnFilter,
        search: searchTerm,
        limit: 5000 // Increase limit for export
      };

      const response = await billingService.getBills(params); // Use getBills to respect all filters
      const reportData = response.data || [];

      if (reportData.length === 0) {
        toast.dismiss();
        toast.error('No data to export');
        return;
      }

      if (type === 'csv') {
        const csvContent = generateCSVReport(reportData);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Simple PDF logic (Printing the list)
        // For a true PDF, we'd need a library. 
        // Alternative: Open a print window with table data
        printReport(reportData);
      }

      toast.dismiss();
      toast.success('Report generated!');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.dismiss();
      toast.error('Failed to generate report');
    }
  };

  const printReport = (data) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    // Flatten items for report
    const flatRows = [];
    data.forEach(bill => {
      // If bill has items, add each; else add bill info with empty product cells
      if (bill.items && bill.items.length > 0) {
        bill.items.forEach(item => {
          flatRows.push({
            date: new Date(bill.createdAt).toLocaleDateString(),
            billNo: bill.billNumber,
            customer: bill.customerName,
            payment: bill.paymentMethod,
            status: bill.status,
            product: item.name,
            hsn: item.hsnCode || 'N/A',
            qty: item.quantity,
            price: item.price,
            total: item.total
          });
        });
      } else {
        flatRows.push({
          date: new Date(bill.createdAt).toLocaleDateString(),
          billNo: bill.billNumber,
          customer: bill.customerName,
          payment: bill.paymentMethod,
          status: bill.status,
          product: '-',
          hsn: '-',
          qty: 0,
          price: 0,
          total: bill.total
        });
      }
    });

    const html = `
        <html>
        <head>
            <title>Sales Report</title>
            <style>
                body { font-family: sans-serif; padding: 20px; font-size: 11px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 5px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                header { text-align: center; margin-bottom: 20px; }
                h1 { margin: 0; font-size: 20px; }
                .summary { margin-top: 5px; font-size: 13px; color: #555; }
            </style>
        </head>
        <body>
            <header>
                <h1>Sales Report</h1>
                <div class="summary">
                    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Total Bills:</strong> ${data.length} | <strong>Total Sales:</strong> ₹${data.reduce((s, b) => s + b.total, 0).toLocaleString()}</p>
                </div>
            </header>
            <table>
                <thead>
                    <tr>
                        <th style="width: 80px;">Date</th>
                        <th style="width: 100px;">Bill #</th>
                        <th>Customer</th>
                        <th style="width: 200px;">Product</th>
                        <th style="width: 80px;">HSN</th>
                        <th style="width: 40px;">Qty</th>
                        <th style="width: 60px;">Amount</th>
                        <th style="width: 60px;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${flatRows.map(row => `
                        <tr>
                            <td>${row.date}</td>
                            <td>${row.billNo}</td>
                            <td>${row.customer}<br/><span style="color:#888;font-size:9px">${row.payment}</span></td>
                            <td>${row.product}</td>
                            <td>${row.hsn}</td>
                            <td>${row.qty}</td>
                            <td>₹${row.price}</td>
                            <td>₹${row.total}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <script>window.print();</script>
        </body>
        </html>
      `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const generateCSVReport = (bills) => {
    // CSV Header with Product Details
    let csv = `Bill Number,Date,Customer,Phone,Product Name,HSN Code,Quantity,Price,Total,Bill Amount,Payment,Status\n`;

    bills.forEach(b => {
      const date = new Date(b.createdAt).toLocaleDateString();
      // Format phone as formula to enforce text in Excel
      const phone = b.customerPhone ? `="${b.customerPhone}"` : 'N/A';
      // Format Bill Number and Date as formula to avoid Scientific Notation & Hash Width Issues
      const billNo = `="${b.billNumber}"`;
      const dateStr = `="${date}"`;

      if (b.items && b.items.length > 0) {
        b.items.forEach(item => {
          // sanitize strings
          const cleanName = (item.name || '').replace(/,/g, ' ');
          const hsn = item.hsnCode || 'N/A';
          // Using explicit text formula for BillNo and Date
          csv += `${billNo},${dateStr},"${b.customerName}",${phone},"${cleanName}",${hsn},${item.quantity},${item.price},${item.total},${b.total},${b.paymentMethod},${b.status}\n`;
        });
      } else {
        // Fallback for empty items (shouldn't happen for valid bills)
        csv += `${billNo},${dateStr},"${b.customerName}",${phone},N/A,N/A,0,0,0,${b.total},${b.paymentMethod},${b.status}\n`;
      }
    });

    return csv;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bill History</h1>
          <p className="text-gray-600 mt-2">Manage transactions & reports</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleDownloadReport('csv')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" /> Excel
          </button>
          <button
            onClick={() => handleDownloadReport('pdf')}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <FileText className="h-4 w-4 mr-2" /> PDF
          </button>
          <button
            onClick={handleDeleteOldBills}
            className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
            title="Delete bills older than selected 'From Date'"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Cleanup Old Data
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center">
            <Receipt className="h-8 w-8 text-blue-600 mr-4" />
            <div>
              <p className="text-2xl font-bold">{stats.count}</p>
              <p className="text-gray-600">Total Bills</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center">
            <DollarSign className="h-8 w-8 text-green-600 mr-4" />
            <div>
              <p className="text-2xl font-bold">₹{stats.sales.toLocaleString()}</p>
              <p className="text-gray-600">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600 mr-4" />
            <div>
              <p className="text-2xl font-bold">₹{stats.average.toFixed(0)}</p>
              <p className="text-gray-600">Avg. Bill Value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Filters Row 1: Search & Dates */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search Bill #, Customer, Phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Filters Row 2: Dropdowns */}
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 flex-1"
            >
              <option value="all">All Payment Modes</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="mix">Mix</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 flex-1"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <input
              type="text"
              placeholder="Filter by HSN Code"
              value={hsnFilter}
              onChange={(e) => setHsnFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 flex-1"
            />

            {/* Clear Filters Button */}
            {(startDate || endDate || paymentFilter !== 'all' || statusFilter !== 'all' || hsnFilter) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setPaymentFilter('all');
                  setStatusFilter('all');
                  setHsnFilter('');
                  setSearchTerm('');
                }}
                className="text-red-600 hover:text-red-800 text-sm font-medium px-2"
              >
                Clear Filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{bill.billNumber}</div>
                      {bill.status === 'cancelled' && <span className="text-xs text-red-600 font-bold">CANCELLED</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>{bill.customerName}</div>
                      <div className="text-xs text-gray-500">{bill.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 line-clamp-2" title={bill.items.map(i => `${i.name} (${i.hsnCode || 'N/A'})`).join(', ')}>
                        {bill.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="truncate max-w-[200px]">
                            {item.name} <span className="text-xs text-gray-500">[{item.hsnCode || 'No HSN'}]</span>
                          </div>
                        ))}
                        {bill.items.length > 2 && <span className="text-xs text-gray-500">+{bill.items.length - 2} more...</span>}
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
                        <button onClick={() => handleViewDetails(bill)} className="text-blue-600"><Eye className="h-4 w-4" /></button>
                        <button onClick={() => handlePrintBill(bill)} className="text-green-600"><Receipt className="h-4 w-4" /></button>
                        {bill.status !== 'cancelled' && (
                          <button onClick={() => handleCancelBill(bill)} className="text-red-600"><XCircle className="h-4 w-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal Reused logic here ideally or strictly render if showDetails true */}
      {showDetails && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Bill {selectedBill.billNumber}</h2>
              <button onClick={() => setShowDetails(false)}>✕</button>
            </div>
            {/* Details Content reused from previous implementation */}
            <div className="space-y-4">
              <div className="grid grid-cols-2">
                <div>
                  <p className="text-gray-600">Customer</p>
                  <p className="font-bold">{selectedBill.customerName}</p>
                  <p>{selectedBill.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600">Total</p>
                  <p className="font-bold text-xl">₹{selectedBill.total}</p>
                </div>
              </div>
              <div>
                <h3 className="font-bold border-b pb-2">Items</h3>
                {selectedBill.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        HSN: {item.hsnCode || 'N/A'} • Qty: {item.quantity}
                      </div>
                    </div>
                    <span>₹{item.total}</span>
                  </div>
                ))}
              </div>
              {/* Simplified GST Display for modal to save complexity code duplication */}
              <div className="bg-gray-100 p-3 rounded">
                <p className="flex justify-between"><span>Subtotal:</span> <span>₹{selectedBill.subtotal}</span></p>
                <p className="flex justify-between"><span>Tax:</span> <span>₹{selectedBill.tax}</span></p>
                <p className="flex justify-between font-bold border-t border-gray-300 mt-2 pt-2"><span>Total:</span> <span>₹{selectedBill.total}</span></p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => handlePrintBill(selectedBill)} className="bg-blue-600 text-white px-4 py-2 rounded">Print</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BillHistoryPage;