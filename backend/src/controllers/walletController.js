const Wallet = require('../models/Wallet');
const Billing = require('../models/Billing');
const PointRule = require('../models/PointRule');
const asyncHandler = require('express-async-handler');

// @desc    Get wallet by phone number
// @route   GET /api/wallets/phone/:phone
// @access  Private
const getWalletByPhone = asyncHandler(async (req, res) => {
  const { phone } = req.params;

  console.log(`📱 [getWalletByPhone] Request for phone: ${phone}`);

  // Validate phone format
  if (!/^\d{10}$/.test(phone)) {
    console.log(`❌ [getWalletByPhone] Invalid phone format: ${phone}`);
    res.status(400);
    throw new Error('Invalid phone number format. Must be 10 digits.');
  }

  let wallet = await Wallet.findOne({ phone });

  // Lookup name from Billing history if wallet missing or has default name
  let historicalName = '';
  if (!wallet || wallet.customerName === 'Customer') {
    try {
      const lastBill = await Billing.findOne({ 'customer.phone': phone })
        .sort({ createdAt: -1 })
        .select('customer.name');

      if (lastBill && lastBill.customer && lastBill.customer.name) {
        historicalName = lastBill.customer.name;
        console.log(`👤 [getWalletByPhone] Found name in history: ${historicalName}`);
      }
    } catch (err) {
      console.warn('⚠️ [getWalletByPhone] Error looking up billing history:', err.message);
    }
  }

  // Create wallet if doesn't exist
  if (!wallet) {
    wallet = await Wallet.create({
      phone,
      points: 0,
      customerName: historicalName || 'Customer',
      transactions: []
    });
    console.log(`📱 [getWalletByPhone] New wallet created for phone: ${phone} (Name: ${wallet.customerName})`);
  } else {
    // Optional: Update name if we found a better one from history
    if (historicalName && wallet.customerName === 'Customer') {
      wallet.customerName = historicalName;
      await wallet.save();
      console.log(`🔄 [getWalletByPhone] Updated wallet name from history: ${historicalName}`);
    }
    console.log(`📱 [getWalletByPhone] Existing wallet found - Phone: ${phone}, Points: ${wallet.points}`);
  }

  res.status(200).json({
    success: true,
    data: wallet
  });
});

// @desc    Calculate points earned based on bill amount
// @route   POST /api/wallets/calculate-points
// @access  Private
const calculatePointsEarned = asyncHandler(async (req, res) => {
  const { billAmount } = req.body;

  if (!billAmount || billAmount <= 0) {
    res.status(400);
    throw new Error('Valid bill amount is required');
  }

  // Fetch point rules
  const rules = await PointRule.find().sort({ minAmount: 1 });

  // Find applicable rule
  let pointsEarned = 0;
  for (const rule of rules) {
    if (billAmount >= rule.minAmount && billAmount <= rule.maxAmount) {
      pointsEarned = rule.points;
      break;
    }
  }

  res.status(200).json({
    success: true,
    data: {
      billAmount,
      pointsEarned
    }
  });
});

// @desc    Calculate points earned per product
// @route   POST /api/wallets/calculate-points-per-product
// @access  Private
const calculatePointsPerProduct = asyncHandler(async (req, res) => {
  const { products } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0) {
    res.status(400);
    throw new Error('Valid products array is required');
  }

  // Fetch point rules
  const rules = await PointRule.find().sort({ minAmount: 1 });

  // Calculate points for each product
  const productsWithPoints = products.map(product => {
    const { productId, productName, price, quantity } = product;
    const totalPrice = price * quantity;

    // Find applicable rule for this product's total price
    let points = 0;
    for (const rule of rules) {
      if (totalPrice >= rule.minAmount && totalPrice <= rule.maxAmount) {
        points = rule.points;
        break;
      }
    }

    return {
      productId,
      productName,
      price,
      quantity,
      totalPrice,
      points
    };
  });

  // Calculate total points
  const totalPoints = productsWithPoints.reduce((sum, p) => sum + p.points, 0);

  res.status(200).json({
    success: true,
    data: {
      products: productsWithPoints,
      totalPoints
    }
  });
});

// @desc    Update wallet points (add or deduct)
// @route   POST /api/wallets/update
// @access  Private
const updateWalletPoints = asyncHandler(async (req, res) => {
  const { phone, points, type, billNumber, billAmount, description, customerName } = req.body;

  // Validate inputs
  if (!phone || !/^\d{10}$/.test(phone)) {
    res.status(400);
    throw new Error('Valid phone number is required');
  }

  if (!points || points <= 0) {
    res.status(400);
    throw new Error('Valid points amount is required');
  }

  if (!type || !['earned', 'redeemed', 'adjustment'].includes(type)) {
    res.status(400);
    throw new Error('Valid transaction type is required (earned/redeemed/adjustment)');
  }

  // Find or create wallet
  let wallet = await Wallet.findOne({ phone });
  if (!wallet) {
    wallet = await Wallet.create({
      phone,
      points: 0,
      customerName: customerName || 'Customer'
    });
  } else if (customerName && customerName !== 'Customer') {
    // Update name if provided and not default
    wallet.customerName = customerName;
  }

  // Update points based on type
  if (type === 'earned' || type === 'adjustment') {
    wallet.points += points;
  } else if (type === 'redeemed') {
    if (wallet.points < points) {
      res.status(400);
      throw new Error('Insufficient points balance');
    }
    wallet.points -= points;
  }

  // Add transaction record
  wallet.transactions.push({
    type,
    points,
    billNumber,
    billAmount,
    description: description || `Points ${type}`,
    date: new Date()
  });

  await wallet.save();

  // Log to console as requested
  console.log(`💰 Wallet Updated - Phone: ${phone}`);
  console.log(`   Type: ${type}`);
  console.log(`   Points: ${type === 'redeemed' ? '-' : '+'}${points}`);
  console.log(`   New Balance: ${wallet.points}`);
  if (billNumber) console.log(`   Bill: ${billNumber}`);

  res.status(200).json({
    success: true,
    data: wallet
  });
});

module.exports = {
  getWalletByPhone,
  calculatePointsEarned,
  calculatePointsPerProduct,
  updateWalletPoints
};