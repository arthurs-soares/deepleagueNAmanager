/**
 * Migration script: Move global rosters to region-specific rosters
 *
 * This script migrates mainRoster and subRoster from guild root level
 * to each region in the regions array.
 *
 * Run with: node scripts/migrate-rosters-to-regions.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Guild = require('../src/models/guild/Guild');

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateRosters() {
  console.log('Starting roster migration...\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const guilds = await Guild.find({});
    console.log(`Found ${guilds.length} guilds to process\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const guild of guilds) {
      try {
        const globalMain = Array.isArray(guild.mainRoster)
          ? guild.mainRoster
          : [];
        const globalSub = Array.isArray(guild.subRoster)
          ? guild.subRoster
          : [];

        // Skip if no global rosters to migrate
        if (globalMain.length === 0 && globalSub.length === 0) {
          console.log(`[SKIP] ${guild.name}: No global rosters`);
          skippedCount++;
          continue;
        }

        // Skip if no regions defined
        if (!Array.isArray(guild.regions) || guild.regions.length === 0) {
          console.log(`[SKIP] ${guild.name}: No regions defined`);
          skippedCount++;
          continue;
        }

        // Check if already migrated (any region has roster data)
        const alreadyMigrated = guild.regions.some(r =>
          (Array.isArray(r.mainRoster) && r.mainRoster.length > 0) ||
          (Array.isArray(r.subRoster) && r.subRoster.length > 0)
        );

        if (alreadyMigrated) {
          console.log(`[SKIP] ${guild.name}: Already migrated`);
          skippedCount++;
          continue;
        }

        // Copy global rosters to each region
        let updated = false;
        for (const region of guild.regions) {
          if (!Array.isArray(region.mainRoster)) {
            region.mainRoster = [];
          }
          if (!Array.isArray(region.subRoster)) {
            region.subRoster = [];
          }

          // Copy global rosters to this region
          region.mainRoster = [...globalMain];
          region.subRoster = [...globalSub];
          updated = true;
        }

        if (updated) {
          await guild.save();
          console.log(
            `[OK] ${guild.name}: Migrated to ${guild.regions.length} region(s)`
          );
          migratedCount++;
        }
      } catch (err) {
        console.error(`[ERROR] ${guild.name}: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n--- Migration Summary ---');
    console.log(`Migrated: ${migratedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total: ${guilds.length}`);

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

migrateRosters();
