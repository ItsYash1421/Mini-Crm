const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const CommunicationLog = require('../models/CommunicationLog');
const Notification = require('../models/Notification');
const vendorService = require('../services/vendorService');
const { verifyToken } = require('../middleware/auth');
// Remove OpenAI import
// const OpenAI = require('openai');

// Import Google AI SDK
const { GoogleGenerativeAI } = require('@google/generative-ai');

const config = require('../config'); // Import the main config file

// Initialize Google AI with API key from config
const genAI = new GoogleGenerativeAI(config.GOOGLE_API_KEY);

// Choose a model (e.g., Gemini 1.5 Flash) - you can adjust the model name as needed
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

// Remove OpenAI initialization
// const openai = new OpenAI({
//   apiKey: config.OPENAI_API_KEY,
// });

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
};

// Preview audience size
router.post('/preview-audience', verifyToken, async (req, res) => {
  try {
    const { segment } = req.body;
    
    if (!segment || !segment.rules || !segment.operator) {
      return res.status(400).json({ 
        message: 'Invalid segment data',
        details: 'Segment must include rules and operator'
      });
    }

    const audienceSize = await calculateAudienceSize(segment);
    res.json({ audienceSize });
  } catch (err) {
    console.error('Error previewing audience:', err);
    res.status(400).json({ 
      message: 'Failed to preview audience',
      details: err.message
    });
  }
});

// Create a new campaign
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, type, budget, segment, companyName } = req.body;
    
    // Validate required fields
    if (!name || !description || !type || !budget || !segment || !companyName) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          name: !name ? 'Campaign name is required' : null,
          description: !description ? 'Description is required' : null,
          type: !type ? 'Campaign type is required' : null,
          budget: !budget ? 'Budget is required' : null,
          segment: !segment ? 'Segment is required' : null,
          companyName: !companyName ? 'Company name is required' : null
        }
      });
    }

    // Validate segment
    if (!segment.rules || !segment.operator || !Array.isArray(segment.rules) || segment.rules.length === 0) {
      return res.status(400).json({
        message: 'Invalid segment data',
        details: 'Segment must include rules array and operator'
      });
    }

    // Calculate initial audience size
    const audienceSize = await calculateAudienceSize(segment);

    const campaign = new Campaign({
      name,
      description,
      type,
      budget,
      segment,
      companyName,
      createdBy: req.user.id,
      status: 'active',
      deliveryStats: {
        audienceSize,
        sent: 0,
        failed: 0,
        openRate: 0,
        clickRate: 0
      }
    });

    const savedCampaign = await campaign.save();

    // Create notification for the new campaign
    const notification = new Notification({
      userId: req.user.id,
      type: 'campaign',
      title: 'New Campaign Created',
      message: `Campaign "${name}" has been created successfully.`,
      timestamp: new Date(),
      read: false
    });
    await notification.save();

    // Start message delivery process immediately
    try {
      await initiateCampaignDelivery(savedCampaign);
      res.status(201).json(savedCampaign);
    } catch (err) {
      console.error('Error in campaign delivery:', err);
      // Even if delivery fails, return the campaign but with error details
      res.status(201).json({
        ...savedCampaign.toObject(),
        deliveryError: err.message
      });
    }
  } catch (err) {
    console.error('Error creating campaign:', err);
    res.status(400).json({ 
      message: 'Failed to create campaign',
      details: err.message
    });
  }
});

// Get all campaigns
router.get('/', verifyToken, async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .sort({ createdAt: -1 }); // Sort by most recent first
    res.json(campaigns);
  } catch (err) {
    console.error('Error fetching campaigns:', err);
    res.status(500).json({ message: err.message });
  }
});

// Smart Scheduling Suggestions
router.get('/scheduling-suggestions', verifyToken, async (req, res) => {
  try {
    // --- Simulate analyzing customer activity patterns ---
    // In a real-world scenario, this would involve querying customer interaction data
    // (like email opens, clicks, website visits) with timestamps and identifying peaks.
    // For this simulation, we'll pick a plausible time and day.

    const suggestedDay = 'Tuesday'; // Example suggested day
    const suggestedTime = '10:30 AM'; // Example suggested time
    const rationale = 'Based on simulated customer engagement data, Tuesdays around late morning show the highest activity.'; // Example rationale

    res.json({
      suggestedDay,
      suggestedTime,
      rationale
    });

  } catch (error) {
    console.error('Error generating scheduling suggestions:', error);
    res.status(500).json({ message: 'Failed to generate scheduling suggestions.', error: error.message });
  }
});

