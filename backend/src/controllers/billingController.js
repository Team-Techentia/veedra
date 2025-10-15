const asyncHandler = require('express-async-handler');
const Billing = require('../models/Billing');
const createBill = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    message: 'Billing functionality coming soon'
  });
});

const getBills = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, search } = req.query;

    // Build query
    let query = {};
    
    // Date range filter
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Search filter
    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const bills = await Billing.find(query)
      .populate('billedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Billing.countDocuments(query);

    // Transform data for frontend
    const transformedBills = bills.map(bill => {
      // Ensure we're using the correct total amount
      const correctTotal = Math.max(0, bill.totals?.finalAmount || bill.totals?.grandTotal || 0);
      
      return {
        _id: bill._id,
        billNumber: bill.billNumber,
        customerName: bill.customer?.name || 'Walk-in Customer',
        customerPhone: bill.customer?.phone || 'N/A',
        items: bill.items.map(item => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.unitPrice,
          total: item.totalAmount,
          isCombo: item.comboAssignment?.isComboItem || false
        })),
        subtotal: bill.totals?.subtotal || 0,
        tax: bill.totals?.totalTax || 0,
        total: correctTotal,
        paymentMethod: bill.payment?.method || 'cash',
        staffName: bill.billerName || 'Unknown Staff',
        createdAt: bill.createdAt,
        status: bill.status,
        transactionId: bill.payment?.transactionId || null
      };
    });

    res.json({
      success: true,
      data: transformedBills,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill history'
    });
  }
});

const getBill = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    data: null,
    message: 'Billing functionality coming soon'
  });
});

const updateBill = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    message: 'Bill update coming soon'
  });
});

const deleteBill = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    message: 'Bill deletion coming soon'
  });
});

const generateInvoice = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    message: 'Invoice generation coming soon'
  });
});

const getDailySales = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to today if no dates provided
    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999));

    const bills = await Billing.find({
      createdAt: { $gte: start, $lte: end },
      status: 'completed'
    }).populate('billedBy', 'firstName lastName');

    const totalSales = bills.reduce((sum, bill) => sum + bill.totals.finalAmount, 0);
    const totalTax = bills.reduce((sum, bill) => sum + bill.totals.totalTax, 0);
    const billCount = bills.length;

    // Group by payment method
    const paymentMethods = bills.reduce((acc, bill) => {
      const method = bill.payment.method;
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0 };
      }
      acc[method].count++;
      acc[method].amount += bill.totals.finalAmount;
      return acc;
    }, {});

    // Group by staff
    const staffSales = bills.reduce((acc, bill) => {
      const staffName = bill.billerName;
      if (!acc[staffName]) {
        acc[staffName] = { count: 0, amount: 0 };
      }
      acc[staffName].count++;
      acc[staffName].amount += bill.totals.finalAmount;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        summary: {
          totalSales,
          totalTax,
          billCount,
          averageBillValue: billCount > 0 ? totalSales / billCount : 0
        },
        paymentMethods,
        staffSales,
        bills: bills.map(bill => ({
          billNumber: bill.billNumber,
          customerName: bill.customer?.name || 'Walk-in Customer',
          amount: bill.totals.finalAmount,
          paymentMethod: bill.payment.method,
          staff: bill.billerName,
          createdAt: bill.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate sales report'
    });
  }
});

const getStaffSales = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    data: { totalSales: 0, commission: 0 },
    message: 'Staff sales report coming soon'
  });
});

module.exports = {
  createBill,
  getBills,
  getBill,
  updateBill,
  deleteBill,
  generateInvoice,
  getDailySales,
  getStaffSales
};