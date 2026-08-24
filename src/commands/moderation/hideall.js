// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder().setName('hideall').setDescription('Hide all channels')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    let done = 0, failed = 0;
    for (const ch of interaction.guild.channels.cache.values()) {
      try {
        if (!ch.isTextBased() && ch.type !== 4) {} // allow categories too but skip
        await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false }).catch(()=>{ throw new Error(); });
        done++;
      } catch { failed++; }
    }
    const ok = new ContainerBuilder().setAccentColor(0x5865F2)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.hide} Hide All`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Hidden:** \`${done}\` channels\n**Failed:** \`${failed}\``))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
    await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
