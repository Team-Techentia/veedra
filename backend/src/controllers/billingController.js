const asyncHandler = require('express-async-handler');
const Billing = require('../models/Billing');
const Product = require('../models/Product');

// Create a new bill
const createBill = asyncHandler(async (req, res) => {
  try {
    console.log('📥 Received bill data:', JSON.stringify(req.body, null, 2));
    
    const {
      customer,
      items,
      totals,
      payment,
      billedBy,
      status
    } = req.body;

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart cannot be empty'
      });
    }

    // ✅ STOCK VALIDATION - Check if all items have sufficient stock
    for (const item of items) {
      const product = await Product.findById(item.product || item._id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productName || 'Unknown'}`
        });
      }

      const availableStock = product.inventory?.currentStock || 0;
      const requestedQty = Number(item.quantity) || 0;

      if (availableStock < requestedQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${requestedQty}`
        });
      }
    }

    // Generate bill number
    const billCount = await Billing.countDocuments();
    const billNumber = `BILL${String(billCount + 1).padStart(6, '0')}`;

    // Transform items to match schema
    const billItems = items.map(item => {
      console.log('Processing item:', item);
      
      return {
        product: item.product || item._id,
        productName: item.productName || item.name,
        productCode: item.productCode || item.code || item.sku || 'N/A',
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || Number(item.price) || 0,
        mrp: Number(item.mrp) || Number(item.originalPrice) || Number(item.unitPrice) || Number(item.price) || 0,
        totalAmount: Number(item.totalAmount) || (Number(item.unitPrice || item.price) * Number(item.quantity)),
        tax: Number(item.tax) || 0,
        discount: Number(item.discount) || 0,
        comboAssignment: item.comboAssignment || null
      };
    });

    console.log('✅ Transformed bill items:', billItems);

    // Calculate totals safely
    const calculatedSubtotal = billItems.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
    const totalTax = billItems.reduce((sum, item) => sum + (Number(item.tax) || 0), 0);
    const totalDiscount = Number(totals?.totalDiscount) || 0;
    const grandTotal = calculatedSubtotal - totalDiscount;
    const finalAmount = Number(totals?.finalAmount) || Number(payment?.amount) || grandTotal;

    console.log('💰 Calculated totals:', {
      calculatedSubtotal,
      totalTax,
      totalDiscount,
      grandTotal,
      finalAmount
    });

    // Determine payment status - map 'completed' to 'paid'
    let paymentStatus = payment?.status || 'paid';
    if (paymentStatus === 'completed') {
      paymentStatus = 'paid';
    }

    // Create bill object
    const billData = {
      billNumber,
      customer: {
        name: customer?.name || 'Walk-in Customer',
        phone: customer?.phone || '',
        email: customer?.email || ''
      },
      items: billItems,
      totals: {
        subtotal: Number(totals?.subtotal) || calculatedSubtotal,
        totalTax: totalTax,
        totalDiscount: totalDiscount,
        grandTotal: grandTotal,
        finalAmount: finalAmount
      },
      payment: {
        method: payment?.method || 'cash',
        amount: Number(payment?.amount) || finalAmount,
        receivedAmount: Number(payment?.receivedAmount) || Number(payment?.amount) || finalAmount,
        changeGiven: Number(payment?.changeGiven) || 0,
        transactionId: payment?.transactionId || null,
        status: paymentStatus
      },
      billedBy: req.user?._id || null,
      billerName: billedBy || req.user?.name || req.user?.firstName || 'Staff',
      status: status || 'completed',
      metadata: {
        mixPaymentDetails: payment?.mixPaymentDetails || null
      }
    };

    console.log('💾 Final bill data to save:', JSON.stringify(billData, null, 2));

    // Save bill to database
    const bill = await Billing.create(billData);

    console.log('✅ Bill saved successfully:', bill._id);

    // ✅ REDUCE STOCK FOR ALL ITEMS
    console.log('📦 Reducing stock for sold items...');
    for (const item of billItems) {
      try {
        const product = await Product.findById(item.product);
        
        if (product) {
          // Reduce product stock
          const oldStock = product.inventory.currentStock;
          product.inventory.currentStock = Math.max(0, oldStock - item.quantity);
          
          // Update total sold
          product.totalSold = (product.totalSold || 0) + item.quantity;
          
          await product.save();
          
          console.log(`✅ Stock reduced for ${product.name}: ${oldStock} → ${product.inventory.currentStock} (-${item.quantity})`);

          // If product has parent (variant case), reduce parent stock too
          if (product.parentProduct) {
            const parentProduct = await Product.findById(product.parentProduct);
            if (parentProduct) {
              const oldParentStock = parentProduct.inventory.currentStock;
              parentProduct.inventory.currentStock = Math.max(0, oldParentStock - item.quantity);
              parentProduct.totalSold = (parentProduct.totalSold || 0) + item.quantity;
              await parentProduct.save();
              console.log(`✅ Parent stock reduced: ${oldParentStock} → ${parentProduct.inventory.currentStock} (-${item.quantity})`);
            }
          }
        }
      } catch (stockError) {
        console.error(`⚠️ Failed to reduce stock for item ${item.productName}:`, stockError);
        // Continue with other items even if one fails
      }
    }

    // Populate biller details if available
    if (bill.billedBy) {
      await bill.populate('billedBy', 'firstName lastName email');
    }

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: {
        _id: bill._id,
        billNumber: bill.billNumber,
        customer: bill.customer,
        items: bill.items,
        subtotal: bill.totals.subtotal,
        tax: bill.totals.totalTax,
        discount: bill.totals.totalDiscount,
        total: bill.totals.finalAmount,
        paymentMethod: bill.payment.method,
        staffName: bill.billerName,
        createdAt: bill.createdAt,
        transactionId: bill.payment.transactionId
      }
    });

  } catch (error) {
    console.error('❌ Error creating bill:', error);
    console.error('Error details:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create bill',
      error: error.message
    });
  }
});

