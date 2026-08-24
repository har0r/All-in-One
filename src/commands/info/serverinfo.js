// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ChannelType } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder().setName('serverinfo').setDescription('Show server information'),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const guild = interaction.guild;
    await guild.fetch().catch(()=>{});
    const owner = await guild.fetchOwner().catch(()=>null);
    const created = Math.floor(guild.createdTimestamp / 1000);
    const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
    const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
    const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.server} Server Info • ${guild.name}`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Owner:** ${owner ? `${owner.user.tag} (${owner.id})` : 'Unknown'}\n**Created:** <t:${created}:F> (<t:${created}:R>)\n**ID:** \`${guild.id}\``))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Members:** \`${guild.memberCount}\` • **Roles:** \`${guild.roles.cache.size}\`\n**Channels:** Text \`${textChannels}\` • Voice \`${voiceChannels}\` • Categories \`${categories}\``))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Boosts:** \`${guild.premiumSubscriptionCount || 0}\` • **Level:** \`${guild.premiumTier}\`\n**Emojis:** \`${guild.emojis.cache.size}\` • **Stickers:** \`${guild.stickers.cache.size}\``))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER} • Icon: ${guild.iconURL() ? '[Link]('+guild.iconURL({size:1024})+')' : 'None'}`));
    if (guild.iconURL()) {
      const { MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
      const gallery = new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(guild.iconURL({ size: 1024, extension: 'png' })).setDescription('Server Icon'));
      container.addMediaGalleryComponents(gallery);
    }
    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
