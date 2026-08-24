// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ChannelType,
  AttachmentBuilder
} = require('discord.js');
const db = require('../utils/db');
const builders = require('../utils/builders');
let createCanvas, loadImage;
try { ({ createCanvas, loadImage } = require('canvas')); } catch { createCanvas = null; loadImage = null; }

async function createWelcomeCanvas(member) {
  try {
    const canvas = createCanvas(800, 220);
    const ctx = canvas.getContext('2d');

    // Background gradient TechRoad style
    const grad = ctx.createLinearGradient(0, 0, 800, 220);
    grad.addColorStop(0, '#0f0f12');
    grad.addColorStop(0.5, '#1e1f22');
    grad.addColorStop(1, '#2b2d31');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 220);

    // Accent bar
    ctx.fillStyle = '#2f3136'; // temporary
    // use brand color
    const brand = builders.BRAND_COLOR;
    ctx.fillStyle = `#${brand.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, 800, 6);

    // Avatar circle
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
    try {
      const avatar = await loadImage(avatarURL);
      ctx.save();
      ctx.beginPath();
      ctx.arc(110, 110, 70, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 40, 40, 140, 140);
      ctx.restore();
      // border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(110, 110, 70, 0, Math.PI * 2);
      ctx.stroke();
    } catch {}

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Sans';
    ctx.fillText(`Welcome ${member.user.username}`, 210, 70);
    ctx.font = '16px Sans';
    ctx.fillStyle = '#b5bac1';
    ctx.fillText(`You are the ${member.guild.memberCount}th member of`, 210, 105);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Sans';
    ctx.fillText(member.guild.name, 210, 135);
    ctx.font = '12px Sans';
    ctx.fillStyle = '#949ba4';
    ctx.fillText(`${builders.BRAND_FOOTER}`, 210, 175);

    return canvas.toBuffer('image/png');
  } catch (e) {
    return null;
  }
}

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const guildId = member.guild.id;

    // === AUTOROLE humans/bots ===
    try {
      const autoroleCfg = db.get(guildId, 'autorole');
      if (autoroleCfg) {
        const isBot = member.user.bot;
        const rolesToAdd = [];
        if (isBot && autoroleCfg.bots && autoroleCfg.bots.length) {
          for (const rId of autoroleCfg.bots) {
            const r = member.guild.roles.cache.get(rId);
            if (r && !member.roles.cache.has(rId) && r.editable) rolesToAdd.push(rId);
          }
        } else if (!isBot && autoroleCfg.humans && autoroleCfg.humans.length) {
          for (const rId of autoroleCfg.humans) {
            const r = member.guild.roles.cache.get(rId);
            if (r && !member.roles.cache.has(rId) && r.editable) rolesToAdd.push(rId);
          }
        }
        if (rolesToAdd.length) await member.roles.add(rolesToAdd).catch(()=>{});
      }
    } catch {}

    // === WELCOME ===
    try {
      const welcomeCfg = db.get(guildId, 'welcome');
      if (!welcomeCfg || !welcomeCfg.channelId) return;
      const channel = member.guild.channels.cache.get(welcomeCfg.channelId) || await member.guild.channels.fetch(welcomeCfg.channelId).catch(()=>null);
      if (!channel || !channel.isTextBased()) return;

      // Check if welcome enabled
      if (welcomeCfg.enabled === false) return;

      const welcomeText = welcomeCfg.message
        ? welcomeCfg.message.replace(/{user}/g, `${member}`).replace(/{username}/g, member.user.username).replace(/{server}/g, member.guild.name).replace(/{count}/g, String(member.guild.memberCount))
        : `Welcome ${member} to **${member.guild.name}**! You are member #${member.guild.memberCount}.`;

      const canvasBuffer = await createWelcomeCanvas(member);
      const container = new ContainerBuilder().setAccentColor(builders.BRAND_COLOR)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${builders.emojis.welcome} Welcome!\n${welcomeText}`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**User:** ${member.user.tag} (\`${member.id}\`)\n**Account Created:** <t:${Math.floor(member.user.createdTimestamp/1000)}:R>\n-# ${builders.BRAND_FOOTER}`));

      if (canvasBuffer) {
        const attachment = new AttachmentBuilder(canvasBuffer, { name: 'welcome.png' });
        // Use MediaGallery for image
        const { MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
        const gallery = new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://welcome.png').setDescription('Welcome'));
        container.addMediaGalleryComponents(gallery);
        await channel.send({ components: [container], files: [attachment], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      } else {
        await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(()=>{});
      }
    } catch (e) {
      console.error('[WELCOME ERROR]', e.message);
    }
  }
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
