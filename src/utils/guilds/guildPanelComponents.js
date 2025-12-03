const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isGuildLeader } = require('./guildMemberManager');

/**
 * Check if guild has a co-leader
 * @param {object} guildDoc - Guild document
 * @returns {boolean}
 */
function hasCoLeader(guildDoc) {
  if (!guildDoc) return false;
  const members = Array.isArray(guildDoc.members) ? guildDoc.members : [];
  return members.some(m => m.role === 'vice-lider');
}

/**
 * Build guild panel components (buttons)
 * - Edit Roster
 * - Transfer Leadership
 * - Edit Data
 * - Add Co-leader (only visible to current leader; always visible to admin)
 * - Change Co-leader (only when co-leader exists)
 * @param {object} guildDoc - Guild document (Mongo)
 * @param {string} [currentUserId] - ID of the user viewing the panel
 * @param {{isAdmin?:boolean, suppressTransfer?: boolean, suppressEditRoster?: boolean, suppressAddCoLeader?: boolean, suppressEditData?: boolean}} [opts]
 * @returns {import('discord.js').ActionRowBuilder[]}
 */
function buildGuildPanelComponents(guildDoc, currentUserId, opts = {}) {
  if (!guildDoc || (!guildDoc.id && !guildDoc._id)) return [];

  // Use _id if id is not available (MongoDB documents use _id)
  const guildId = guildDoc.id || guildDoc._id;

  const editRosterBtn = new ButtonBuilder()
    .setCustomId(`guild_panel:edit_roster:${guildId}`)
    .setLabel('Edit Roster')
    .setStyle(ButtonStyle.Primary);

  const transferLeadBtn = new ButtonBuilder()
    .setCustomId(`guild_panel:transfer_leadership:${guildId}`)
    .setLabel('Transfer Leadership')
    .setStyle(ButtonStyle.Secondary);

  const editDataBtn = new ButtonBuilder()
    .setCustomId(`guild_panel:edit_data:${guildId}`)
    .setLabel('Edit Data')
    .setStyle(ButtonStyle.Success);

  const suppressTransfer = Boolean(opts?.suppressTransfer);
  const suppressEditRoster = Boolean(opts?.suppressEditRoster);

  const suppressAddCoLeader = Boolean(opts?.suppressAddCoLeader);
  const suppressEditData = Boolean(opts?.suppressEditData);


  // Validate button width to prevent Discord component width errors
  const { estimateActionRowWidth } = require('../validation/componentValidation');
  const labels = [
    ...(suppressEditRoster ? [] : ['Edit Roster']),
    ...(suppressTransfer ? [] : ['Transfer Leadership']),
    ...(suppressEditData ? [] : ['Edit Data'])
  ];
  const validation = estimateActionRowWidth(labels);

  if (!validation.valid && !suppressTransfer && !suppressEditRoster) {
    console.warn('Guild panel button width may exceed limits:', validation.message);
    // Use shorter labels if width is problematic
    transferLeadBtn.setLabel('Transfer Lead');
  }

  const rowButtons = [
    ...(suppressEditRoster ? [] : [editRosterBtn]),
    ...(suppressTransfer ? [] : [transferLeadBtn]),
    ...(suppressEditData ? [] : [editDataBtn])
  ];

  const rows = [];
  if (rowButtons.length > 0) {
    const row1 = new ActionRowBuilder().addComponents(...rowButtons);
    rows.push(row1);
  }

  // Show co-leader management button to leader OR always to admin
  const isAdmin = Boolean(opts?.isAdmin);
  if (isAdmin || (currentUserId && isGuildLeader(guildDoc, currentUserId))) {
    const coLeaderExists = hasCoLeader(guildDoc);

    if (coLeaderExists) {
      // Show "Change Co-leader" button when co-leader exists
      const changeCoLeaderBtn = new ButtonBuilder()
        .setCustomId(`guild_panel:change_co_leader:${guildId}`)
        .setLabel('Change Co-leader')
        .setStyle(ButtonStyle.Secondary);
      rows.push(new ActionRowBuilder().addComponents(changeCoLeaderBtn));
    } else {
      // Show "Add Co-leader" button when no co-leader exists (unless suppressed)
      if (!suppressAddCoLeader) {
        const addCoLeaderBtn = new ButtonBuilder()
          .setCustomId(`guild_panel:add_co_leader:${guildId}`)
          .setLabel('Add Co-leader')
          .setStyle(ButtonStyle.Secondary);
        rows.push(new ActionRowBuilder().addComponents(addCoLeaderBtn));
      }
    }
  }

  return rows;
}

module.exports = { buildGuildPanelComponents, hasCoLeader };