// Get campaign by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (err) {
    console.error('Error fetching campaign:', err);
    res.status(500).json({ message: err.message });
  }
});

// Handle delivery receipt from vendor
router.post('/delivery-receipt', async (req, res) => {
  try {
    const { customerId, messageId, status, error } = req.body;

    // Find and update the log with the matching messageId
    const log = await CommunicationLog.findOneAndUpdate(
      { 
        customerId,
        'vendorResponse.messageId': messageId
      },
      {
        $set: {
          status,
          error: error || null,
          deliveredAt: status === 'delivered' ? new Date() : undefined,
          openedAt: status === 'opened' ? new Date() : undefined,
          clickedAt: status === 'clicked' ? new Date() : undefined,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!log) {
      return res.status(404).json({ message: 'Communication log not found' });
    }

    // Update campaign delivery stats
    await updateCampaignDeliveryStats(log.campaignId);

    res.json({ message: 'Delivery receipt processed successfully' });
  } catch (err) {
    console.error('Error processing delivery receipt:', err);
    res.status(500).json({ message: err.message });
  }
});

// Helper function to update campaign delivery stats
async function updateCampaignDeliveryStats(campaignId) {
  const stats = await CommunicationLog.aggregate([
    { $match: { campaignId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const deliveryStats = {
    sent: 0,
    failed: 0,
    audienceSize: 0
  };

  stats.forEach(stat => {
    if (stat._id === 'sent' || stat._id === 'delivered' || stat._id === 'opened' || stat._id === 'clicked') {
      deliveryStats.sent += stat.count;
    } else if (stat._id === 'failed') {
      deliveryStats.failed += stat.count;
    }
  });

  deliveryStats.audienceSize = deliveryStats.sent + deliveryStats.failed;

  // Calculate open and click rates if applicable
  const openedCount = stats.find(s => s._id === 'opened')?.count || 0;
  const clickedCount = stats.find(s => s._id === 'clicked')?.count || 0;

  if (deliveryStats.sent > 0) {
    deliveryStats.openRate = (openedCount / deliveryStats.sent) * 100;
    deliveryStats.clickRate = (clickedCount / deliveryStats.sent) * 100;
  }

  await Campaign.findByIdAndUpdate(campaignId, {
    'deliveryStats': deliveryStats
  });
}

// Update campaign status
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Validate status transition
    const validTransitions = {
      active: ['paused', 'completed', 'failed'],
      paused: ['active'],
      draft: ['active'],
      completed: [],
      failed: []
    };

    if (!validTransitions[campaign.status].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status transition',
        details: `Cannot change status from ${campaign.status} to ${status}`
      });
    }

    campaign.status = status;
    await campaign.save();

    res.json(campaign);
  } catch (err) {
    console.error('Error updating campaign status:', err);
    res.status(400).json({ message: err.message });
  }
});

// Helper function to initiate campaign delivery
async function initiateCampaignDelivery(campaign) {
  try {
    // Get matching customers based on segment rules
    const query = buildSegmentQuery(campaign.segment);
    const customers = await Customer.find(query);

    if (customers.length === 0) {
      campaign.status = 'completed';
      await campaign.save();
      return;
    }

    // Process customers in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize);
      const batchPromises = batch.map(async (customer) => {
        try {
          // Generate message content
          const messageContent = vendorService.generatePersonalizedMessage(customer, campaign);

          // Create initial log with pending status
          const log = new CommunicationLog({
            campaignId: campaign._id,
            customerId: customer._id,
            content: messageContent,
            status: 'pending',
            createdAt: new Date()
          });

          // Save the initial log
          const savedLog = await log.save();

          try {
            // Send message through vendor service
            const result = await vendorService.sendMessage(savedLog);

            // Update log with vendor response
            const updateData = {
              status: result.response.status,
              vendorResponse: {
                messageId: result.response.messageId,
                timestamp: result.response.timestamp,
                status: result.response.status
              },
              sentAt: new Date()
            };

            const updatedLog = await CommunicationLog.findByIdAndUpdate(
              savedLog._id,
              { $set: updateData },
              { new: true }
            );

            // Update campaign stats
            await updateCampaignDeliveryStats(campaign._id);

            if (result.success) {
              // Schedule delivery receipt simulation
              setTimeout(async () => {
                try {
                  const receipt = await vendorService.sendDeliveryReceipt(result.response.messageId, customer._id);
                  
                  // Update log with receipt status
                  const receiptUpdate = {
                    status: receipt.status,
                    deliveredAt: receipt.status === 'delivered' ? new Date() : undefined,
                    openedAt: receipt.status === 'opened' ? new Date() : undefined,
                    clickedAt: receipt.status === 'clicked' ? new Date() : undefined,
                    updatedAt: new Date()
                  };

                  await CommunicationLog.findByIdAndUpdate(
                    updatedLog._id,
                    { $set: receiptUpdate },
                    { new: true }
                  );
                  
                  // Update campaign stats
                  await updateCampaignDeliveryStats(campaign._id);
                } catch (receiptErr) {
                  console.error('Error in delivery receipt:', receiptErr);
                  await CommunicationLog.findByIdAndUpdate(
                    updatedLog._id,
                    {
                      $set: {
                        status: 'failed',
                        error: `Receipt error: ${receiptErr.message}`,
                        updatedAt: new Date()
                      }
                    },
                    { new: true }
                  );
                  await updateCampaignDeliveryStats(campaign._id);
                }
              }, 1000); // 1 second delay for delivery receipt
            }
          } catch (sendError) {
            console.error('Error sending message:', sendError);
            // Update log with error
            await CommunicationLog.findByIdAndUpdate(
              savedLog._id,
              {
                $set: {
                  status: 'failed',
                  error: sendError.message,
                  vendorResponse: {
                    status: 'failed',
                    error: sendError.message,
                    timestamp: new Date()
                  },
                  sentAt: new Date(),
                  updatedAt: new Date()
                }
              },
              { new: true }
            );
            await updateCampaignDeliveryStats(campaign._id);
          }
        } catch (error) {
          console.error('Error processing customer:', error);
          // Create failed log
          const failedLog = new CommunicationLog({
            campaignId: campaign._id,
            customerId: customer._id,
            content: vendorService.generatePersonalizedMessage(customer, campaign),
            status: 'failed',
            error: error.message,
            createdAt: new Date(),
            sentAt: new Date(),
            vendorResponse: {
              status: 'failed',
              error: error.message,
              timestamp: new Date()
            }
          });
          await failedLog.save();
          await updateCampaignDeliveryStats(campaign._id);
        }
      });

      // Wait for current batch to complete
      await Promise.all(batchPromises);
    }

  } catch (error) {
    console.error('Error in campaign delivery:', error);
    campaign.status = 'failed';
    await campaign.save();
    throw error;
  }
}

