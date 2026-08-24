// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ChannelType } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder().setName('welcome').setDescription('Configure welcome system')
    .addSubcommand(s => s.setName('set').setDescription('Set welcome channel').addChannelOption(o=> o.setName('channel').setDescription('Welcome channel').setRequired(true).addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(s => s.setName('message').setDescription('Set welcome message').addStringOption(o=> o.setName('text').setDescription('Message with {user} {server} {count}').setRequired(true)))
    .addSubcommand(s => s.setName('disable').setDescription('Disable welcome'))
    .addSubcommand(s => s.setName('test').setDescription('Test welcome'))
    .addSubcommand(s => s.setName('status').setDescription('Show welcome status'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    if (sub === 'set') {
      const ch = interaction.options.getChannel('channel', true);
      let cfg = db.get(guildId, 'welcome') || {};
      cfg.channelId = ch.id;
      cfg.enabled = true;
      db.set(guildId, 'welcome', cfg);
      const ok = builders.buildSuccessContainer('Welcome Set', `Welcome channel set to ${ch}.`);
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (sub === 'message') {
      const text = interaction.options.getString('text', true);
      let cfg = db.get(guildId, 'welcome') || {};
      cfg.message = text;
      cfg.enabled = true;
      db.set(guildId, 'welcome', cfg);
      const ok = builders.buildSuccessContainer('Message Set', `Welcome message set:\n\`\`\`${text.slice(0,1500)}\`\`\``);
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (sub === 'disable') {
      db.del(guildId, 'welcome');
      const ok = builders.buildSuccessContainer('Disabled', 'Welcome system disabled.');
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (sub === 'status') {
      const cfg = db.get(guildId, 'welcome');
      if (!cfg || !cfg.channelId) {
        const info = builders.buildInfoContainer({ title: 'Welcome Status', description: 'Not configured. Use `/welcome set`.', emoji: builders.emojis.info });
        return interaction.editReply({ components: [info], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      const ch = interaction.guild.channels.cache.get(cfg.channelId);
      const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.welcome} Welcome Status`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Channel:** ${ch || `\`${cfg.channelId}\``}\n**Enabled:** \`${cfg.enabled !== false}\`\n**Message:**\n\`\`\`${(cfg.message || 'Default').slice(0,1000)}\`\`\``))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (sub === 'test') {
      const cfg = db.get(guildId, 'welcome');
      if (!cfg || !cfg.channelId) {
        const err = builders.buildErrorContainer('Not Setup', 'Welcome not configured.');
        return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      // simulate guildMemberAdd handler
      const handler = require('../../events/guildMemberAdd');
      await handler.execute(interaction.member, client).catch(e=>{
        const err = builders.buildErrorContainer('Test Failed', e.message.slice(0,1000));
        return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      });
      const ok = builders.buildSuccessContainer('Test Sent', 'Welcome test executed (check welcome channel).');
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
