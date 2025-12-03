const mongoose = require('mongoose');

/**
 * General Ticket for admin support, blacklist appeals, general inquiries, and roster management
 */
const generalTicketSchema = new mongoose.Schema({
  discordGuildId: { type: String, required: true, index: true },
  channelId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  ticketType: {
    type: String,
    enum: ['admin', 'blacklist_appeal', 'general', 'roster'],
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  closedByUserId: { type: String, default: null },
  closedAt: { type: Date, default: null },
}, { timestamps: true });

generalTicketSchema.index({ discordGuildId: 1, channelId: 1 });
generalTicketSchema.index({ discordGuildId: 1, status: 1 });

module.exports = mongoose.models.GeneralTicket || mongoose.model('GeneralTicket', generalTicketSchema);

