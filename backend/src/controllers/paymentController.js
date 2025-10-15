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
      mixPaymentDetails,
      customerInfo,
      combos = [],
      combosAlreadyApplied = false,
      totalSavings = 0
    } = req.body;

    console.log('Processing payment:', paymentMethod, '₹' + amount);
    console.log('🔍 Received data:', {
      cartItemsCount: cartItems.length,
      combosAlreadyApplied,
      totalSavings,
      amount,
      combosCount: combos.length
    });

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

    // Validate mix payment details if payment method is Mix
    if (paymentMethod.toLowerCase() === 'mix') {
      if (!mixPaymentDetails || typeof mixPaymentDetails !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Mix payment details are required for Mix payment method'
        });
      }

      const { cash = 0, card = 0, upi = 0 } = mixPaymentDetails;
      const mixTotal = parseFloat(cash) + parseFloat(card) + parseFloat(upi);
      
      console.log('Mix payment validation:', { 
        cash: parseFloat(cash), 
        card: parseFloat(card), 
        upi: parseFloat(upi), 
        mixTotal, 
        amount,
        difference: Math.abs(mixTotal - amount)
      });
      
      if (Math.abs(mixTotal - amount) > 0.01) {
        console.log('❌ Mix payment validation failed:', {
          mixTotal,
          amount,
          difference: Math.abs(mixTotal - amount)
        });
        return res.status(400).json({
          success: false,
          message: `Mix payment total (₹${mixTotal.toFixed(2)}) must equal bill amount (₹${amount.toFixed(2)})`
        });
      }
    }

    // Calculate totals - check if combos are already applied in frontend
    let subtotal, comboDiscount, totalAmount;
    
    // No tax - GST already included in product prices
    const taxAmount = 0;
    
    if (combosAlreadyApplied) {
      // Frontend has already calculated correct prices for combo items
      subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      comboDiscount = totalSavings; // Use savings calculated in frontend
      totalAmount = subtotal; // No additional discount needed
      
      console.log('💰 Bill calculation (combos pre-applied):', {
        subtotal: subtotal.toFixed(2),
        comboSavings: comboDiscount.toFixed(2),
        totalAmount: totalAmount.toFixed(2)
      });
    } else {
      // Legacy calculation for backwards compatibility
      subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      comboDiscount = combos.reduce((sum, combo) => sum + (combo.discount || 0), 0);
      
      // Ensure total never goes negative
      totalAmount = Math.max(0, subtotal - comboDiscount);
      
      console.log('💰 Bill calculation (legacy):', {
        subtotal: subtotal.toFixed(2),
        comboDiscount: comboDiscount.toFixed(2),
        totalAmount: totalAmount.toFixed(2)
      });
    }

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
        taxRate: 0, // No additional tax - GST included in prices
        taxAmount: 0, // No additional tax
        totalAmount: item.price * item.quantity
      })),
      totals: {
        subtotal,
        totalDiscount: 0,
        comboSavings: comboDiscount,
        taxableAmount: Math.max(0, subtotal - comboDiscount),
        totalTax: taxAmount,
        grandTotal: totalAmount,
        roundOff: 0,
        finalAmount: totalAmount
      },
      taxBreakdown: [{
        taxRate: 18,
        taxableAmount: subtotal - comboDiscount,
        cgst: 0, // GST already included in product prices
        sgst: 0,
        igst: 0,
        totalTax: 0
      }],
        payment: {
        method: paymentMethod,
        mixPaymentDetails: paymentMethod.toLowerCase() === 'mix' ? mixPaymentDetails : undefined,
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
    
    try {
      await billing.save();
      console.log('✅ Billing record created successfully:', billing._id);
    } catch (billingError) {
      console.error('❌ Billing validation error:', billingError.message);
      console.error('Billing data that failed:', JSON.stringify(billingData, null, 2));
      throw billingError;
    }

    // Create payment record
    const changeAmount = Math.max(0, (receivedAmount || totalAmount) - totalAmount);
    
    const paymentData = {
      billId: billing._id,
      amount: totalAmount,
      receivedAmount: receivedAmount || totalAmount,
      paymentMethod,
      mixPaymentDetails: paymentMethod.toLowerCase() === 'mix' ? mixPaymentDetails : undefined,
      status: 'completed',
      transactionId,
      processedBy: req.user.id,
      customerInfo,
      changeAmount
    };

    const payment = new Payment(paymentData);
    
    try {
      await payment.save();
      console.log('✅ Payment record created successfully:', payment._id);
    } catch (paymentError) {
      console.error('❌ Payment validation error:', paymentError.message);
      console.error('Payment data that failed:', JSON.stringify(paymentData, null, 2));
      throw paymentError;
    }

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

    const response = {
      success: true,
      message: 'Payment processed successfully',
      billing,
      payment,
      billNumber,
      transactionId,
      changeAmount,
      totalAmount
    };
    
    console.log('✅ Sending success response:', { success: response.success, message: response.message });
    res.status(201).json(response);

  } catch (error) {
    console.error('❌ Payment processing error:', error);
    console.error('❌ Error stack:', error.stack);
    if (error.name === 'ValidationError') {
      console.error('❌ Validation errors:', error.errors);
    }
    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: error.message,
      details: error.name === 'ValidationError' ? Object.keys(error.errors) : undefined
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