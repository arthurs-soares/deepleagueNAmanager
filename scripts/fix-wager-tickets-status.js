/**
 * Script to fix wager tickets that have closedAt but status is still 'open'
 * Run with: node scripts/fix-wager-tickets-status.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error('DATABASE_URL not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const WagerTicket = require('../src/models/wager/WagerTicket');

  // Find tickets that have closedAt but status is still 'open'
  const brokenTickets = await WagerTicket.find({
    status: 'open',
    closedAt: { $ne: null }
  });

  console.log(`Found ${brokenTickets.length} tickets to fix`);

  for (const ticket of brokenTickets) {
    console.log(`Fixing ticket ${ticket._id} (channel: ${ticket.channelId})`);
    ticket.status = 'closed';
    await ticket.save();
  }

  console.log('Done!');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

main().catch(console.error);
