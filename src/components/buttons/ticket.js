// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  async execute(interaction, client) {
    const customId = interaction.customId; // ticket_create:report etc or ticket_close
    if (customId.startsWith('ticket_create')) {
      const category = customId.split(':')[1] || 'general';
      await interaction.deferReply({ flags: MessageFlags.IsComponentsV2, ephemeral: true }).catch(()=>{});
      const guild = interaction.guild;
      // Find or create category for tickets
      let ticketCategory = guild.channels.cache.find(c=> c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('ticket'));
      if (!ticketCategory) {
        ticketCategory = await guild.channels.create({ name: 'Tickets', type: ChannelType.GuildCategory }).catch(()=>null);
      }
      const channelName = `ticket-${category}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,90);
      // Check if user already has open ticket
      let ticketsCfg = db.get(guild.id, 'tickets') || { channels: [] };
      if (!Array.isArray(ticketsCfg.channels)) ticketsCfg.channels = [];
      const existing = guild.channels.cache.find(c=> c.name === channelName);
      if (existing && ticketsCfg.channels.includes(existing.id)) {
        const err = builders.buildWarningContainer('Already Open', `You already have a ticket: ${existing}`);
        return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      try {
        const ch = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: ticketCategory ? ticketCategory.id : null,
          permissionOverwrites: [
            { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
            { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] }
          ],
          topic: `Ticket ${category} by ${interaction.user.tag} (${interaction.user.id})`
        }).catch(e=>{ throw e; });

        ticketsCfg.channels.push(ch.id);
        db.set(guild.id, 'tickets', ticketsCfg);

        const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${interaction.user} <@&${guild.roles.cache.find(r=> r.permissions.has(PermissionsBitField.Flags.ManageGuild))?.id || ''}>`))
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.ticket} Ticket Created • ${category.charAt(0).toUpperCase()+category.slice(1)}`))
          .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Welcome ${interaction.user}!\nSupport will be with you shortly.\n**Category:** \`${category}\`\n**Opened:** <t:${Math.floor(Date.now()/1000)}:F>`))
          .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER} • Use buttons to manage`));
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
          new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim').setStyle(ButtonStyle.Primary).setEmoji('🙋')
        );
        await ch.send({ components: [container, row], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
        const ok = new ContainerBuilder().setAccentColor(0x57F287)
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.success} Ticket Opened`))
          .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Your ticket ${ch} has been created in category **${category}**.`))
          .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
          .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
        await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      } catch(e) {
        const err = builders.buildErrorContainer('Failed', cleanError(e.message).slice(0,1500));
        await interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      return;
    }
    if (customId === 'ticket_close' || customId.startsWith('ticket_close')) {
      await interaction.deferReply({ flags: MessageFlags.IsComponentsV2, ephemeral: true }).catch(()=>{});
      if (!interaction.channel.name.startsWith('ticket-')) {
        const err = builders.buildErrorContainer('Not a Ticket', 'This is not a ticket channel.');
        return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
      const ok = builders.buildSuccessContainer('Closing', 'Ticket will be deleted in 3 seconds...');
      await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      // Remove from db
      let cfg = db.get(interaction.guild.id, 'tickets') || { channels: [] };
      cfg.channels = (cfg.channels || []).filter(id=> id !== interaction.channel.id);
      db.set(interaction.guild.id, 'tickets', cfg);
      setTimeout(()=> interaction.channel.delete().catch(()=>{}), 3000);
      return;
    }
    if (customId === 'ticket_claim') {
      await interaction.deferUpdate().catch(()=>{});
      const container = new ContainerBuilder().setAccentColor(0x57F287)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🙋 Claimed\nTicket claimed by ${interaction.user}`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
      await interaction.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      return;
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
