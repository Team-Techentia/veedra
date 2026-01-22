const Wallet = require('../models/Wallet');
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

  // Create wallet if doesn't exist
  if (!wallet) {
    wallet = await Wallet.create({
      phone,
      points: 0,
      transactions: []
    });
    console.log(`📱 [getWalletByPhone] New wallet created for phone: ${phone}`);
  } else {
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

// @desc    Update wallet points (add or deduct)
// @route   POST /api/wallets/update
// @access  Private
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
  updateWalletPoints
};