// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, AttachmentBuilder } = require('discord.js');
const builders = require('../../utils/builders');
const db = require('../../utils/db');
let createCanvas, loadImage;
try { ({ createCanvas, loadImage } = require('canvas')); } catch { createCanvas = null; loadImage = null; }

async function createRankCanvas(user, data, guild) {
  if (!createCanvas) return null;
  const canvas = createCanvas(800, 220);
  const ctx = canvas.getContext('2d');
  const brand = builders.BRAND_COLOR;
  const hex = `#${brand.toString(16).padStart(6, '0')}`;
  const grad = ctx.createLinearGradient(0,0,800,220);
  grad.addColorStop(0,'#0f0f12');
  grad.addColorStop(1,'#1e1f22');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,800,220);
  ctx.fillStyle = hex;
  ctx.fillRect(0,0,800,6);
  // avatar
  try {
    const url = user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
    const img = await loadImage(url);
    ctx.save();
    ctx.beginPath();
    ctx.arc(110,110,70,0,Math.PI*2);
    ctx.clip();
    ctx.drawImage(img,40,40,140,140);
    ctx.restore();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(110,110,70,0,Math.PI*2);
    ctx.stroke();
  } catch {}
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Sans';
  ctx.fillText(user.username, 210, 60);
  ctx.font = '14px Sans';
  ctx.fillStyle = '#b5bac1';
  ctx.fillText(`Level ${data.level} • ${data.xp}/${(data.level+1)*300} XP`, 210, 85);
  // progress bar
  const needed = (data.level+1)*300;
  const prog = data.xp/needed;
  ctx.fillStyle = '#2b2d31';
  ctx.fillRect(210, 105, 520, 18);
  ctx.fillStyle = hex;
  ctx.fillRect(210,105,520*prog,18);
  ctx.fillStyle = '#949ba4';
  ctx.font = '12px Sans';
  ctx.fillText(`${guild.name} • ${builders.BRAND_FOOTER}`,210,175);
  return canvas.toBuffer('image/png');
}

module.exports = {
  data: new SlashCommandBuilder().setName('rank').setDescription('Show rank card')
    .addUserOption(o=> o.setName('user').setDescription('User').setRequired(false)),
  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
    const user = interaction.options.getUser('user') || interaction.user;
    const key = `level_${interaction.guild.id}_${user.id}`;
    const data = db.get(key) || { xp: 0, level: 0, totalXp: 0 };
    const buffer = await createRankCanvas(user, data, interaction.guild);
    let files = [];
    let gallery = null;
    if (buffer) {
      const attachment = new AttachmentBuilder(buffer, { name: 'rank.png' });
      files = [attachment];
      const { MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
      gallery = new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://rank.png').setDescription('Rank'));
    }
    const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR);
    if (gallery) container.addMediaGalleryComponents(gallery);
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.level} Rank • ${user.tag}`))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Level:** \`${data.level}\` • **XP:** \`${data.xp}/${(data.level+1)*300}\``))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${builders.BRAND_FOOTER}`));
    await interaction.editReply({ components: [container], files, flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
