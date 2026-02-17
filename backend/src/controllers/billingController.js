const asyncHandler = require('express-async-handler');
const Billing = require('../models/Billing');
const Product = require('../models/Product');
const Wallet = require('../models/Wallet');
const Combo = require('../models/Combo');

// Helper function to apply automatic combos (price-range and quantity slab)
const applyAutoCombos = async (items) => {
  try {
    // Fetch all active price-range combos and quantity slab combos
    const priceRangeCombos = await Combo.getActivePriceRangeCombos();
    const quantitySlabCombos = await Combo.getActiveQuantitySlabCombos();

    if ((!priceRangeCombos || priceRangeCombos.length === 0) &&
      (!quantitySlabCombos || quantitySlabCombos.length === 0)) {
      console.log('📊 No active auto-combos found');
      return items;
    }

    console.log(`📊 Found ${priceRangeCombos.length} price-range combo(s) and ${quantitySlabCombos.length} quantity slab combo(s)`);

    let appliedCount = 0;
    let totalSavings = 0;

    // STEP 1: Group items by offer price for quantity slab processing
    const priceGroups = {};

    for (const item of items) {
      const product = await Product.findById(item.product || item._id);
      if (!product) continue;

      const productOfferPrice = product.pricing?.offerPrice || 0;

      if (!priceGroups[productOfferPrice]) {
        priceGroups[productOfferPrice] = {
          items: [],
          totalQuantity: 0
        };
      }

      priceGroups[productOfferPrice].items.push({ item, product });
      priceGroups[productOfferPrice].totalQuantity += (item.quantity || 1);
    }

    // STEP 2: Apply quantity slab combos first (they take priority)
    for (const [priceKey, priceGroup] of Object.entries(priceGroups)) {
      const offerPrice = parseFloat(priceKey);
      const totalQty = priceGroup.totalQuantity;

      console.log(`🔍 Checking price group: ₹${offerPrice}, Total Qty: ${totalQty}`);

      // Find matching quantity slab combo for this price range
      const matchingSlabCombo = quantitySlabCombos.find(combo => {
        const { minPrice, maxPrice } = combo.quantitySlabConfig;
        return offerPrice >= minPrice && offerPrice <= maxPrice;
      });

      if (matchingSlabCombo) {
        const slabs = matchingSlabCombo.quantitySlabConfig.slabs || [];
        const applyLastForHigher = matchingSlabCombo.quantitySlabConfig.applyLastSlabForHigher;

        // Find the applicable slab based on total quantity
        let applicableSlab = null;

        for (const slab of slabs) {
          if (totalQty >= slab.minQuantity) {
            // Check if quantity falls within this slab's range
            if (slab.maxQuantity === null || totalQty <= slab.maxQuantity) {
              applicableSlab = slab;
              break;
            } else if (slab.maxQuantity && totalQty > slab.maxQuantity) {
              // Quantity exceeds this slab, continue to next
              applicableSlab = slab; // Keep track in case this is the last slab
            }
          }
        }

        // If no exact match and applyLastForHigher is true, use the last slab
        if (!applicableSlab && applyLastForHigher && slabs.length > 0) {
          applicableSlab = slabs[slabs.length - 1];
        }

        if (applicableSlab) {
          const slabPrice = applicableSlab.slabPrice;
          const originalPrice = offerPrice;
          const savings = originalPrice - slabPrice;

          console.log(`  💰 QUANTITY SLAB MATCH: Qty ${totalQty} → ₹${slabPrice} (was ₹${originalPrice})`);

          // Apply slab price to ALL items in this price group
          for (const { item, product } of priceGroup.items) {
            item.unitPrice = slabPrice;
            item.price = slabPrice;

            item.comboAssignment = {
              comboId: matchingSlabCombo._id,
              comboName: matchingSlabCombo.name,
              slotName: `Qty ${applicableSlab.minQuantity}${applicableSlab.maxQuantity ? `-${applicableSlab.maxQuantity}` : '+'} Slab`,
              slotPrice: slabPrice,
              isComboItem: true,
              isAutoApplied: true,
              originalPrice: originalPrice,
              savings: savings,
              quantitySlabInfo: {
                totalQuantity: totalQty,
                slabMinQty: applicableSlab.minQuantity,
                slabMaxQty: applicableSlab.maxQuantity
              }
            };

            appliedCount++;
            totalSavings += savings * (item.quantity || 1);
          }
        }
      } else {
        // STEP 3: If no quantity slab combo, try price-range combos for each item
        for (const { item, product } of priceGroup.items) {
          const productOfferPrice = product.pricing?.offerPrice || 0;

          console.log(`🔍 Checking product: ${product.name} - Offer Price: ₹${productOfferPrice}`);

          // Find all combos that match this product's price
          const matchingCombos = priceRangeCombos.filter(combo => {
            const { minPrice, maxPrice } = combo.priceRangeConfig;
            const matches = productOfferPrice >= minPrice && productOfferPrice <= maxPrice;

            if (matches) {
              console.log(`  ✓ Matches "${combo.name}" (₹${minPrice}-₹${maxPrice} → ₹${combo.priceRangeConfig.comboPrice})`);
            }

            return matches;
          });

          if (matchingCombos.length > 0) {
            // Apply the combo with the best discount (lowest combo price)
            const bestCombo = matchingCombos.reduce((best, combo) => {
              const discount1 = productOfferPrice - best.priceRangeConfig.comboPrice;
              const discount2 = productOfferPrice - combo.priceRangeConfig.comboPrice;
              return discount2 > discount1 ? combo : best;
            });

            const originalPrice = productOfferPrice;
            const comboPrice = bestCombo.priceRangeConfig.comboPrice;
            const savings = originalPrice - comboPrice;

            // Apply combo pricing to the item
            item.unitPrice = comboPrice;
            item.price = comboPrice;

            // Track combo assignment for invoice display
            item.comboAssignment = {
              comboId: bestCombo._id,
              comboName: bestCombo.name,
              slotName: bestCombo.name,
              slotPrice: comboPrice,
              isComboItem: true,
              isAutoApplied: true,
              originalPrice: originalPrice,
              savings: savings
            };

            appliedCount++;
            totalSavings += savings * (item.quantity || 1);

            console.log(`  💰 PRICE-RANGE AUTO-APPLIED: "${bestCombo.name}" - ₹${originalPrice} → ₹${comboPrice} (Save ₹${savings} each, Qty: ${item.quantity})`);
          } else {
            console.log(`  ➖ No matching combo for this price (₹${productOfferPrice})`);
          }
        }
      }
    }

    if (appliedCount > 0) {
      console.log(`✅ Auto-Combos Applied: ${appliedCount} item(s), Total Savings: ₹${totalSavings.toFixed(2)}`);
    } else {
      console.log('ℹ️  No auto-combos applied to cart items');
    }

    return items;
  } catch (error) {
    console.error('❌ Error applying auto-combos:', error);
    // Return items unchanged if auto-combo fails
    return items;
  }
};

