/**
 * Script to check the status of wager tickets in the database
 * Run with: node scripts/check-wager-tickets.js
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

  // Get the 10 most recent tickets
  const tickets = await WagerTicket.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  console.log('\n=== Recent Wager Tickets ===\n');

  for (const t of tickets) {
    console.log(`ID: ${t._id}`);
    console.log(`  Channel: ${t.channelId}`);
    console.log(`  Status: ${t.status}`);
    console.log(`  Created: ${t.createdAt}`);
    console.log(`  Initiator: ${t.initiatorUserId}`);
    console.log(`  Opponent: ${t.opponentUserId}`);
    console.log(`  AcceptedAt: ${t.acceptedAt || 'N/A'}`);
    console.log(`  ClosedAt: ${t.closedAt || 'N/A'}`);
    console.log('---');
  }

  // Count by status
  const counts = await WagerTicket.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  console.log('\n=== Status Counts ===');
  for (const c of counts) {
    console.log(`  ${c._id}: ${c.count}`);
  }

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
}

main().catch(console.error);
