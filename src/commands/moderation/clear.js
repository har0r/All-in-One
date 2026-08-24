// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder().setName('clear').setDescription('Clear messages')
    .addIntegerOption(o=> o.setName('amount').setDescription('Amount to clear (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o=> o.setName('user').setDescription('Only clear from this user').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2, ephemeral: true }).catch(()=>{});
    const amount = interaction.options.getInteger('amount', true);
    const target = interaction.options.getUser('user');
    try {
      const messages = await interaction.channel.messages.fetch({ limit: amount + 10 }).catch(()=>null);
      if (!messages) throw new Error('Could not fetch messages.');
      let toDelete = [...messages.values()];
      if (target) toDelete = toDelete.filter(m=> m.author.id === target.id);
      toDelete = toDelete.slice(0, amount);
      // Filter out older than 14 days (bulkDelete limitation)
      const deletable = toDelete.filter(m=> Date.now() - m.createdTimestamp < 14*24*3600*1000);
      const old = toDelete.length - deletable.length;
      if (deletable.length) {
        if (deletable.length === 1) await deletable[0].delete().catch(()=>{});
        else await interaction.channel.bulkDelete(deletable, true).catch(async ()=>{
          for (const m of deletable) await m.delete().catch(()=>{});
        });
      }
      const container = new ContainerBuilder().setAccentColor(0x57F287)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.clear} Cleared`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Deleted:** \`${deletable.length}\` messages${target ? ` from ${target.tag}` : ''}\n${old ? `**Skipped (older than 14d):** \`${old}\`` : ''}`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    } catch(e) {
      const err = builders.buildErrorContainer('Clear Failed', e.message.slice(0,1500));
      await interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
