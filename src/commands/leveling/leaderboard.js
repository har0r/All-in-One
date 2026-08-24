// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
  data: new SlashCommandBuilder().setName('leaderboard').setDescription('Show leveling leaderboard'),
  async execute(interaction, client) {
    // This file is for leveling leaderboard, but also handle economy if requested? Keep separate file for economy leaderboard.
    // For redundancy, check guildId
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const guildId = interaction.guild.id;
    const folder = path.join(__dirname, '..', '..', '..', 'database');
    let entries = [];
    try {
      const files = fs.readdirSync(folder).filter(f=> f.startsWith(`level_${guildId}_`) && f.endsWith('.json'));
      for (const f of files) {
        const key = f.replace('.json','');
        const data = db.get(key);
        if (data) {
          const userId = key.split('_').pop();
          entries.push({ userId, level: data.level || 0, xp: data.xp || 0, totalXp: data.totalXp || 0 });
        }
      }
    } catch {}
    entries.sort((a,b)=> b.level !== a.level ? b.level - a.level : b.xp - a.xp);
    const top = entries.slice(0,10);
    if (!top.length) {
      const empty = builders.buildInfoContainer({ title: 'Leaderboard', description: 'No data yet. Chat to earn XP!', emoji: builders.emojis.leaderboard });
      return interaction.editReply({ components: [empty], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    }
    const lines = await Promise.all(top.map(async (e,i)=>{
      const user = await client.users.fetch(e.userId).catch(()=>({ tag: `Unknown#0000`, id: e.userId }));
      const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`;
      return `${medal} **${user.tag}** — Level \`${e.level}\` • XP \`${e.xp}\` (\`${e.totalXp} total\`)`;
    }));
    const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.leaderboard} Level Leaderboard • ${interaction.guild.name}`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
