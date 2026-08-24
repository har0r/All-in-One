// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder().setName('come').setDescription('Summon a member back to a room (DMs them) — e.g. they opened a ticket and went AFK')
    .addUserOption(o => o.setName('user').setDescription('Member to summon').setRequired(true))
    .addChannelOption(o => o.setName('room').setDescription('The room they should return to').setRequired(true).addChannelTypes(ChannelType.GuildText))
    .addStringOption(o => o.setName('reason').setDescription('Why you are summoning them').setRequired(false).setMaxLength(200))
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2, ephemeral: true }).catch(()=>{});
    const user = interaction.options.getUser('user', true);
    const room = interaction.options.getChannel('room', true);
    const reason = interaction.options.getString('reason') || 'We are waiting for you there';
    if (user.bot) {
      const err = builders.buildErrorContainer('Not Possible', 'You cannot summon a bot.');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    try {
      const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 📌 You have been summoned`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Room:** ${room} in **${interaction.guild.name}**\n**Summoned by:** ${interaction.user.tag}\n**Reason:** ${reason}`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel(`Open ${room.name}`).setStyle(ButtonStyle.Link).setURL(`https://discord.com/channels/${interaction.guild.id}/${room.id}`)
      );
      await user.send({ components: [container, row], flags: MessageFlags.IsComponentsV2 }).catch(()=>{ throw new Error('Could not DM this member (their DMs are closed).'); });
      const ok = builders.buildSuccessContainer('Summoned', `DM sent to **${user.tag}** — summoned back to ${room}.\nReason: ${reason}`);
      await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    } catch(e) {
      const err = builders.buildErrorContainer('Failed', e.message.slice(0,1000));
      await interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};
// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
