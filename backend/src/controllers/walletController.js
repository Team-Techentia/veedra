const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

// Initialize wallet balances if not exist
const initializeWalletBalance = (entity, type) => {
  if (!entity.walletBalance && entity.walletBalance !== 0) {
    // Initialize with some sample commission earnings
    const sampleBalance = type === 'vendor' ? Math.floor(Math.random() * 8000) + 2000 : Math.floor(Math.random() * 3000) + 1000;
    entity.walletBalance = sampleBalance;
    entity.save();
  }
};

// Get all wallets (vendors + staff)
const getWallets = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find({ isActive: true }).select('name totalCommissionEarned commissionRate contact walletBalance');
  const staff = await User.find({ role: { $in: ['staff', 'manager'] }, isActive: true }).select('name commissionRate walletBalance email');
  
  // Initialize wallet balances for entities that don't have them
  vendors.forEach(vendor => initializeWalletBalance(vendor, 'vendor'));
  staff.forEach(user => initializeWalletBalance(user, 'staff'));
  
  const wallets = [
    // Vendor wallets
    ...vendors.map(vendor => ({
      id: vendor._id,
      name: vendor.name,
      type: 'vendor',
      balance: vendor.walletBalance || 0,
      commissionRate: vendor.commissionRate,
      email: vendor.contact?.email,
      phone: vendor.contact?.phone,
      status: 'active',
      lastTransaction: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      totalEarnings: (vendor.totalCommissionEarned || 0) + (vendor.walletBalance || 0),
      pendingAmount: Math.floor(Math.random() * 500) // Simulate pending commissions
    })),
    // Staff wallets  
    ...staff.map(user => ({
      id: user._id,
      name: user.name,
      type: 'staff',
      balance: user.walletBalance || 0,
      commissionRate: user.commissionRate || 0,
      email: user.email,
      status: 'active',
      lastTransaction: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      totalEarnings: (user.walletBalance || 0) + Math.floor(Math.random() * 2000),
      pendingAmount: Math.floor(Math.random() * 300)
    }))
  ];

  res.json({
    status: 'success',
    data: wallets
  });
});

const getWallet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Try to find as vendor first
  let wallet = await Vendor.findById(id).select('name totalCommissionEarned commissionRate contact');
  if (wallet) {
    wallet = {
      id: wallet._id,
      name: wallet.name,
      type: 'vendor',
      balance: wallet.totalCommissionEarned || 0,
      commissionRate: wallet.commissionRate,
      email: wallet.contact?.email,
      phone: wallet.contact?.phone,
      status: 'active',
      totalEarnings: wallet.totalCommissionEarned || 0
    };
  } else {
    // Try to find as staff
    const user = await User.findById(id).select('name commissionRate email');
    if (user) {
      wallet = {
        id: user._id,
        name: user.name,
        type: 'staff',
        balance: Math.floor(Math.random() * 5000),
        commissionRate: user.commissionRate || 0,
        email: user.email,
        status: 'active',
        totalEarnings: Math.floor(Math.random() * 10000)
      };
    }
  }

  if (!wallet) {
    res.status(404);
    throw new Error('Wallet not found');
  }

  res.json({
    status: 'success',
    data: wallet
  });
});

const getWalletTransactions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Generate sample transactions
  const sampleTransactions = [
    {
      id: '1',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      type: 'credit',
      amount: 250,
      description: 'Commission from Sale #12345',
      status: 'completed',
      reference: 'COMM-12345'
    },
    {
      id: '2', 
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      type: 'credit',
      amount: 180,
      description: 'Commission from Sale #12340',
      status: 'completed',
      reference: 'COMM-12340'
    },
    {
      id: '3',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      type: 'debit',
      amount: 500,
      description: 'Commission Payout',
      status: 'completed',
      reference: 'PAYOUT-001'
    },
    {
      id: '4',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      type: 'credit',
      amount: 320,
      description: 'Commission from Sale #12330',
      status: 'completed',
      reference: 'COMM-12330'
    }
  ];

  res.json({
    status: 'success',
    data: sampleTransactions
  });
});

const processCommissionPayout = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, description } = req.body;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Invalid payout amount');
  }

  // Try to find vendor first
  const vendor = await Vendor.findById(id);
  if (vendor) {
    // Initialize wallet balance if not exists
    if (!vendor.walletBalance && vendor.walletBalance !== 0) {
      vendor.walletBalance = vendor.totalCommissionEarned || 0;
    }
    
    // Check if sufficient balance
    if (vendor.walletBalance < amount) {
      res.status(400);
      throw new Error('Insufficient balance for payout');
    }
    
    // Deduct amount from wallet balance
    vendor.walletBalance -= amount;
    await vendor.save();
    
    console.log(`Processed payout of ₹${amount} for vendor ${vendor.name}. New balance: ₹${vendor.walletBalance}`);
    
    res.json({
      status: 'success',
      message: `Payout of ₹${amount} processed successfully for ${vendor.name}`,
      data: {
        walletId: id,
        amount,
        newBalance: vendor.walletBalance,
        description: description || 'Commission payout',
        processedAt: new Date(),
        reference: `PAYOUT-${Date.now()}`
      }
    });
    return;
  }

  // Try staff user
  const user = await User.findById(id);
  if (user) {
    // Initialize wallet balance if not exists
    if (!user.walletBalance && user.walletBalance !== 0) {
      user.walletBalance = Math.floor(Math.random() * 3000) + 1000;
    }
    
    // Check if sufficient balance
    if (user.walletBalance < amount) {
      res.status(400);
      throw new Error('Insufficient balance for payout');
    }
    
    // Deduct amount from wallet balance
    user.walletBalance -= amount;
    await user.save();
    
    console.log(`Processed payout of ₹${amount} for staff ${user.name}. New balance: ₹${user.walletBalance}`);
    
    res.json({
      status: 'success', 
      message: `Payout of ₹${amount} processed successfully for ${user.name}`,
      data: {
        walletId: id,
        amount,
        newBalance: user.walletBalance,
        description: description || 'Staff commission payout',
        processedAt: new Date(),
        reference: `PAYOUT-${Date.now()}`
      }
    });
    return;
  }

  res.status(404);
  throw new Error('Wallet not found');
});

const adjustWalletBalance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, type, reason } = req.body;

  if (!amount || !type || !reason) {
    res.status(400);
    throw new Error('Amount, type, and reason are required');
  }

  if (!['credit', 'debit'].includes(type)) {
    res.status(400);
    throw new Error('Type must be either credit or debit');
  }

  // In a real implementation, you would update the actual wallet balance
  console.log(`Adjusting wallet ${id}: ${type} $${amount} - ${reason}`);

  res.json({
    status: 'success',
    message: `Wallet balance adjusted successfully`,
    data: {
      walletId: id,
      amount,
      type,
      reason,
      adjustedAt: new Date(),
      reference: `ADJ-${Date.now()}`
    }
  });
});

module.exports = {
  getWallets,
  getWallet,
  getWalletTransactions,
  processCommissionPayout,
  adjustWalletBalance
};