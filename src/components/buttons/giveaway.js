// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  async execute(interaction, client) {
    const guildId = interaction.guild.id;
    const messageId = interaction.message.id;
    let gws = db.get(guildId, 'giveaways') || [];
    const idx = gws.findIndex(g=> g.messageId === messageId);
    if (idx === -1) {
      const err = builders.buildErrorContainer('Not Found', 'Giveaway not found or already ended.');
      return interaction.reply({ components: [err], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
    }
    const g = gws[idx];
    if (g.ended) {
      const err = builders.buildWarningContainer('Ended', 'This giveaway has already ended.');
      return interaction.reply({ components: [err], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
    }
    if (g.participants.includes(interaction.user.id)) {
      const warn = builders.buildWarningContainer('Already Joined', 'You already entered this giveaway.');
      return interaction.reply({ components: [warn], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
    }
    g.participants.push(interaction.user.id);
    gws[idx] = g;
    db.set(guildId, 'giveaways', gws);
    const ok = new ContainerBuilder().setAccentColor(0x57F287)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.success} Joined!`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`You entered the giveaway for **${g.prize}**!\n**Participants:** \`${g.participants.length}\``))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
    await interaction.reply({ components: [ok], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
