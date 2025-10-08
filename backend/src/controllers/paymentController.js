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

    // Create billing record
    const billingData = {
      billNumber,
      customer: customerInfo || {},
      items: cartItems.map(item => ({
        product: item._id,
        productName: item.name,
        productCode: item.productCode || item.code,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity
      })),
      subtotal,
      tax: taxAmount,
      discount: comboDiscount,
      totalAmount: totalAmount,
      paymentMethod,
      paymentStatus: 'completed',
      billingStaff: req.user.id,
      appliedCombos: combos.map(combo => ({
        comboId: combo.comboId,
        comboName: combo.comboName,
        discountAmount: combo.discount
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

    // Update product stock
    for (const item of cartItems) {
      try {
        await Product.findByIdAndUpdate(
          item._id,
          { 
            $inc: { 'inventory.currentStock': -item.quantity },
            $set: { 'inventory.lastUpdated': new Date() }
          }
        );
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