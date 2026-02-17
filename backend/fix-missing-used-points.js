const Wallet = require('./src/models/Wallet');
const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Fix missing "Total Used" points by calculating from the difference
 * Formula: Available = Earned - Used - Expired
 * Therefore: Used = Earned - Available - Expired
 */

const fixMissingUsedPoints = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📊 Connected to database\n');

        const wallets = await Wallet.find({});
        console.log(`🔍 Checking ${wallets.length} wallets for inconsistencies...\n`);

        let fixed = 0;
        let correct = 0;

        for (const wallet of wallets) {
            // Calculate from transactions
            let earnedFromTxn = 0;
            let usedFromTxn = 0;
            let expiredFromTxn = 0;

            wallet.transactions.forEach(txn => {
                if (txn.type === 'earned') {
                    earnedFromTxn += txn.points;
                } else if (txn.type === 'redeemed') {
                    usedFromTxn += txn.points;
                } else if (txn.type === 'expired') {
                    expiredFromTxn += Math.abs(txn.points);
                } else if (txn.type === 'adjustment') {
                    if (txn.points > 0) {
                        earnedFromTxn += txn.points;
                    }
                }
            });

            // What SHOULD the stats be based on current available points?
            // Available = Earned - Used - Expired
            // Used = Earned - Available - Expired
            const calculatedUsed = wallet.loyaltyStats.totalEarned - wallet.points - wallet.loyaltyStats.totalExpired;

            // Check if calculated "used" is different from recorded
            if (calculatedUsed !== wallet.loyaltyStats.totalUsed && calculatedUsed >= 0) {
                console.log(`🔧 ${wallet.customerName} (${wallet.phone})`);
                console.log(`   Earned: ${wallet.loyaltyStats.totalEarned}`);
                console.log(`   Available: ${wallet.points}`);
                console.log(`   Expired: ${wallet.loyaltyStats.totalExpired}`);
                console.log(`   Total Used (OLD): ${wallet.loyaltyStats.totalUsed}`);
                console.log(`   Total Used (NEW): ${calculatedUsed}`);
                console.log(`   Difference: ${calculatedUsed - wallet.loyaltyStats.totalUsed}`);

                // Update
                wallet.loyaltyStats.totalUsed = calculatedUsed;
                await wallet.save();

                console.log(`   ✅ Fixed!\n`);
                fixed++;
            } else {
                correct++;
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   ✅ Fixed: ${fixed} wallets`);
        console.log(`   ⏭️  Already correct: ${correct} wallets`);
        console.log(`   📝 Total: ${wallets.length} wallets\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

fixMissingUsedPoints();