// Helper function to build MongoDB query from segment
function buildSegmentQuery(segment) {
  const { rules, operator } = segment;
  
  if (operator === 'AND') {
    return { $and: rules.map(rule => buildRuleQuery(rule)) };
  } else {
    return { $or: rules.map(rule => buildRuleQuery(rule)) };
  }
}

// Helper function to calculate audience size
async function calculateAudienceSize(segment) {
  const { rules, operator } = segment;
  
  let query = {};
  
  if (operator === 'AND') {
    query = { $and: rules.map(rule => buildRuleQuery(rule)) };
  } else {
    query = { $or: rules.map(rule => buildRuleQuery(rule)) };
  }
  
  return await Customer.countDocuments(query);
}

// Helper function to build MongoDB query from rule
function buildRuleQuery(rule) {
  const { field, operator, value } = rule;
  
  // Handle numeric fields
  if (['totalSpend', 'visitCount'].includes(field)) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      throw new Error(`Invalid number for ${field}`);
    }
    
    switch (operator) {
      case '>':
        return { [field]: { $gt: numValue } };
      case '<':
        return { [field]: { $lt: numValue } };
      case '>=':
        return { [field]: { $gte: numValue } };
      case '<=':
        return { [field]: { $lte: numValue } };
      case '==':
        return { [field]: numValue };
      case '!=':
        return { [field]: { $ne: numValue } };
      default:
        return {};
    }
  }
  
  // Handle non-numeric fields
  switch (operator) {
    case '>':
    case '<':
    case '>=':
    case '<=':
      throw new Error(`Operator ${operator} is not supported for non-numeric field ${field}`);
    case '==':
      return { [field]: value };
    case '!=':
      return { [field]: { $ne: value } };
    default:
      return {};
  }
}

