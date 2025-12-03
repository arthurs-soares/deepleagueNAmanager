const mongoose = require('mongoose');

/**
 * Deposit Ticket Model
 * Tracks user deposit requests for shop items
 */
const depositTicketSchema = new mongoose.Schema({
  // Discord server ID
  discordGuildId: {
    type: String,
    required: true,
    index: true
  },

  // Ticket channel ID
  channelId: {
    type: String,
    required: true,
    index: true
  },

  // User who created the deposit request
  userId: {
    type: String,
    required: true,
    index: true
  },

  // Shop item being deposited (reference to ShopItem)
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShopItem',
    required: true
  },

  // Quantity being deposited
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },

  // Calculated deposit value (80% of shop price × quantity)
  depositValue: {
    type: Number,
    required: true,
    min: 0
  },

  // Original shop price per item (for reference)
  shopPrice: {
    type: Number,
    required: true,
    min: 0
  },

  // Ticket status
  status: {
    type: String,
    enum: ['pending', 'completed', 'closed'],
    default: 'pending'
  },

  // Admin who processed the deposit (credited coins)
  processedByUserId: {
    type: String,
    default: null
  },

  // When the deposit was processed
  processedAt: {
    type: Date,
    default: null
  },

  // Admin who closed the ticket
  closedByUserId: {
    type: String,
    default: null
  },

  // When the ticket was closed
  closedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
depositTicketSchema.index({ discordGuildId: 1, status: 1 });
depositTicketSchema.index({ discordGuildId: 1, userId: 1 });

module.exports = mongoose.models.DepositTicket || mongoose.model('DepositTicket', depositTicketSchema);

