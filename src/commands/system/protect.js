// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder().setName('protect').setDescription('Lightweight server protection (spam / links / invites / honeypot)')
    .addSubcommand(s => s.setName('antispam').setDescription('Timeout members who flood messages')
      .addIntegerOption(o => o.setName('messages').setDescription('Messages allowed in the window').setRequired(true).setMinValue(3).setMaxValue(20))
      .addIntegerOption(o => o.setName('seconds').setDescription('Window length in seconds').setRequired(true).setMinValue(3).setMaxValue(60))
      .addStringOption(o => o.setName('punishment').setDescription('What happens to flooders').setRequired(true)
        .addChoices({ name: 'Timeout 10m', value: 'timeout' }, { name: 'Kick', value: 'kick' }, { name: 'Ban', value: 'ban' })))
    .addSubcommand(s => s.setName('antilink').setDescription('Block links from regular members')
      .addStringOption(o => o.setName('punishment').setDescription('Action').setRequired(true)
        .addChoices({ name: 'Delete only', value: 'delete' }, { name: 'Delete + Timeout', value: 'timeout' })))
    .addSubcommand(s => s.setName('antiinvite').setDescription('Block Discord invites from regular members')
      .addStringOption(o => o.setName('punishment').setDescription('Action').setRequired(true)
        .addChoices({ name: 'Delete only', value: 'delete' }, { name: 'Delete + Timeout', value: 'timeout' })))
    .addSubcommand(s => s.setName('honeypot').setDescription('Create a trap channel — anyone who talks in it gets punished')
      .addStringOption(o => o.setName('punishment').setDescription('What happens to anyone who posts there').setRequired(true)
        .addChoices({ name: 'Ban', value: 'ban' }, { name: 'Kick', value: 'kick' })))
    .addSubcommand(s => s.setName('honeypot-remove').setDescription('Remove the honeypot channel'))
    .addSubcommand(s => s.setName('status').setDescription('Show protection status'))
    .addSubcommand(s => s.setName('disable').setDescription('Turn off all protection'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2, ephemeral: true }).catch(()=>{});
    const cfg = () => db.get(guildId, 'protect') || {};

    if (sub === 'disable') {
      db.del(guildId, 'protect');
      const ok = builders.buildSuccessContainer('Protection Disabled', 'All protection modules are off.');
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }

    if (sub === 'status') {
      const c0 = cfg();
      const lines = [];
      lines.push(c0.antispam ? `**Anti-Spam:** on — ${c0.antispam.msgs} msgs / ${c0.antispam.secs}s → ${c0.antispam.punishment}` : '**Anti-Spam:** off');
      lines.push(c0.antilink ? `**Anti-Link:** on → ${c0.antilink}` : '**Anti-Link:** off');
      lines.push(c0.antiinvite ? `**Anti-Invite:** on → ${c0.antiinvite}` : '**Anti-Invite:** off');
      lines.push(c0.honeypot ? `**Honeypot:** <#${c0.honeypot.channelId}> → ${c0.honeypot.punishment}` : '**Honeypot:** not set');
      const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
      const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Protection Status`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER} • Staff with Manage Messages are always ignored`));
      return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }

    if (sub === 'honeypot-remove') {
      const c0 = cfg();
      if (c0.honeypot) {
        const ch = interaction.guild.channels.cache.get(c0.honeypot.channelId);
        if (ch) await ch.delete().catch(()=>{});
        delete c0.honeypot;
        db.set(guildId, 'protect', c0);
      }
      const ok = builders.buildSuccessContainer('Honeypot Removed', 'The trap channel was deleted.');
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }

    if (sub === 'honeypot') {
      const punishment = interaction.options.getString('punishment', true);
      const old = cfg().honeypot;
      if (old) {
        const prev = interaction.guild.channels.cache.get(old.channelId);
        if (prev) await prev.delete().catch(()=>{});
      }
      const ch = await interaction.guild.channels.create({
        name: 'honeypot',
        type: ChannelType.GuildText,
        reason: `Honeypot trap (${punishment}) by ${interaction.user.tag}`
      }).catch(()=>null);
      if (!ch) {
        const err = builders.buildErrorContainer('Failed', 'I could not create the channel — check my permissions.');
        return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      const c0 = cfg();
      c0.honeypot = { channelId: ch.id, punishment };
      db.set(guildId, 'protect', c0);
      const { ContainerBuilder, TextDisplayBuilder, MessageFlags: MF } = require('discord.js');
      const warn = new ContainerBuilder().setAccentColor(0xED4245)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`⚠️ **This channel is a honeypot trap.**\nAny message sent here is deleted instantly and you get **${punishment}ned**. It exists to catch hacked accounts and spam bots — do not type here.`));
      await ch.send({ components: [warn], flags: MF.IsComponentsV2 }).catch(()=>{});
      const ok = builders.buildSuccessContainer('Honeypot Ready',
        `Trap channel: ${ch}\nWarning message posted inside it.\nAnyone who sends **anything** there gets **${punishment}ned**${punishment === 'kick' ? ' (kicked)' : ''}.\n-# Staff with Manage Messages are ignored.`);
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }

    const c0 = cfg();
    if (sub === 'antispam') {
      const msgs = interaction.options.getInteger('messages', true);
      const secs = interaction.options.getInteger('seconds', true);
      const punishment = interaction.options.getString('punishment', true);
      c0.antispam = { msgs, secs, punishment };
    } else if (sub === 'antilink') {
      c0.antilink = interaction.options.getString('punishment', true);
    } else if (sub === 'antiinvite') {
      c0.antiinvite = interaction.options.getString('punishment', true);
    }
    db.set(guildId, 'protect', c0);
    const ok = builders.buildSuccessContainer('Protection Updated', 'Saved. Check `/protect status` for the full picture.');
    await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
  }
};
// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
