// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder().setName('warnings').setDescription('Show warnings for a user')
    .addUserOption(o=> o.setName('user').setDescription('User to check').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const user = interaction.options.getUser('user', true);
    const key = `warns_${interaction.guild.id}_${user.id}`;
    const data = db.get(key) || [];
    if (!data.length) {
      const empty = builders.buildInfoContainer({ title: 'No Warnings', description: `${user.tag} has no warnings.`, emoji: builders.emojis.success, color: 0x57F287 });
      return interaction.editReply({ components: [empty], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    const list = data.slice(-10).map((w,i)=> `**${i+1}.** ${w.reason} — <@${w.moderator}> <t:${Math.floor(w.at/1000)}:R>`).join('\n');
    const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.warning} Warnings • ${user.tag}`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(list))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Total:** \`${data.length}\``))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
