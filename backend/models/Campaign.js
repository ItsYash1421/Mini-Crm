const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  field: String,
  operator: String,
  value: mongoose.Schema.Types.Mixed
});

const segmentSchema = new mongoose.Schema({
  rules: [ruleSchema],
  operator: {
    type: String,
    enum: ['AND', 'OR'],
    default: 'AND'
  }
});

const deliveryStatsSchema = new mongoose.Schema({
  sent: {
    type: Number,
    default: 0
  },
  failed: {
    type: Number,
    default: 0
  },
  audienceSize: {
    type: Number,
    default: 0
  },
  openRate: {
    type: Number,
    default: 0
  },
  clickRate: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['email', 'social', 'display']
  },
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'active', 'paused', 'completed', 'failed'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  segment: {
    type: segmentSchema,
    required: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  deliveryStats: {
    type: deliveryStatsSchema,
    default: () => ({})
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  tags: [{ type: String }],
}, {
  timestamps: true
});

module.exports = mongoose.model('Campaign', campaignSchema); 