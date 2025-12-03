const Guild = require('../../models/guild/Guild');
const LoggerService = require('../../services/LoggerService');

/**
 * Migrates existing guilds to check for leader consistency
 * Note: registeredBy is NOT the leader, only member with role='lider'
 */
async function migrateExistingGuilds() {
  try {
    LoggerService.info('Starting guild migration check...');

    const guilds = await Guild.find({});
    let issuesCount = 0;

    for (const guild of guilds) {
      const hasLeader = guild.members.some(m => m.role === 'lider');

      if (!hasLeader) {
        LoggerService.warn(`Guild without leader: ${guild.name}`, {
          id: guild._id
        });
        issuesCount++;
      }
    }

    LoggerService.info('Migration check completed', {
      issues: issuesCount,
      total: guilds.length
    });
    return { success: true, issues: issuesCount, total: guilds.length };
  } catch (error) {
    LoggerService.error('Migration error:', { error: error?.message });
    return { success: false, error: error.message };
  }
}

/**
 * Run migration if executed directly
 */
async function main() {
  const mongoose = require('mongoose');
  require('dotenv').config();

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    LoggerService.info('Connected to MongoDB');

    const result = await migrateExistingGuilds();
    LoggerService.info('Result:', result);
    process.exit(0);
  } catch (error) {
    LoggerService.error('Error:', { error: error?.message });
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { migrateExistingGuilds };
