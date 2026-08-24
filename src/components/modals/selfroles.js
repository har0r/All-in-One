// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2, ephemeral: true }).catch(()=>{});
    const title = interaction.fields.getTextInputValue('title');
    const desc = interaction.fields.getTextInputValue('description');
    const rolesRaw = interaction.fields.getTextInputValue('roles');
    const type = interaction.fields.getTextInputValue('type')?.toLowerCase() || 'buttons';

    const roleIds = rolesRaw.split(',').map(s=> s.trim().replace(/[<@&>]/g,'')).filter(id=> /^\d{17,19}$/.test(id)).slice(0,4);
    if (!roleIds.length) {
      const err = builders.buildErrorContainer('Invalid Roles', 'Provide 1-4 valid role IDs comma separated.');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    if (roleIds.length > 4) {
      const err = builders.buildErrorContainer('Too Many', 'Maximum 4 roles allowed (TechRoad limit).');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    // Validate roles exist
    const valid = [];
    for (const id of roleIds) {
      const r = interaction.guild.roles.cache.get(id);
      if (r) valid.push(r);
    }
    if (!valid.length) {
      const err = builders.buildErrorContainer('No Valid Roles', 'None of the IDs match roles in this guild.');
      return interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }

    const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.selfroles} ${title}`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(desc))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Roles:** ${valid.map(r=>`${r}`).join(', ')}`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER} • Click to toggle`));

    let components = [container];
    if (type === 'select') {
      const select = new StringSelectMenuBuilder().setCustomId(`selfroles_select:${valid.map(r=>r.id).join(',')}`).setPlaceholder('Select roles').setMinValues(0).setMaxValues(valid.length).addOptions(valid.map(r=> ({ label: r.name.slice(0,100), value: r.id, emoji: '🎭' })));
      const row = new ActionRowBuilder().addComponents(select);
      components.push(row);
    } else {
      const row = new ActionRowBuilder();
      valid.forEach(r=> {
        row.addComponents(new ButtonBuilder().setCustomId(`selfroles:${r.id}`).setLabel(r.name.slice(0,80)).setStyle(ButtonStyle.Secondary));
      });
      components.push(row);
    }

    try {
      const msg = await interaction.channel.send({ components, flags: MessageFlags.IsComponentsV2 }).catch(e=>{ throw e; });
      let cfg = db.get(interaction.guild.id, 'selfroles') || [];
      cfg.push({ messageId: msg.id, channelId: interaction.channel.id, roles: valid.map(r=>r.id), type, title });
      db.set(interaction.guild.id, 'selfroles', cfg);
      const ok = builders.buildSuccessContainer('Selfroles Created', `Panel sent with ${valid.length} roles (${type}).\nMessage ID: \`${msg.id}\``);
      await interaction.editReply({ components: [ok], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    } catch(e) {
      const err = builders.buildErrorContainer('Failed', e.message.slice(0,1500));
      await interaction.editReply({ components: [err], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
