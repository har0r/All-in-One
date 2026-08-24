// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder().setName('userinfo').setDescription('Show user information')
    .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(false)),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const target = interaction.options.getUser('user') || interaction.user;
    const member = interaction.guild.members.cache.get(target.id) || await interaction.guild.members.fetch(target.id).catch(()=>null);
    const created = Math.floor(target.createdTimestamp / 1000);
    const joined = member ? Math.floor(member.joinedTimestamp / 1000) : null;

    // Silent roles: show count and list but hidden via spoiler? Spec says silent roles - we show count and roles without ping?
    let rolesDisplay = 'No roles';
    if (member) {
      const roles = member.roles.cache.filter(r => r.id !== interaction.guild.id).sort((a,b)=> b.position - a.position).map(r=> `\`${r.name}\``);
      if (roles.length) {
        rolesDisplay = roles.join(', ');
        if (rolesDisplay.length > 1000) rolesDisplay = rolesDisplay.slice(0, 1000) + '...';
      }
    }

    const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.user} User Info • ${target.tag}`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**User:** ${target} • \`${target.id}\`\n**Created:** <t:${created}:F> (<t:${created}:R>)\n${joined ? `**Joined:** <t:${joined}:F> (<t:${joined}:R>)` : ''}`))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Bot:** \`${target.bot ? 'Yes' : 'No'}\` • **Nickname:** \`${member?.nickname || 'None'}\``))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Roles [${member ? member.roles.cache.size -1 : 0}]:**\n${rolesDisplay}`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));

    if (target.displayAvatarURL()) {
      const { MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
      const gallery = new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(target.displayAvatarURL({ size: 1024, extension: 'png', forceStatic: false })).setDescription('Avatar'));
      container.addMediaGalleryComponents(gallery);
    }

    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
