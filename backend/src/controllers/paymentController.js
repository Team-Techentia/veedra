const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Billing = require('../models/Billing');

const processPayment = async (req, res) => {
  try {
    const {
      cartItems,
      paymentMethod,
      amount,
      receivedAmount,
      customerInfo,
      combos = []
    } = req.body;

    console.log('Processing payment:', { cartItems, paymentMethod, amount, receivedAmount });

    // Validate required fields
    if (!cartItems || !cartItems.length) {
      return res.status(400).json({
        success: false,
        message: 'Cart items are required'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = subtotal * 0.18; // 18% GST
    const comboDiscount = combos.reduce((sum, combo) => sum + (combo.discount || 0), 0);
    const totalAmount = subtotal + taxAmount - comboDiscount;

    // Generate unique identifiers
    const billNumber = `BILL${Date.now()}`;
    const transactionId = `TXN${Date.now()}`;

    // Create billing record with enhanced structure
    const billingData = {
      billNumber,
      billType: combos.length > 0 ? 'combo' : 'normal',
      customer: customerInfo || {},
      items: cartItems.map(item => ({
        product: item._id,
        productName: item.name,
        productCode: item.productCode || item.code,
        barcode: item.barcode,
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        unit: 'piece',
        unitPrice: item.price, // This is the discounted price
        mrp: item.mrp || item.offerPrice || item.price,
        discount: Math.max(0, (item.offerPrice || item.price) - item.price), // Discount from offer to discounted price
        taxRate: item.gstRate || 18,
        taxAmount: (item.price * item.quantity) * ((item.gstRate || 18) / 100),
        totalAmount: item.price * item.quantity
      })),
      totals: {
        subtotal,
        totalDiscount: 0, // Will be calculated in pre-save
        comboSavings: comboDiscount,
        taxableAmount: subtotal - comboDiscount,
        totalTax: taxAmount,
        grandTotal: totalAmount,
        roundOff: 0,
        finalAmount: totalAmount
      },
      payment: {
        method: paymentMethod,
        status: 'paid',
        amountReceived: receivedAmount || totalAmount,
        changeGiven: Math.max(0, (receivedAmount || totalAmount) - totalAmount),
        transactionId
      },
      billedBy: req.user.id,
      billerName: `${req.user.firstName} ${req.user.lastName}`,
      appliedCombos: combos.map(combo => ({
        combo: combo.comboId,
        comboName: combo.comboName,
        comboCode: `COMBO-${combo.comboId}`,
        originalAmount: subtotal,
        discountAmount: combo.discount,
        finalAmount: subtotal - combo.discount,
        savingsAmount: combo.discount,
        itemsCount: cartItems.length
      }))
    };

    const billing = new Billing(billingData);
    await billing.save();

    // Create payment record
    const changeAmount = Math.max(0, (receivedAmount || totalAmount) - totalAmount);
    
    const paymentData = {
      billId: billing._id,
      amount: totalAmount,
      receivedAmount: receivedAmount || totalAmount,
      paymentMethod,
      status: 'completed',
      transactionId,
      processedBy: req.user.id,
      customerInfo,
      changeAmount
    };

    const payment = new Payment(paymentData);
    await payment.save();

    // Update product stock and sales statistics
    for (const item of cartItems) {
      try {
        const updateResult = await Product.findByIdAndUpdate(
          item._id,
          { 
            $inc: { 
              'inventory.currentStock': -item.quantity,
              'totalSold': item.quantity,
              'totalRevenue': item.price * item.quantity
            },
            $set: { 'inventory.lastUpdated': new Date() }
          },
          { new: true }
        );

        // Check if stock is low and log warning
        if (updateResult && updateResult.inventory.currentStock <= updateResult.inventory.reorderPoint) {
          console.warn(`Low stock alert: Product ${updateResult.name} (${updateResult.code}) has ${updateResult.inventory.currentStock} units left`);
        }
      } catch (stockError) {
        console.error(`Error updating stock for product ${item._id}:`, stockError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        billing,
        payment,
        billNumber,
        transactionId,
        changeAmount,
        totalAmount
      }
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: error.message
    });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const payments = await Payment.find(query)
      .populate('billId')
      .populate('processedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
};

module.exports = {
  processPayment,
  getPaymentHistory
};