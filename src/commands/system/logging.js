// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ChannelType, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder().setName('logging').setDescription('Configure professional logging')
    .addSubcommand(s=> s.setName('set').setDescription('Set logging channel').addChannelOption(o=> o.setName('channel').setDescription('Log channel').setRequired(true).addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(s=> s.setName('disable').setDescription('Disable logging'))
    .addSubcommand(s=> s.setName('status').setDescription('Show logging status'))
    .addSubcommand(s=> s.setName('setup').setDescription('Auto-create logging category and channels'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    if (sub === 'set') {
      const ch = interaction.options.getChannel('channel', true);
      const cfg = db.get(guildId, 'logging') || {};
      cfg.channelId = ch.id;
      cfg.enabled = true;
      cfg.disabledGroups = cfg.disabledGroups || [];
      db.set(guildId, 'logging', cfg);
      const ok = builders.buildSuccessContainer('Logging Set', `Logging channel set to ${ch}.\nGroups: messages/members/roles/channels/vc/moderation all enabled.`);
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (sub === 'disable') {
      db.del(guildId, 'logging');
      const ok = builders.buildSuccessContainer('Disabled', 'Logging disabled.');
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (sub === 'status') {
      const cfg = db.get(guildId, 'logging');
      if (!cfg) {
        const info = builders.buildInfoContainer({ title: 'Logging Status', description: 'Not configured. Use `/logging set` or `/logging setup`.', emoji: builders.emojis.logging });
        return interaction.editReply({ components: [info], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      const ch = interaction.guild.channels.cache.get(cfg.channelId);
      const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.logging} Logging Status`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Channel:** ${ch || `\`${cfg.channelId}\``}\n**Enabled:** \`${cfg.enabled}\`\n**Groups:** messages, members, roles, channels, vc, moderation\n**Disabled Groups:** \`${cfg.disabledGroups && cfg.disabledGroups.length ? cfg.disabledGroups.join(', ') : 'None'}\``))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (sub === 'setup') {
      await interaction.editReply({ components: [new ContainerBuilder().setAccentColor(builders.BRAND_COLOR).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.loading} Setting up...`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(`Creating category and log channel...`))], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      try {
        // Create category TechRoad Logs if not exists
        let category = interaction.guild.channels.cache.find(c=> c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('log'));
        if (!category) {
          category = await interaction.guild.channels.create({ name: 'TechRoad Logs', type: ChannelType.GuildCategory }).catch(()=>null);
        }
        const ch = await interaction.guild.channels.create({ name: 'techroad-logs', type: ChannelType.GuildText, parent: category ? category.id : null, topic: 'TechRoad professional logs: messages/members/roles/channels/vc/moderation' }).catch(e=>{ throw e; });
        const cfg = db.get(guildId, 'logging') || {};
        cfg.channelId = ch.id;
        cfg.enabled = true;
        cfg.disabledGroups = [];
        db.set(guildId, 'logging', cfg);
        const ok = builders.buildSuccessContainer('Logging Setup Complete', `Created ${ch} under ${category ? category.name : 'no category'} and enabled professional logging.\nAll groups enabled with audit log.`);
        await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      } catch(e) {
        const err = builders.buildErrorContainer('Setup Failed', e.message.slice(0,1500));
        await interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      return;
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
