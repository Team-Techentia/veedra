const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Billing',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  receivedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'upi', 'netbanking', 'wallet', 'mix', 'Mix']
  },
  mixPaymentDetails: {
    cash: {
      type: Number,
      default: 0
    },
    card: {
      type: Number,
      default: 0
    },
    upi: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerInfo: {
    name: String,
    phone: String,
    email: String
  },
  changeAmount: {
    type: Number,
    default: 0
  },
  metadata: {
    cardLast4: String,
    upiId: String,
    bankName: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);