const Guild = require('../../models/guild/Guild');
const War = require('../../models/war/War');
const { syncAllRosterForums } = require('../roster/rosterForumSync');
const { sendLog } = require('../core/logger');
const { withDatabase } = require('../../config/database');
const LoggerService = require('../../services/LoggerService');


/**
 * Execute a synchronization pass:
 * - Synchronize roster forums on all servers
 * - Clean data from servers the bot no longer participates in (Guild/War)
 * - Basic logging per server
 * @param {import('discord.js').Client} client
 */
async function runAutoSyncPass(client) {
  const start = Date.now();
  const allGuildIds = new Set(client.guilds.cache.map(g => g.id));
  let removedServers = 0;
  let removedGuildDocs = 0;
  let removedWarDocs = 0;

  try {
    // Clean records from servers the bot is no longer in
    const distinctServerIds = await withDatabase(
      () => Guild.distinct('discordGuildId'),
      []
    );
    const staleServerIds = distinctServerIds.filter(id => !allGuildIds.has(id));
    for (const sid of staleServerIds) {
      removedServers += 1;
      const guildDelRes = await withDatabase(
        () => Guild.deleteMany({ discordGuildId: sid }),
        { deletedCount: 0 }
      );
      removedGuildDocs += guildDelRes?.deletedCount || 0;
      const warDelRes = await withDatabase(
        () => War.deleteMany({ discordGuildId: sid }),
        { deletedCount: 0 }
      );
      removedWarDocs += warDelRes?.deletedCount || 0;
      LoggerService.info('[AutoSync] Removed server', {
        serverId: sid,
        guilds: removedGuildDocs,
        wars: removedWarDocs
      });
    }
  } catch (err) {
    LoggerService.error('[AutoSync] Error cleaning stale servers:', {
      error: err?.message
    });
  }

  // For each current server, sync forums and log
  for (const guild of client.guilds.cache.values()) {
    try {
      await syncAllRosterForums(guild);
      await sendLog(
        guild, 'Automatic synchronization',
        'Roster synchronization completed successfully.'
      );
    } catch (err) {
      LoggerService.error(`[AutoSync] Error syncing guild ${guild.id}:`, {
        error: err?.message
      });
      try {
        await sendLog(
          guild, 'Automatic synchronization',
          `Synchronization failed: ${err?.message || err}`
        );
      } catch (_) {}
    }
  }

  const ms = Date.now() - start;
  LoggerService.info('[AutoSync] Pass completed', {
    durationMs: ms,
    serversRemoved: removedServers,
    guildDocsRemoved: removedGuildDocs,
    warDocsRemoved: removedWarDocs
  });
}

/**
 * Schedule periodic execution of automatic synchronization
 * @param {import('discord.js').Client} client
 * @param {{ intervalMs?: number }} options
 */
function scheduleAutoSync(client, { intervalMs } = {}) {
  const minutes = Number(process.env.AUTO_SYNC_MINUTES) || 360;
  const interval = intervalMs || minutes * 60_000;

  // Execute once after ready with small delay
  setTimeout(() => runAutoSyncPass(client).catch(() => {}), 10_000);

  const timer = setInterval(() => {
    runAutoSyncPass(client).catch(() => {});
  }, interval);
  // Don't prevent process from ending
  timer.unref?.();
  LoggerService.info('[AutoSync] Scheduled', {
    intervalMinutes: Math.round(interval / 60000)
  });
}

module.exports = { scheduleAutoSync, runAutoSyncPass };

