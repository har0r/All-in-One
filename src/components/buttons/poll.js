// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');

module.exports = {
  async execute(interaction, client) {
    // customId: poll_vote:<pollId>:<optionIndex>
    const parts = interaction.customId.split(':');
    const pollId = parts[1];
    const optIdx = parseInt(parts[2],10);
    if (isNaN(optIdx)) return;
    const key = `poll_${interaction.guild.id}_${pollId}`;
    let poll = db.get(key);
    if (!poll) {
      // Try find by message id fallback
      const container = builders.buildErrorContainer('Poll Not Found', 'This poll no longer exists.');
      return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
    }
    poll.votes = poll.votes || {};
    const prev = poll.votes[interaction.user.id];
    poll.votes[interaction.user.id] = optIdx;
    db.set(key, poll);

    // Recalculate counts
    const counts = new Array(poll.options.length).fill(0);
    for (const v of Object.values(poll.votes)) counts[v] = (counts[v]||0)+1;
    const total = Object.keys(poll.votes).length;

    // Build updated container
    const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.poll} Poll\n**${poll.question}**`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(poll.options.map((o,i)=>{
        const c = counts[i] || 0;
        const pct = total ? Math.round(c/total*100) : 0;
        const bar = '█'.repeat(Math.round(pct/10)) + '░'.repeat(10-Math.round(pct/10));
        return `**${i+1}.** ${o} — \`${c} votes\` (${pct}%)\n\`${bar}\``;
      }).join('\n\n')))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Total votes: \`${total}\` • ${prev !== undefined ? `Changed vote from ${prev+1} to ${optIdx+1}` : `Voted for ${poll.options[optIdx]}`} • -# ${builders.BRAND_FOOTER}`));

    // Keep same buttons but update label counts? Recreate buttons
    const row = new ActionRowBuilder();
    const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣'];
    poll.options.forEach((opt,i)=>{
      row.addComponents(new ButtonBuilder().setCustomId(`poll_vote:${pollId}:${i}`).setLabel(`${opt.slice(0,30)} (${counts[i]||0})`).setStyle(i===optIdx ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji(emojis[i]));
    });

    try {
      await interaction.update({ components: [container, row], flags: MessageFlags.IsComponentsV2 }).catch(async ()=>{
        await interaction.reply({ components: [new ContainerBuilder().setAccentColor(0x57F287).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.success} Voted!\nYou voted for **${poll.options[optIdx]}**`)).addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`))], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
      });
      // Also update original message if we replied ephemerally? Already did update.
    } catch(e) {
      const err = builders.buildErrorContainer('Vote Failed', e.message.slice(0,1000));
      await interaction.reply({ components: [err], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(()=>{});
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
