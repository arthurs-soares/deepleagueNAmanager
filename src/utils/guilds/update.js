const Guild = require('../../models/guild/Guild');

async function updateGuild(guildId, updateData) {
  const updatedGuild = await Guild.findByIdAndUpdate(
    guildId,
    { ...updateData, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!updatedGuild) return { success: false, message: 'Guilda não encontrada.', guild: null };
  return { success: true, message: 'Guilda atualizada com sucesso!', guild: updatedGuild };
}

module.exports = { updateGuild };

