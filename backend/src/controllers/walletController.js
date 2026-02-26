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
    // Update loyalty stats for earned points
    if (type === 'earned') {
      wallet.loyaltyStats.totalEarned = (wallet.loyaltyStats.totalEarned || 0) + points;
    }
  } else if (type === 'redeemed') {
    if (wallet.points < points) {
      res.status(400);
      throw new Error('Insufficient points balance');
    }
    wallet.points -= points;
    // Update loyalty stats for redeemed points
    wallet.loyaltyStats.totalUsed = (wallet.loyaltyStats.totalUsed || 0) + points;
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

// @desc    Get all customers with pagination and search
// @route   GET /api/wallets/customers
// @access  Private
const getAllCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, search = '', dateFrom, dateTo } = req.query;

  const query = {};

  // Search across multiple fields
  if (search) {
    query.$or = [
      { customerName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { place: { $regex: search, $options: 'i' } }
    ];
  }

  // Date range filter
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const skip = (page - 1) * limit;

  const [customers, total] = await Promise.all([
    Wallet.find(query)
      .sort({ points: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean(),
    Wallet.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: customers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Update customer details
// @route   PUT /api/wallets/:id
// @access  Private
const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customerName, place, dateOfBirth, email } = req.body;

  const wallet = await Wallet.findById(id);

  if (!wallet) {
    res.status(404);
    throw new Error('Customer not found');
  }

  // Update fields
  if (customerName) wallet.customerName = customerName;
  if (place !== undefined) wallet.place = place;
  if (dateOfBirth !== undefined) wallet.dateOfBirth = dateOfBirth;
  if (email !== undefined) wallet.email = email;

  await wallet.save();

  res.status(200).json({
    success: true,
    data: wallet
  });
});

// @desc    Delete customer
// @route   DELETE /api/wallets/:id
// @access  Private
const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const wallet = await Wallet.findByIdAndDelete(id);

  if (!wallet) {
    res.status(404);
    throw new Error('Customer not found');
  }

  res.status(200).json({
    success: true,
    message: 'Customer deleted successfully'
  });
});

// @desc    Get top loyalty holders
// @route   GET /api/wallets/top-loyalty
// @access  Private
const getTopLoyaltyHolders = asyncHandler(async (req, res) => {
  const { limit = 50, dateFrom, dateTo } = req.query;

  const topHolders = await Wallet.getTopLoyaltyHolders(parseInt(limit), dateFrom || null, dateTo || null);

  res.status(200).json({
    success: true,
    data: topHolders
  });
});

// @desc    Get customer bills
// @route   GET /api/wallets/:id/bills
// @access  Private
const getCustomerBills = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { dateFrom, dateTo } = req.query;

  const wallet = await Wallet.findById(id);

  if (!wallet) {
    res.status(404);
    throw new Error('Customer not found');
  }

  const query = { 'customer.phone': wallet.phone };

  // Date range filter
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const bills = await Billing.find(query)
    .sort({ createdAt: -1 })
    .select('billNumber total createdAt loyalty')
    .lean();

  res.status(200).json({
    success: true,
    data: bills
  });
});

// @desc    Manually adjust customer points
// @route   POST /api/wallets/:id/adjust-points
// @access  Private
const adjustPoints = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { points, reason } = req.body;

  if (!points || points === 0) {
    res.status(400);
    throw new Error('Valid points amount is required');
  }

  const wallet = await Wallet.findById(id);

  if (!wallet) {
    res.status(404);
    throw new Error('Customer not found');
  }

  const type = points > 0 ? 'adjustment' : 'adjustment';
  const adjustedPoints = Math.abs(points);

  // Update points
  wallet.points = Math.max(0, wallet.points + points);

  // Update stats
  if (points > 0) {
    wallet.loyaltyStats.totalEarned = (wallet.loyaltyStats.totalEarned || 0) + adjustedPoints;
  } else {
    wallet.loyaltyStats.totalUsed = (wallet.loyaltyStats.totalUsed || 0) + adjustedPoints;
  }

  // Add transaction
  wallet.transactions.push({
    type,
    points: adjustedPoints,
    description: reason || (points > 0 ? 'Manual points addition' : 'Manual points deduction'),
    date: new Date()
  });

  await wallet.save();

  console.log(`🔧 Manual adjustment - Customer: ${wallet.customerName}, Points: ${points > 0 ? '+' : ''}${points}`);

  res.status(200).json({
    success: true,
    data: wallet
  });
});

// @desc    Expire old points (background job)
// @route   POST /api/wallets/expire-old-points
// @access  Private
const expireOldPoints = asyncHandler(async (req, res) => {
  const result = await Wallet.expireOldPoints();

  res.status(200).json({
    success: true,
    data: result
  });
});

// @desc    Get all point rules
// @route   GET /api/wallets/rules
// @access  Private
const getPointRules = asyncHandler(async (req, res) => {
  const rules = await PointRule.find().sort({ minAmount: 1 });
  res.status(200).json({
    success: true,
    data: rules
  });
});

// @desc    Add a point rule
// @route   POST /api/wallets/rules
// @access  Private
const addPointRule = asyncHandler(async (req, res) => {
  const { minAmount, maxAmount, points } = req.body;

  if (minAmount === undefined || maxAmount === undefined || points === undefined) {
    res.status(400);
    throw new Error('Please provide minAmount, maxAmount, and points');
  }

  const rule = await PointRule.create({
    minAmount,
    maxAmount,
    points
  });

  res.status(201).json({
    success: true,
    data: rule
  });
});

// @desc    Update a point rule
// @route   PUT /api/wallets/rules/:id
// @access  Private
const updatePointRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { minAmount, maxAmount, points } = req.body;

  const rule = await PointRule.findById(id);

  if (!rule) {
    res.status(404);
    throw new Error('Rule not found');
  }

  rule.minAmount = minAmount !== undefined ? minAmount : rule.minAmount;
  rule.maxAmount = maxAmount !== undefined ? maxAmount : rule.maxAmount;
  rule.points = points !== undefined ? points : rule.points;

  await rule.save();

  res.status(200).json({
    success: true,
    data: rule
  });
});

// @desc    Delete a point rule
// @route   DELETE /api/wallets/rules/:id
// @access  Private
const deletePointRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rule = await PointRule.findByIdAndDelete(id);

  if (!rule) {
    res.status(404);
    throw new Error('Rule not found');
  }

  res.status(200).json({
    success: true,
    message: 'Rule removed'
  });
});

module.exports = {
  getWalletByPhone,
  calculatePointsEarned,
  calculatePointsPerProduct,
  updateWalletPoints,
  getAllCustomers,
  updateCustomer,
  deleteCustomer,
  getTopLoyaltyHolders,
  getCustomerBills,
  adjustPoints,
  expireOldPoints,
  // Point Rule Management
  getPointRules,
  addPointRule,
  updatePointRule,
  deletePointRule
};