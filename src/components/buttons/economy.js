// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const db = require('../../utils/db');

module.exports = {
  async execute(interaction, client) {
    const parts = interaction.customId.split('_'); // economy_yes_guildId or economy_no_guildId
    const choice = parts[1]; // yes or no
    const guildId = parts[2];
    if (interaction.guild.id !== guildId) {
      const c=new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(new TextDisplayBuilder().setContent(`❌ This choice is for another server`));
      return interaction.reply({components:[c], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2}).catch(()=>{});
    }
    if (!interaction.member.permissions.has('ManageGuild') && !client.config.owner.includes(interaction.user.id)) {
      const c=new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(new TextDisplayBuilder().setContent(`❌ Need Manage Server to choose`));
      return interaction.reply({components:[c], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2}).catch(()=>{});
    }
    const enabled = choice === 'yes';
    db.set(guildId, 'economy_enabled', enabled);
    const container = new ContainerBuilder().setAccentColor(enabled?0x57F287:0x2F3136)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${enabled?'💰 Economy Enabled':'👥 Community Mode'}\n${enabled?'Your server is now in **Shop/Store mode** - economy, daily, shop enabled.':'Your server is in **Community mode** - clean, leveling & moderation focused.'}`))
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# You can toggle anytime with \`/economy toggle\` • Chosen by ${interaction.user.tag}`));
    try { await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 }); } catch {
      await interaction.reply({components:[container], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2}).catch(()=>{});
    }
  }
};
// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