// Update campaign
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (err) {
    console.error('Error updating campaign:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete campaign
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json({ message: 'Campaign deleted successfully' });
  } catch (err) {
    console.error('Error deleting campaign:', err);
    res.status(500).json({ message: err.message });
  }
});

// AI-Driven Message Suggestions
router.post('/suggestions', verifyToken, async (req, res) => {
  const { campaignObjective, type } = req.body;

  if (!campaignObjective) {
    return res.status(400).json({ message: 'Campaign objective is required.' });
  }

  if (!type) {
    return res.status(400).json({ message: 'Campaign type is required.' });
  }

  try {
    // Craft a prompt for the Google AI model based on campaign type
    let prompt;
    switch (type) {
      case 'email':
        prompt = `Generate 3 distinct email marketing message suggestions for a campaign with the objective: "${campaignObjective}". Each suggestion should include a subject line and email body. The email body should be professional and include placeholders like [User Name] and [Your Company Name]. Provide the response in JSON format with a top-level key "suggestions" which is an array of JSON objects, each having "subject" and "body" keys.`;
        break;
      case 'social':
        prompt = `Generate 3 distinct social media post suggestions for a campaign with the objective: "${campaignObjective}". Each suggestion should include a catchy headline and engaging post content. The content should be concise, social-friendly, and include placeholders like [Your Company Name]. Provide the response in JSON format with a top-level key "suggestions" which is an array of JSON objects, each having "subject" (headline) and "body" (post content) keys.`;
        break;
      case 'display':
        prompt = `Generate 3 distinct display ad suggestions for a campaign with the objective: "${campaignObjective}". Each suggestion should include a headline and ad copy. The copy should be concise, attention-grabbing, and include placeholders like [Your Company Name]. Provide the response in JSON format with a top-level key "suggestions" which is an array of JSON objects, each having "subject" (headline) and "body" (ad copy) keys.`;
        break;
      default:
        return res.status(400).json({ message: 'Invalid campaign type.' });
    }

    // Call the Google AI model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the AI model's response, handling potential markdown code blocks
    let aiSuggestions;
    try {
         // Check if the text is wrapped in a markdown JSON code block
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);

        if (jsonMatch && jsonMatch[1]) {
            // If wrapped, parse the content inside the code block
            aiSuggestions = JSON.parse(jsonMatch[1]);
        } else {
             // If not wrapped, attempt to parse the raw text directly
             aiSuggestions = JSON.parse(text);
        }

         // Validate the structure if necessary, e.g., check if aiSuggestions.suggestions is an array
         if (!aiSuggestions || !Array.isArray(aiSuggestions.suggestions)) {
              console.error('Invalid JSON structure from AI model:', aiSuggestions);
              throw new Error("Invalid JSON structure from AI model.");
         }
    } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
         console.error('AI Model raw response:', text);
        return res.status(500).json({ message: 'Failed to parse AI model response.', error: parseError.message });
    }

    // Return the generated suggestions
    res.json(aiSuggestions);

  } catch (error) {
    console.error('Error generating message suggestions:', error);
    // You might add more specific error handling for Google AI errors here
    res.status(500).json({ message: 'Failed to generate suggestions.', error: error.message });
  }
});

