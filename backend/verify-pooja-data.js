const Wallet = require('./src/models/Wallet');
const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Verification script to check loyalty stats vs actual transaction data
 */

const verifyCustomerData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📊 Connected to database\n');

        // Get Pooja's wallet
        const wallet = await Wallet.findOne({ phone: '7259735602' });

        if (!wallet) {
            console.log('❌ Pooja not found!');
            process.exit(1);
        }

        console.log('👤 Customer:', wallet.customerName);
        console.log('📱 Phone:', wallet.phone);
        console.log('📅 Joined:', wallet.createdAt.toLocaleDateString('en-IN'));
        console.log('\n📊 CURRENT STATS:');
        console.log('   Total Earned:', wallet.loyaltyStats.totalEarned);
        console.log('   Total Used:', wallet.loyaltyStats.totalUsed);
        console.log('   Total Expired:', wallet.loyaltyStats.totalExpired);
        console.log('   Available Points:', wallet.points);

        // Calculate from transactions
        let earnedFromTxn = 0;
        let usedFromTxn = 0;
        let expiredFromTxn = 0;

        console.log('\n📜 TRANSACTION HISTORY:');
        console.log('   Total transactions:', wallet.transactions.length);

        wallet.transactions.forEach((txn, i) => {
            const date = txn.date.toLocaleDateString('en-IN');
            console.log(`   ${i + 1}. [${txn.type}] ${txn.points} pts - ${txn.description || 'N/A'} (${date})`);

            if (txn.type === 'earned') {
                earnedFromTxn += txn.points;
            } else if (txn.type === 'redeemed') {
                usedFromTxn += txn.points;
            } else if (txn.type === 'expired') {
                expiredFromTxn += Math.abs(txn.points);
            } else if (txn.type === 'adjustment') {
                if (txn.points > 0) {
                    earnedFromTxn += txn.points;
                } else {
                    usedFromTxn += Math.abs(txn.points);
                }
            }
        });

        console.log('\n🔍 CALCULATED FROM TRANSACTIONS:');
        console.log('   Earned:', earnedFromTxn);
        console.log('   Used:', usedFromTxn);
        console.log('   Expired:', expiredFromTxn);
        console.log('   Expected Available:', earnedFromTxn - usedFromTxn - expiredFromTxn);

        console.log('\n⚖️ COMPARISON:');
        console.log('   Earned (Stats vs Actual):', wallet.loyaltyStats.totalEarned, 'vs', earnedFromTxn, wallet.loyaltyStats.totalEarned === earnedFromTxn ? '✅' : '❌');
        console.log('   Used (Stats vs Actual):', wallet.loyaltyStats.totalUsed, 'vs', usedFromTxn, wallet.loyaltyStats.totalUsed === usedFromTxn ? '✅' : '❌');
        console.log('   Expired (Stats vs Actual):', wallet.loyaltyStats.totalExpired, 'vs', expiredFromTxn, wallet.loyaltyStats.totalExpired === expiredFromTxn ? '✅' : '❌');

        const expectedAvailable = earnedFromTxn - usedFromTxn - expiredFromTxn;
        console.log('   Available (Actual vs Expected):', wallet.points, 'vs', expectedAvailable, wallet.points === expectedAvailable ? '✅' : '❌');

        // Check for missing points
        const missingPoints = wallet.loyaltyStats.totalEarned - wallet.points - wallet.loyaltyStats.totalUsed - wallet.loyaltyStats.totalExpired;
        if (missingPoints !== 0) {
            console.log('\n⚠️ WARNING: Missing', missingPoints, 'points!');
            console.log('   This means points were used/redeemed but not recorded in transactions!');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

verifyCustomerData();
