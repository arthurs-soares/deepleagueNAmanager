const { sendLog } = require('./logger');

/**
 * Log detailed command execution to the guild's log channel.
 * - Single responsibility: format and send command logs
 * @param {import('discord.js').Guild} guild
 * @param {{
 *   name: string,
 *   userId: string,
 *   userTag?: string,
 *   options?: Record<string, any>,
 *   status: 'success'|'error',
 *   resultSummary?: string,
 *   error?: { message: string, stack?: string },
 *   changes?: Array<{ entity: 'guild'|'user'|'system', id: string, field: string, before: any, after: any, reason?: string }>,
 *   timestamp?: Date,
 * }} payload
 */
async function logCommandExecution(guild, payload) {
  try {
    if (!guild || !payload) return;
    const lines = [];
    lines.push(`User: <@${payload.userId}>${payload.userTag ? ` (${payload.userTag})` : ''}`);
    lines.push(`Command: /${payload.name}`);
    if (payload.options && Object.keys(payload.options).length) {
      const optsStr = Object.entries(payload.options)
        .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join(', ');
      lines.push(`Options: ${optsStr}`);
    }
    lines.push(`Status: ${payload.status}`);
    if (payload.resultSummary) lines.push(`Result: ${payload.resultSummary}`);
    if (Array.isArray(payload.changes) && payload.changes.length) {
      for (const c of payload.changes) {
        lines.push(`Change: ${c.entity}:${c.id} ${c.field}: ${c.before} → ${c.after}${c.reason ? ` (${c.reason})` : ''}`);
      }
    }
    if (payload.error) {
      lines.push(`Error: ${payload.error.message}`);
    }
    const description = lines.join('\n');
    await sendLog(guild, 'Command Log', description);
  } catch (_) {
    // silent by design
  }
}

module.exports = { logCommandExecution };

