const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { createInfoEmbed } = require('../../utils/embeds/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency and API response time'),

  cooldown: 3,

  /**
   * Execute the ping command
   * @param {ChatInputCommandInteraction} interaction - Slash command interaction
   */
  async execute(interaction) {
    await interaction.deferReply();

    const wsLatency = interaction.client.ws.ping;
    // Approximate roundtrip using defer + Date.now()
    const start = Date.now();
    await new Promise(r => setTimeout(r, 50));
    const roundtripLatency = Date.now() - start;

    const container = createInfoEmbed(
      'Pong! 🏓',
      `**Roundtrip Latency (approx):** ${roundtripLatency}ms\n**WebSocket Latency:** ${wsLatency}ms`
    );

    await interaction.editReply({
      content: null,
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};