// Create a new bill
const createBill = asyncHandler(async (req, res) => {
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

  // 🎯 AUTO-APPLY COMBOS (price-range and quantity slabs)
  console.log('🎯 Checking for auto-applicable combos...');
  const itemsWithAutoCombos = await applyAutoCombos(items);

  // Generate bill number (YYYYMM00001)
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const prefix = `${year}${month}`; // e.g. 202601

  // Find the last bill of this month (starting with YYYYMM)
  const lastBill = await Billing.findOne({
    billNumber: new RegExp(`^${prefix}`)
  }).sort({ billNumber: -1 });

  let nextSequence = 1;
  if (lastBill) {
    // Extract sequence part (remove the 6-digit prefix)
    const lastSequenceStr = lastBill.billNumber.slice(6);
    const lastSequence = parseInt(lastSequenceStr, 10);
    if (!isNaN(lastSequence)) {
      nextSequence = lastSequence + 1;
    }
  }

  const billNumber = `${prefix}${String(nextSequence).padStart(5, '0')}`;
  console.log(`🔢 Generated Bill Number: ${billNumber}`);

  // Transform items to match schema (use items with auto-combos applied)
  const billItems = itemsWithAutoCombos.map(item => {
    console.log('Processing item:', item);

    return {
      product: item.product || item._id,
      productName: item.productName || item.name,
      productCode: item.productCode || item.code || item.sku || 'N/A',
      // Capture HSN Code from request or fallback
      hsnCode: item.hsnCode || item.pricing?.hsnCode || 'N/A',
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
});

// Get all bills
const getBills = asyncHandler(async (req, res) => {
  const { page = 1, limit = 1000, startDate, endDate, search, paymentMethod, status, hsnCode } = req.query;

  // Build query
  let query = {};

  // Date range filter
  if (startDate && endDate) {
    // Set time to start and end of day respectively if only dates are provided
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    query.createdAt = {
      $gte: start,
      $lte: end
    };
  }

  // Payment method filter (case insensitive)
  if (paymentMethod && paymentMethod !== 'all') {
    query['payment.method'] = { $regex: new RegExp(`^${paymentMethod}$`, 'i') };
  }

  // Status filter
  if (status && status !== 'all') {
    query.status = status;
  }

  // HSN Code filter (search in items array)
  if (hsnCode) {
    query['items.hsnCode'] = { $regex: hsnCode, $options: 'i' };
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
    .populate({
      path: 'items.product',
      select: 'hsnCode'
    })
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
        mrp: item.mrp,
        total: item.totalAmount,
        hsnCode: item.hsnCode || item.product?.hsnCode || 'N/A',
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
});

const getBill = asyncHandler(async (req, res) => {
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
});

const updateBill = asyncHandler(async (req, res) => {
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
});

// Cancel bill (Soft Delete) - Restore stock
const cancelBill = asyncHandler(async (req, res) => {
  const bill = await Billing.findById(req.params.id);

  if (!bill) {
    return res.status(404).json({
      success: false,
      message: 'Bill not found'
    });
  }

  if (bill.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Bill is already cancelled'
    });
  }

  // 2. Restore Stock
  console.log(`🔄 Restoring status for Bill ${bill.billNumber}`);
  for (const item of bill.items) {
    // Logic from createBill (reversed)
    try {
      const product = await Product.findById(item.product);

      if (product) {
        // Restore product stock
        const oldStock = product.inventory.currentStock;
        product.inventory.currentStock = oldStock + item.quantity;

        // Decrease total sold
        product.totalSold = Math.max(0, (product.totalSold || 0) - item.quantity);

        await product.save();
        console.log(`✅ Stock restored for ${product.name}: ${oldStock} → ${product.inventory.currentStock} (+${item.quantity})`);

        // If product has parent, restore parent stock
        if (product.parentProduct) {
          const parentProduct = await Product.findById(product.parentProduct);
          if (parentProduct) {
            const oldParentStock = parentProduct.inventory.currentStock;
            parentProduct.inventory.currentStock = oldParentStock + item.quantity;
            parentProduct.totalSold = Math.max(0, (parentProduct.totalSold || 0) - item.quantity);
            await parentProduct.save();
            console.log(`✅ Parent stock restored: ${oldParentStock} → ${parentProduct.inventory.currentStock} (+${item.quantity})`);
          }
        }
      }
    } catch (stockError) {
      console.error(`⚠️ Failed to restore stock for item ${item.productName}:`, stockError);
    }
  }

  // 3. Rollback Wallet Points (Redeemed -> Refund, Earned -> Deduct)
  if (bill.customer && bill.customer.phone) {
    try {
      const wallet = await Wallet.findOne({ phone: bill.customer.phone });
      if (wallet) {
        console.log(`💰 Checking wallet for bill ${bill.billNumber}`);
        const billTransactions = wallet.transactions.filter(t => t.billNumber === bill.billNumber);

        let pointsToRefund = 0; // Points user spent (redeemed) -> Give back
        let pointsToRevert = 0; // Points user earned -> Take back

        billTransactions.forEach(t => {
          if (t.type === 'redeemed') {
            pointsToRefund += t.points;
          } else if (t.type === 'earned') {
            pointsToRevert += t.points;
          }
        });

        if (pointsToRefund > 0 || pointsToRevert > 0) {
          console.log(`🔄 Wallet Rollback: Refund ${pointsToRefund}, Revert ${pointsToRevert}`);

          if (pointsToRefund > 0) {
            wallet.points += pointsToRefund;
            wallet.transactions.push({
              type: 'adjustment',
              points: pointsToRefund,
              billNumber: bill.billNumber,
              description: `Refund for cancelled bill ${bill.billNumber}`,
              date: new Date()
            });
          }

          if (pointsToRevert > 0) {
            // Ensure we don't go negative (though debatable, but technically fair)
            wallet.points = Math.max(0, wallet.points - pointsToRevert);
            wallet.transactions.push({
              type: 'adjustment', // Using adjustment with negative points description
              points: -pointsToRevert, // Storing as negative for clarity in history if UI supports it, otherwise value
              billNumber: bill.billNumber,
              description: `Reversal of earned points for cancelled bill ${bill.billNumber}`,
              date: new Date()
            });
          }

          await wallet.save();
          console.log(`✅ Wallet updated. New Balance: ${wallet.points}`);
        }
      }
    } catch (walletError) {
      console.error('⚠️ Failed to rollback wallet points:', walletError);
    }
  }

  // 4. Update Bill Status
  bill.status = 'cancelled';
  bill.notes = (bill.notes ? bill.notes + '\n' : '') + `Cancelled on ${new Date().toLocaleString()}`;

  await bill.save();

  res.json({
    success: true,
    message: 'Bill cancelled, stock restored, and wallet points adjusted',
    data: bill
  });
});

// Bulk delete bills older than a specific date
const deleteOldBills = asyncHandler(async (req, res) => {
  try {
    const { olderThanDate } = req.body;

    if (!olderThanDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a date (olderThanDate) to delete bills before'
      });
    }

    const dateLimit = new Date(olderThanDate);

    // Safety check - prevent deleting recent bills (e.g., within last 30 days) accidentally?
    // User requested "Delete old bills option for data overload", assuming intentional bulk delete.

    const result = await Billing.deleteMany({
      createdAt: { $lt: dateLimit }
    });

    console.log(`🗑️ Deleted ${result.deletedCount} bills older than ${dateLimit.toISOString()}`);

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} old bills`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error deleting old bills:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete old bills'
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
  cancelBill,
  deleteBill,
  generateInvoice,
  getDailySales,
  getStaffSales,
  deleteOldBills
};