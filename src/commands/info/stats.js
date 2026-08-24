// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, version } = require('discord.js');
const builders = require('../../utils/builders');
const os = require('node:os');

module.exports = {
  data: new SlashCommandBuilder().setName('stats').setDescription('Show bot statistics'),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const totalMembers = client.guilds.cache.reduce((a,g)=>a+g.memberCount, 0);
    const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const cpu = os.cpus()[0]?.model || 'Unknown';
    const uptime = Math.floor(process.uptime());
    const djsVer = version;
    const nodeVer = process.version;
    const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.stats} TechRoad Stats`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Guilds:** \`${client.guilds.cache.size}\` • **Users:** \`${totalMembers}\` • **Channels:** \`${client.channels.cache.size}\`\n**Commands:** \`${client.commands.size}\` • **Ping:** \`${Math.round(client.ws.ping)}ms\``))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Uptime:** <t:${Math.floor((Date.now() - client.uptime)/1000)}:R> (\`${Math.floor(client.uptime/1000)}s\`)\n**Memory:** \`${memUsage} MB\` • **CPU:** \`${cpu.slice(0,50)}\``))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Versions:** discord.js \`${djsVer}\` • Node \`${nodeVer}\` • OS \`${os.type()} ${os.release()}\``))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
