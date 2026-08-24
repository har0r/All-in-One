// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const builders = require('../../utils/builders');

const pending = new Map(); // key -> { members, content, target, ts }

function takePending(key) {
  const entry = pending.get(key);
  if (!entry || Date.now() - entry.ts > 5 * 60 * 1000) return null;
  pending.delete(key);
  return entry;
}

module.exports = {
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2, ephemeral: true }).catch(()=>{});
    const parts = interaction.customId.split(':');
    const target = parts[1];
    const content = interaction.fields.getTextInputValue('message').trim();

    let members;
    try {
      members = await interaction.guild.members.fetch();
    } catch {
      const err = builders.buildErrorContainer('Missing Intent', 'Enable SERVER MEMBERS INTENT in the Discord Developer Portal to use broadcast.');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }

    const humans = members.filter(m => !m.user.bot);
    let list;
    if (target === 'online') {
      list = humans.filter(m => m.presence && m.presence.status !== 'offline');
    } else if (target === 'offline') {
      list = humans.filter(m => !m.presence || m.presence.status === 'offline');
    } else {
      list = humans;
    }

    if (list.size === 0) {
      const err = builders.buildErrorContainer('Nobody to Send', target === 'online'
        ? 'No online members found. If this looks wrong, enable PRESENCE INTENT in the Developer Portal.'
        : 'No members matched this target.');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }

    const presenceWarn = (target !== 'all' && !humans.some(m => m.presence))
      ? `\n-# Presence data unavailable — counts may be wrong. Enable PRESENCE INTENT in the Developer Portal.` : '';

    const key = `${interaction.user.id}_${Date.now()}`;
    pending.set(key, { members: [...list.values()], content, target, ts: Date.now() });
    setTimeout(() => pending.delete(key), 5 * 60 * 1000);

    const container = new ContainerBuilder().setAccentColor(0xFAA61A)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Confirm Broadcast\n**Target:** ${target} members\n**Will DM:** \`${list.size}\` members\n\n**Message:**\n>>> ${content.slice(0, 900)}${presenceWarn}`))
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Sending takes ~1.2s per member. You have 5 minutes to confirm.`))
      .addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`broadcast_confirm_${key}`).setLabel(`Send to ${list.size} members`).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`broadcast_cancel_${key}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary)
      ));
    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
  },
  takePending
};
// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
