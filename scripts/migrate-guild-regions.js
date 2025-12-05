/**
 * Migration Script: Convert single region to regions array
 *
 * This script migrates existing guilds from the old single-region format
 * to the new multi-region format with region-specific stats.
 *
 * BEFORE: { region: 'NA East', wins: 10, losses: 5, elo: 1200 }
 * AFTER:  { regions: [{ region: 'NA East', wins: 10, losses: 5, elo: 1200, status: 'active' }] }
 *
 * Usage: node scripts/migrate-guild-regions.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Direct schema access to avoid validation issues during migration
const guildSchema = new mongoose.Schema({}, { strict: false });
const GuildModel = mongoose.model('GuildMigration', guildSchema, 'guilds');

async function connectDB() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error('DATABASE_URL not set in environment');
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
}

async function migrateGuilds() {
  console.log('\n🔄 Starting guild regions migration...\n');

  // Find all guilds that have the old region field but no regions array
  const guildsToMigrate = await GuildModel.find({
    region: { $exists: true, $ne: null },
    $or: [
      { regions: { $exists: false } },
      { regions: { $size: 0 } }
    ]
  });

  console.log(`📊 Found ${guildsToMigrate.length} guilds to migrate\n`);

  if (guildsToMigrate.length === 0) {
    console.log('✅ No guilds need migration. All done!');
    return { migrated: 0, skipped: 0, errors: 0 };
  }

  let migrated = 0;
  const skipped = 0;
  let errors = 0;

  for (const guild of guildsToMigrate) {
    try {
      const oldRegion = guild.region;
      const oldWins = guild.wins || 0;
      const oldLosses = guild.losses || 0;
      const oldElo = guild.elo || 1000;

      // Create new regions array from old fields
      const newRegions = [{
        region: oldRegion,
        wins: oldWins,
        losses: oldLosses,
        elo: oldElo,
        registeredAt: guild.createdAt || new Date(),
        status: 'active'
      }];

      // Update the guild with new regions array
      await GuildModel.updateOne(
        { _id: guild._id },
        {
          $set: { regions: newRegions },
          $unset: { region: '', wins: '', losses: '', elo: '' }
        }
      );

      console.log(
        `  ✅ Migrated: ${guild.name} ` +
        `(${oldRegion}, ${oldWins}W/${oldLosses}L, ELO: ${oldElo})`
      );
      migrated++;
    } catch (error) {
      console.error(`  ❌ Error migrating ${guild.name}:`, error.message);
      errors++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Migrated: ${migrated}`);
  console.log(`   Skipped:  ${skipped}`);
  console.log(`   Errors:   ${errors}`);

  return { migrated, skipped, errors };
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...\n');

  // Check for any guilds still using old format
  const oldFormatGuilds = await GuildModel.find({
    region: { $exists: true, $ne: null },
    $or: [
      { regions: { $exists: false } },
      { regions: { $size: 0 } }
    ]
  }).countDocuments();

  // Check for guilds with new format
  const newFormatGuilds = await GuildModel.find({
    'regions.0': { $exists: true }
  }).countDocuments();

  console.log(`   Old format remaining: ${oldFormatGuilds}`);
  console.log(`   New format count:     ${newFormatGuilds}`);

  if (oldFormatGuilds === 0) {
    console.log('\n✅ Migration verified successfully!');
  } else {
    console.log('\n⚠️ Some guilds still need migration.');
  }
}

async function main() {
  try {
    await connectDB();
    await migrateGuilds();
    await verifyMigration();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

main();
