// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

function parseDuration(str) {
  const m = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!m) return null;
  const n = parseInt(m[1],10);
  const unit = m[2].toLowerCase();
  const mult = { s:1000, m:60000, h:3600000, d:86400000 }[unit];
  return n*mult;
}

module.exports = {
  data: new SlashCommandBuilder().setName('giveaway').setDescription('Giveaway system')
    .addSubcommand(s=> s.setName('create').setDescription('Create giveaway')
      .addStringOption(o=> o.setName('prize').setDescription('Prize').setRequired(true))
      .addStringOption(o=> o.setName('duration').setDescription('Duration e.g. 1h, 30m, 1d').setRequired(true))
      .addIntegerOption(o=> o.setName('winners').setDescription('Number of winners').setRequired(false).setMinValue(1).setMaxValue(10))
      .addChannelOption(o=> o.setName('channel').setDescription('Channel').setRequired(false))
    )
    .addSubcommand(s=> s.setName('end').setDescription('End giveaway').addStringOption(o=> o.setName('message_id').setDescription('Giveaway message ID').setRequired(true)))
    .addSubcommand(s=> s.setName('reroll').setDescription('Reroll giveaway').addStringOption(o=> o.setName('message_id').setDescription('Giveaway message ID').setRequired(true)))
    .addSubcommand(s=> s.setName('list').setDescription('List active giveaways'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'list') {
      await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      const all = db.get(guildId, 'giveaways') || [];
      if (!all.length) {
        const info = builders.buildInfoContainer({ title: 'Giveaways', description: 'No active giveaways.', emoji: builders.emojis.giveaway });
        return interaction.editReply({ components: [info], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      const lines = all.map(g=> `**Prize:** ${g.prize} • Ends <t:${Math.floor(g.endsAt/1000)}:R> • Channel <#${g.channelId}> • ID \`${g.messageId || 'pending'}\` • Winners \`${g.winners}\``).join('\n');
      const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.giveaway} Giveaways`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.slice(0,3000) || 'None'))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }

    if (sub === 'create') {
      await interaction.deferReply({ flags: MessageFlags.IsComponentsV2, ephemeral: true }).catch(()=>{});
      const prize = interaction.options.getString('prize', true);
      const durStr = interaction.options.getString('duration', true);
      const winners = interaction.options.getInteger('winners') || 1;
      const channel = interaction.options.getChannel('channel') || interaction.channel;
      const ms = parseDuration(durStr);
      if (!ms) {
        const err = builders.buildErrorContainer('Invalid Duration', 'Use e.g. 10m, 1h, 1d');
        return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      const endsAt = Date.now() + ms;
      const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.giveaway} Giveaway`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Prize:** **${prize}**\n**Winners:** \`${winners}\`\n**Ends:** <t:${Math.floor(endsAt/1000)}:R> (<t:${Math.floor(endsAt/1000)}:F>)\n**Hosted by:** ${interaction.user}`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER} • Click Join to enter!`));
      const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`giveaway_join:${Date.now()}`).setLabel('Join 🎉').setStyle(ButtonStyle.Success));
      let msg;
      try {
        msg = await channel.send({ components: [container, row], flags: MessageFlags.IsComponentsV2 }).catch(e=>{ throw e; });
      } catch(e) {
        const err = builders.buildErrorContainer('Failed', e.message.slice(0,1500));
        return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      let giveaways = db.get(guildId, 'giveaways') || [];
      giveaways.push({ prize, duration: durStr, winners, channelId: channel.id, messageId: msg.id, endsAt, hostedBy: interaction.user.id, participants: [], ended: false });
      db.set(guildId, 'giveaways', giveaways);
      // Auto end timeout
      setTimeout(async () => {
        try {
          let gws = db.get(guildId, 'giveaways') || [];
          const idx = gws.findIndex(g=> g.messageId === msg.id);
          if (idx === -1 || gws[idx].ended) return;
          gws[idx].ended = true;
          db.set(guildId, 'giveaways', gws);
          const participants = gws[idx].participants || [];
          let winnersText = 'No participants';
          if (participants.length) {
            const shuffled = participants.sort(()=> 0.5 - Math.random()).slice(0, winners);
            winnersText = shuffled.map(id=> `<@${id}>`).join(', ');
          }
          const endContainer = new ContainerBuilder().setAccentColor(0x57F287)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.giveaway} Giveaway Ended`))
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Prize:** ${prize}\n**Winners:** ${winnersText}`))
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
          await msg.edit({ components: [endContainer], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
          await channel.send({ content: winnersText !== 'No participants' ? `🎉 Congratulations ${winnersText}! You won **${prize}**!` : `No winners for **${prize}**` }).catch(()=>{});
        } catch {}
      }, ms);
      const ok = builders.buildSuccessContainer('Giveaway Created', `Giveaway for **${prize}** created in ${channel} ending <t:${Math.floor(endsAt/1000)}:R>.`);
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }

    if (sub === 'end') {
      await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      const msgId = interaction.options.getString('message_id', true);
      let gws = db.get(guildId, 'giveaways') || [];
      const idx = gws.findIndex(g=> g.messageId === msgId);
      if (idx === -1) {
        const err = builders.buildErrorContainer('Not Found', 'Giveaway not found.');
        return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      gws[idx].ended = true;
      const g = gws[idx];
      db.set(guildId, 'giveaways', gws);
      const participants = g.participants || [];
      let winnersText = 'No participants';
      if (participants.length) {
        const shuffled = participants.sort(()=> 0.5 - Math.random()).slice(0, g.winners);
        winnersText = shuffled.map(id=> `<@${id}>`).join(', ');
      }
      const ok = builders.buildSuccessContainer('Giveaway Ended', `Winners: ${winnersText}`);
      // try to edit message
      try {
        const ch = await client.channels.fetch(g.channelId).catch(()=>null);
        if (ch) {
          const m = await ch.messages.fetch(msgId).catch(()=>null);
          if (m) {
            const endContainer = new ContainerBuilder().setAccentColor(0x57F287)
              .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.giveaway} Giveaway Ended`))
              .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Prize:** ${g.prize}\n**Winners:** ${winnersText}`))
              .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
              .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
            await m.edit({ components: [endContainer], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
          }
        }
      } catch {}
      return interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }

    if (sub === 'reroll') {
      await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      const msgId = interaction.options.getString('message_id', true);
      const gws = db.get(guildId, 'giveaways') || [];
      const g = gws.find(x=> x.messageId === msgId);
      if (!g) {
        const err = builders.buildErrorContainer('Not Found', 'Giveaway not found.');
        return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      const participants = g.participants || [];
      if (!participants.length) {
        const err = builders.buildErrorContainer('No Entries', 'No participants to reroll.');
        return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      const shuffled = participants.sort(()=> 0.5 - Math.random()).slice(0, g.winners);
      const winnersText = shuffled.map(id=> `<@${id}>`).join(', ');
      const ok = builders.buildSuccessContainer('Rerolled', `New winners: ${winnersText} for **${g.prize}**`);
      await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      try {
        const ch = await client.channels.fetch(g.channelId).catch(()=>null);
        if (ch) await ch.send({ content: `🎉 Reroll: Congratulations ${winnersText}! You won **${g.prize}**!` }).catch(()=>{});
      } catch {}
      return;
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
