const Wallet = require('./src/models/Wallet');
const mongoose = require('mongoose');
require('dotenv').config();

/**
 * One-time migration script to recalculate loyaltyStats for all existing customers
 * Run this once to fix historical data
 */

const recalculateLoyaltyStats = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📊 Connected to database');

        // Get all wallets
        const wallets = await Wallet.find({});
        console.log(`\n🔍 Found ${wallets.length} customer wallets\n`);

        let updated = 0;
        let skipped = 0;

        for (const wallet of wallets) {
            let totalEarned = 0;
            let totalUsed = 0;
            let totalExpired = 0;

            // Calculate from transactions
            wallet.transactions.forEach(txn => {
                if (txn.type === 'earned') {
                    totalEarned += txn.points;
                } else if (txn.type === 'redeemed') {
                    totalUsed += txn.points;
                } else if (txn.type === 'expired') {
                    totalExpired += Math.abs(txn.points);
                } else if (txn.type === 'adjustment') {
                    // Adjustments can be positive or negative
                    // Assuming positive adjustments are "earned"
                    if (txn.points > 0) {
                        totalEarned += txn.points;
                    }
                }
            });

            // Check if update is needed
            const needsUpdate =
                wallet.loyaltyStats.totalEarned !== totalEarned ||
                wallet.loyaltyStats.totalUsed !== totalUsed ||
                wallet.loyaltyStats.totalExpired !== totalExpired;

            if (needsUpdate) {
                // Update loyalty stats
                wallet.loyaltyStats.totalEarned = totalEarned;
                wallet.loyaltyStats.totalUsed = totalUsed;
                wallet.loyaltyStats.totalExpired = totalExpired;

                await wallet.save();
                updated++;

                console.log(`✅ ${wallet.customerName} (${wallet.phone})`);
                console.log(`   Earned: ${totalEarned} | Used: ${totalUsed} | Expired: ${totalExpired}`);
            } else {
                skipped++;
            }
        }

        console.log(`\n📊 Migration Complete!`);
        console.log(`   ✅ Updated: ${updated} wallets`);
        console.log(`   ⏭️  Skipped: ${skipped} wallets (already correct)`);
        console.log(`   📝 Total: ${wallets.length} wallets\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

// Run migration
recalculateLoyaltyStats();
