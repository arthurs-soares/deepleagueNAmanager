const { logCommandExecution } = require('../core/commandLogger');

async function logCommandSuccess(interaction, commandName, optionsObj) {
  const extra = interaction._commandLogExtra || {};
  await logCommandExecution(interaction.guild, {
    name: commandName,
    userId: interaction.user.id,
    userTag: interaction.user.tag,
    options: optionsObj,
    status: 'success',
    resultSummary: extra.resultSummary || 'OK',
    changes: Array.isArray(extra.changes) ? extra.changes : undefined,
    timestamp: new Date(),
  });
}

async function logCommandError(interaction, commandName, error, optionsObj) {
  await logCommandExecution(interaction.guild, {
    name: commandName,
    userId: interaction.user.id,
    userTag: interaction.user.tag,
    options: optionsObj,
    status: 'error',
    error: { message: error?.message || String(error) },
    timestamp: new Date(),
  });
}

module.exports = { logCommandSuccess, logCommandError };

