// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags
} = require('discord.js');

const config = require('../config.json');
const emojis = require('../emojis.json');

const BRAND = config.branding || {};
const BRAND_NAME = BRAND.botName || 'TechRoad';
const BRAND_COLOR = BRAND.color || 3092790; // #2F3136 ~ TechRoad
const BRAND_FOOTER = BRAND.footer || 'TechRoad • All Rights Reserved';
const BRAND_ICON = BRAND.icon || null;

function createContainer(options = {}) {
  const accent = options.color ?? options.accentColor ?? BRAND_COLOR;
  return new ContainerBuilder().setAccentColor(accent);
}

function text(content) {
  return new TextDisplayBuilder().setContent(content);
}

function separator(spacing = SeparatorSpacingSize.Small, divider = true) {
  return new SeparatorBuilder().setSpacing(spacing).setDivider(divider);
}

function sectionWithThumbnail(textContent, thumbnailUrl, description) {
  const section = new SectionBuilder();
  const txt = new TextDisplayBuilder().setContent(textContent);
  section.addTextDisplayComponents(txt);
  if (thumbnailUrl) {
    const thumb = new ThumbnailBuilder().setURL(thumbnailUrl).setDescription(description || 'thumbnail');
    section.setThumbnailAccessory(thumb);
  }
  return section;
}

function brandedHeader(title, emoji) {
  const e = emoji ? `${emoji} ` : '';
  return `## ${e}${title}`;
}

function brandedFooter(extra) {
  if (extra) return `-# ${BRAND_FOOTER} • ${extra}`;
  return `-# ${BRAND_FOOTER}`;
}

function buildInfoContainer({ title, description, emoji, color, thumbnail, fields, footerExtra }) {
  const container = createContainer({ color });
  if (title) container.addTextDisplayComponents(text(brandedHeader(title, emoji)));
  if (description) container.addTextDisplayComponents(text(description));
  if (fields && fields.length) {
    container.addSeparatorComponents(separator(SeparatorSpacingSize.Small, true));
    const lines = fields.map(f => {
      const name = f.name || f.title || 'Field';
      const value = f.value || f.desc || '';
      return `**${name}:** ${value}`;
    });
    container.addTextDisplayComponents(text(lines.join('\n\n')));
  }
  if (thumbnail) {
    // add section fallback if needed - but we already added text, so add thumbnail section
  }
  container.addSeparatorComponents(separator(SeparatorSpacingSize.Small, true));
  container.addTextDisplayComponents(text(brandedFooter(footerExtra)));
  return container;
}

function cleanError(msg) {
  let s = String(msg || 'Unknown error');
  s = s.split('Require stack:')[0].trim();
  s = s.replace(/(\/(?:home|usr|root|var|tmp|opt|etc)\/[^\s`"']*)/g, 'host files');
  s = s.replace(/Cannot find module '@discordjs\/opus'|Cannot find module 'opusscript'/i, 'Audio encoder missing — run npm install on the host');
  return s;
}

function buildErrorContainer(title, description, footerExtra) {
  return buildInfoContainer({
    title: title || 'Error',
    description: cleanError(description) || 'Something went wrong.',
    emoji: emojis.error,
    color: 0xED4245,
    footerExtra
  });
}

function buildSuccessContainer(title, description, footerExtra) {
  return buildInfoContainer({
    title: title || 'Success',
    description: description || 'Action completed successfully.',
    emoji: emojis.success,
    color: 0x57F287,
    footerExtra
  });
}

function buildWarningContainer(title, description, footerExtra) {
  return buildInfoContainer({
    title: title || 'Warning',
    description: description || 'Please check your input.',
    emoji: emojis.warning,
    color: 0xFEE75C,
    footerExtra
  });
}

function replyFlags(ephemeral = false) {
  let flags = MessageFlags.IsComponentsV2;
  if (ephemeral) flags |= MessageFlags.Ephemeral;
  return flags;
}

function toV2Reply(containerOrArray, ephemeral = false) {
  const components = Array.isArray(containerOrArray) ? containerOrArray : [containerOrArray];
  return {
    components,
    flags: replyFlags(ephemeral)
  };
}

function toV2Update(containerOrArray) {
  const components = Array.isArray(containerOrArray) ? containerOrArray : [containerOrArray];
  return {
    components,
    flags: MessageFlags.IsComponentsV2
  };
}

// TechRoad-style helpers
function brandContainer({ title, emoji, description, color, fields, image, thumbnail }) {
  const container = createContainer({ color });
  if (title) container.addTextDisplayComponents(text(`# ${emoji ? emoji + ' ' : ''}${title}`));
  if (description) container.addTextDisplayComponents(text(description));
  if (fields && fields.length) {
    container.addSeparatorComponents(separator());
    for (const f of fields) {
      container.addTextDisplayComponents(text(`**${f.name}**\n${f.value}`));
    }
  }
  if (image) {
    const gallery = new MediaGalleryBuilder().addItems(
      new MediaGalleryItemBuilder().setURL(image).setDescription(title || 'image')
    );
    container.addMediaGalleryComponents(gallery);
  }
  container.addSeparatorComponents(separator());
  container.addTextDisplayComponents(text(brandedFooter()));
  return container;
}

module.exports = {
  BRAND_NAME,
  BRAND_COLOR,
  BRAND_FOOTER,
  BRAND_ICON,
  emojis,
  config,
  createContainer,
  text,
  separator,
  SeparatorSpacingSize,
  sectionWithThumbnail,
  brandedHeader,
  brandedFooter,
  buildInfoContainer,
  buildErrorContainer,
  cleanError,
  buildSuccessContainer,
  buildWarningContainer,
  replyFlags,
  toV2Reply,
  toV2Update,
  brandContainer
};

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