// Natural Language to Segment Rules Converter
router.post('/convert-prompt', verifyToken, async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required.' });
  }

  try {
    // Craft a prompt for the Google AI model to convert natural language to segment rules
    const aiPrompt = `Convert the following customer segment description into a logical segment rule structure. The description is: "${prompt}"

Available fields are:
- totalSpend (numeric, in INR)
- visitCount (numeric)
- segment (string: 'Active', 'Inactive', 'VIP')
- lastVisit (date, in months)

Available operators are: '>', '<', '>=', '<=', '=='

Return the response in JSON format with this structure:
{
  "rules": [
    {
      "field": "field_name",
      "operator": "operator",
      "value": "value"
    }
  ],
  "operator": "AND" or "OR"
}

For example, "People who haven't shopped in 6 months and spent over ₹5K" should return:
{
  "rules": [
    {
      "field": "lastVisit",
      "operator": ">=",
      "value": "6"
    },
    {
      "field": "totalSpend",
      "operator": ">",
      "value": "5000"
    }
  ],
  "operator": "AND"
}`;

    // Call the Google AI model
    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    const text = response.text();

    // Parse the AI model's response
    let segmentRules;
    try {
      // Check if the text is wrapped in a markdown JSON code block
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);

      if (jsonMatch && jsonMatch[1]) {
        // If wrapped, parse the content inside the code block
        segmentRules = JSON.parse(jsonMatch[1]);
      } else {
        // If not wrapped, attempt to parse the raw text directly
        segmentRules = JSON.parse(text);
      }

      // Validate the structure
      if (!segmentRules || !Array.isArray(segmentRules.rules) || !segmentRules.operator) {
        throw new Error("Invalid segment rules structure from AI model.");
      }

      // Validate each rule
      segmentRules.rules.forEach(rule => {
        if (!rule.field || !rule.operator || rule.value === undefined) {
          throw new Error("Invalid rule structure in AI response.");
        }
      });

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('AI Model raw response:', text);
      return res.status(500).json({ 
        message: 'Failed to parse AI model response.', 
        error: parseError.message 
      });
    }

    // Return the converted rules
    res.json(segmentRules);

  } catch (error) {
    console.error('Error converting prompt to rules:', error);
    res.status(500).json({ 
      message: 'Failed to convert prompt to rules.', 
      error: error.message 
    });
  }
});

// Audience Lookalike Generator
router.post('/lookalike-suggestions', verifyToken, async (req, res) => {
  try {
    const { segment, campaignId } = req.body;
    let targetSegment = segment;

    if (!targetSegment && campaignId) {
      // If campaignId is provided, fetch the segment from the campaign
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      targetSegment = campaign.segment;
    }

    if (!targetSegment || !targetSegment.rules || !targetSegment.operator) {
      return res.status(400).json({ message: 'Segment data or valid Campaign ID is required.' });
    }

    // --- Simulate AI Logic for Lookalike Generation ---
    // In a real implementation, you'd send the `targetSegment` to an AI model
    // trained to identify patterns and suggest similar criteria.
    // For this simulation, we'll generate some plausible lookalike rules
    // based on common patterns (e.g., slightly broader ranges, related fields).

    const suggestedRules = [];
    const baseRules = targetSegment.rules;

    // Example Simulation Logic:
    // If original segment has totalSpend > 5000, suggest > 4000
    // If original segment has visitCount >= 5, suggest >= 4
    // If original segment is segment == 'VIP', suggest segment == 'Active' or totalSpend > some value

    let generated = false;

    for (const rule of baseRules) {
      if (rule.field === 'totalSpend' && parseFloat(rule.value) > 0) {
        suggestedRules.push({
          field: 'totalSpend',
          operator: rule.operator === '>' || rule.operator === '>=' ? '>=' : '<=',
          value: (parseFloat(rule.value) * 0.8).toFixed(0) // Suggest slightly lower spend
        });
        generated = true;
      }
      if (rule.field === 'visitCount' && parseInt(rule.value) > 0) {
         suggestedRules.push({
           field: 'visitCount',
           operator: rule.operator === '>' || rule.operator === '>=' ? '>=' : '<=',
           value: (parseInt(rule.value) - (parseInt(rule.value) > 1 ? 1 : 0)).toString() // Suggest slightly lower visit count
         });
         generated = true;
      }
      if (rule.field === 'segment' && rule.value === 'VIP') {
        suggestedRules.push({
          field: 'segment',
          operator: '==',
          value: 'Active'
        });
        generated = true;
      }
    }

     // If no specific rules triggered suggestions, add a default one
     if (!generated && baseRules.length > 0) {
        // Default suggestion based on a common pattern
        suggestedRules.push({
            field: 'visitCount',
            operator: '>=',
            value: '3'
        });
     }
     // Ensure uniqueness and reasonable suggestions
     const uniqueSuggestedRules = Array.from(new Set(suggestedRules.map(JSON.stringify))).map(JSON.parse);

    // Choose an operator - could be same as original or a mix
    const suggestedOperator = targetSegment.operator; // Keep the same operator for simplicity

    res.json({
      suggestedSegment: {
        rules: uniqueSuggestedRules,
        operator: suggestedOperator
      },
      rationale: 'Suggested audience characteristics based on patterns found in the target segment.' // Simulated rationale
    });

  } catch (error) {
    console.error('Error generating lookalike suggestions:', error);
    res.status(500).json({ message: 'Failed to generate lookalike suggestions.', error: error.message });
  }
});

module.exports = router; 