// Get all bills
const getBills = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 1000, startDate, endDate, search } = req.query;

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
  try {
    const bill = await Billing.findById(req.params.id)
      .populate('billedBy', 'firstName lastName email');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.json({
      success: true,
      data: bill
    });
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill'
    });
  }
});

const updateBill = asyncHandler(async (req, res) => {
  try {
    const bill = await Billing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.json({
      success: true,
      message: 'Bill updated successfully',
      data: bill
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bill'
    });
  }
});

const deleteBill = asyncHandler(async (req, res) => {
  try {
    const bill = await Billing.findByIdAndDelete(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.json({
      success: true,
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bill'
    });
  }
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
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999));

    const bills = await Billing.find({
      createdAt: { $gte: start, $lte: end },
      status: 'completed'
    }).populate('billedBy', 'firstName lastName');

    const totalSales = bills.reduce((sum, bill) => sum + bill.totals.finalAmount, 0);
    const totalTax = bills.reduce((sum, bill) => sum + bill.totals.totalTax, 0);
    const billCount = bills.length;

    const paymentMethods = bills.reduce((acc, bill) => {
      const method = bill.payment.method;
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0 };
      }
      acc[method].count++;
      acc[method].amount += bill.totals.finalAmount;
      return acc;
    }, {});

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
  try {
    const staffId = req.params.staffId || req.user._id;
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999));

    const bills = await Billing.find({
      billedBy: staffId,
      createdAt: { $gte: start, $lte: end },
      status: 'completed'
    });

    const totalSales = bills.reduce((sum, bill) => sum + bill.totals.finalAmount, 0);
    const billCount = bills.length;
    const commission = totalSales * 0.02; // 2% commission example

    res.json({
      success: true,
      data: {
        totalSales,
        billCount,
        commission,
        averageBillValue: billCount > 0 ? totalSales / billCount : 0
      }
    });
  } catch (error) {
    console.error('Error fetching staff sales:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff sales'
    });
  }
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