// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const builders = require('../../utils/builders');

module.exports = {
  data: new SlashCommandBuilder().setName('poll').setDescription('Create a poll')
    .addStringOption(o => o.setName('question').setDescription('Poll question').setRequired(true))
    .addStringOption(o => o.setName('option1').setDescription('Option 1').setRequired(true))
    .addStringOption(o => o.setName('option2').setDescription('Option 2').setRequired(true))
    .addStringOption(o => o.setName('option3').setDescription('Option 3').setRequired(false))
    .addStringOption(o => o.setName('option4').setDescription('Option 4').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const question = interaction.options.getString('question', true);
    const options = [1,2,3,4].map(i=> interaction.options.getString(`option${i}`)).filter(Boolean);
    const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.poll} Poll\n**${question}**`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(options.map((o,i)=> `**${i+1}.** ${o} — \`0 votes\``).join('\n')))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Poll by ${interaction.user} • -# ${builders.BRAND_FOOTER}`));
    const row = new ActionRowBuilder();
    const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣'];
    options.forEach((opt,i)=>{
      row.addComponents(new ButtonBuilder().setCustomId(`poll_vote:${interaction.id}:${i}`).setLabel(opt.slice(0,80)).setStyle(ButtonStyle.Secondary).setEmoji(emojis[i]));
    });
    const msg = await interaction.editReply({ components: [container, row], flags: MessageFlags.IsComponentsV2 }).catch(()=>null);
    // Store poll data in db for votes
    const db = require('../../utils/db');
    db.set(`poll_${interaction.guild.id}_${interaction.id}`, { question, options, votes: {}, messageId: msg?.id || null, channelId: interaction.channel.id, author: interaction.user.id });
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
