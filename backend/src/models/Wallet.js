const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
    },
    customerName: {
        type: String,
        default: 'Customer'
    },
    place: {
        type: String,
        default: '',
        trim: true
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    email: {
        type: String,
        default: '',
        trim: true,
        lowercase: true
    },
    points: {
        type: Number,
        default: 0,
        min: 0
    },
    // Aggregate loyalty stats
    loyaltyStats: {
        totalEarned: { type: Number, default: 0 },
        totalUsed: { type: Number, default: 0 },
        totalExpired: { type: Number, default: 0 }
    },
    transactions: [{
        type: {
            type: String,
            enum: ['earned', 'redeemed', 'adjustment', 'expired'],
            required: true
        },
        points: {
            type: Number,
            required: true
        },
        billNumber: String,
        billAmount: Number,
        description: String,
        date: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            default: function () {
                // Points expire 6 months from earn date
                if (this.type === 'earned') {
                    const sixMonthsLater = new Date();
                    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
                    return sixMonthsLater;
                }
                return null;
            }
        },
        isExpired: {
            type: Boolean,
            default: false
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
walletSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Static method: Get top loyalty points holders
walletSchema.statics.getTopLoyaltyHolders = async function (limit = 50) {
    try {
        return await this.find({})
            .sort({ points: -1 })
            .limit(limit)
            .select('customerName phone place email points loyaltyStats createdAt')
            .lean();
    } catch (error) {
        console.error('Error fetching top loyalty holders:', error);
        throw error;
    }
};

// Static method: Auto-expire points older than 6 months
walletSchema.statics.expireOldPoints = async function () {
    try {
        const now = new Date();
        const wallets = await this.find({});
        let totalExpired = 0;

        for (const wallet of wallets) {
            let pointsToExpire = 0;
            const expiredTransactionIds = [];

            // Find expired earned points that haven't been marked as expired
            wallet.transactions.forEach(txn => {
                if (txn.type === 'earned' &&
                    !txn.isExpired &&
                    txn.expiresAt &&
                    txn.expiresAt < now) {
                    pointsToExpire += txn.points;
                    txn.isExpired = true;
                    expiredTransactionIds.push(txn._id);
                }
            });

            if (pointsToExpire > 0) {
                // Add expiration transaction
                wallet.transactions.push({
                    type: 'expired',
                    points: -pointsToExpire,
                    description: `Auto-expired ${pointsToExpire} points older than 6 months`,
                    date: now
                });

                // Update stats and available points
                wallet.points = Math.max(0, wallet.points - pointsToExpire);
                wallet.loyaltyStats.totalExpired = (wallet.loyaltyStats.totalExpired || 0) + pointsToExpire;

                await wallet.save();
                totalExpired += pointsToExpire;

                console.log(`✅ Expired ${pointsToExpire} points for customer ${wallet.customerName} (${wallet.phone})`);
            }
        }

        console.log(`🗑️ Total points expired: ${totalExpired}`);
        return { totalExpired, walletsAffected: wallets.filter(w => w.transactions.some(t => t.type === 'expired')).length };
    } catch (error) {
        console.error('Error expiring old points:', error);
        throw error;
    }
};

module.exports = mongoose.model('Wallet', walletSchema);
