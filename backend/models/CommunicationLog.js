const mongoose = require('mongoose');

const communicationLogSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'delivered', 'opened', 'clicked'],
    default: 'pending',
    required: true
  },
  vendorResponse: {
    messageId: String,
    timestamp: Date,
    status: String,
    error: String
  },
  error: {
    type: String
  },
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  openedAt: {
    type: Date
  },
  clickedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
communicationLogSchema.index({ campaignId: 1, customerId: 1 });
communicationLogSchema.index({ status: 1 });
communicationLogSchema.index({ createdAt: 1 });

// Pre-save middleware to ensure proper status updates
communicationLogSchema.pre('save', function(next) {
  const now = new Date();
  
  // Update timestamps based on status
  switch (this.status) {
    case 'sent':
      this.sentAt = this.sentAt || now;
      break;
    case 'delivered':
      this.deliveredAt = this.deliveredAt || now;
      break;
    case 'opened':
      this.openedAt = this.openedAt || now;
      break;
    case 'clicked':
      this.clickedAt = this.clickedAt || now;
      break;
  }
  
  this.updatedAt = now;
  next();
});

// Static method to find and update log status
communicationLogSchema.statics.updateStatus = async function(logId, status, additionalData = {}) {
  const update = {
    status,
    updatedAt: new Date(),
    ...additionalData
  };

  return this.findByIdAndUpdate(
    logId,
    { $set: update },
    { new: true }
  );
};

module.exports = mongoose.model('CommunicationLog', communicationLogSchema); 