const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const CommunicationLog = require('../models/CommunicationLog');
const { verifyToken } = require('../middleware/auth');

// Get dashboard statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const [
      totalCampaigns,
      activeCampaigns,
      totalCustomers,
      totalOrders,
      totalAudience
    ] = await Promise.all([
      Campaign.countDocuments(),
      Campaign.countDocuments({ status: 'active' }),
      Customer.countDocuments(),
      Order.countDocuments(),
      // total audience
      CommunicationLog.aggregate([
        {
          $group: {
            _id: '$customerId',
            count: { $sum: 1 }
          }
        },
        {
          $count: 'total'
        }
      ]).then(result => result[0]?.total || 0)
    ]);

    res.json({
      totalCampaigns,
      activeCampaigns,
      totalCustomers,
      totalOrders,
      totalAudience
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 