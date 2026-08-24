// Generates Discord-style SVG screenshots for README (run once: node scripts/gen-assets.js)
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const OUT = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const C = {
  bg: '#313338', card: '#26272b', cardBorder: '#1e1f22', accent: '#2f3136',
  text: '#dbdee1', head: '#f2f3f5', muted: '#949ba4',
  code: '#1e1f22', chip: '#1e1f22', chipText: '#b5bac1',
  green: '#248046', red: '#da373c', blurple: '#5865f2', grey: '#4e5058',
  amber: '#faa61a', sep: '#3f4147'
};
const FONT = `'Segoe UI','Helvetica Neue',Arial,sans-serif`;
const MONO = `Consolas,'Courier New',monospace`;

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// one Discord message: avatar + name + APP + time, then a V2 container card
function message({ accent = C.accent, body, bodyH, w = 640, time = 'Today at 11:02 PM' }) {
  return `
  <circle cx="30" cy="26" r="18" fill="url(#av)"/>
  <text x="30" y="31" text-anchor="middle" font-family=${JSON.stringify(FONT)} font-size="13" font-weight="700" fill="#fff">TR</text>
  <text x="56" y="22" font-family=${JSON.stringify(FONT)} font-size="15" font-weight="600" fill="${C.head}">TechRoad All-in-One</text>
  <rect x="204" y="10" width="34" height="16" rx="4" fill="${C.blurple}"/>
  <text x="221" y="22" text-anchor="middle" font-family=${JSON.stringify(FONT)} font-size="10" font-weight="700" fill="#fff">APP</text>
  <text x="246" y="22" font-family=${JSON.stringify(FONT)} font-size="12" fill="${C.muted}">${esc(time)}</text>
  <rect x="12" y="42" width="${w - 24}" height="${bodyH}" rx="8" fill="${C.card}" stroke="${C.cardBorder}"/>
  <rect x="12" y="42" width="4" height="${bodyH}" rx="2" fill="${accent}"/>
  ${body}`;
}

function chip(x, y, label) {
  const w = label.length * 6.7 + 14;
  return { w, svg: `<rect x="${x}" y="${y}" width="${w}" height="20" rx="4" fill="${C.chip}"/><text x="${x + 7}" y="${y + 14}" font-family=${JSON.stringify(MONO)} font-size="11.5" fill="${C.chipText}">${esc(label)}</text>` };
}

function chipRow(x, y, labels, maxW) {
  let out = '', cx = x;
  for (const l of labels) {
    const c = chip(cx, y, l);
    if (cx + c.w > x + maxW) { cx = x; y += 26; out += chipRow(x, y, [l], maxW).svg; continue; }
    out += c.svg; cx += c.w + 6;
  }
  return { y, svg: out };
}

function header(y, txt) {
  return `<text x="28" y="${y}" font-family=${JSON.stringify(FONT)} font-size="17" font-weight="700" fill="${C.head}">${esc(txt)}</text>`;
}
function para(y, txt, size = 13.5, fill = C.text) {
  return `<text x="28" y="${y}" font-family=${JSON.stringify(FONT)} font-size="${size}" fill="${fill}">${esc(txt)}</text>`;
}
function sep(y) { return `<rect x="28" y="${y}" width="584" height="1" fill="${C.sep}"/>`; }
function btn(x, y, label, color, textColor = '#fff', w) {
  const bw = w || (label.length * 7 + 30);
  return `<rect x="${x}" y="${y}" width="${bw}" height="30" rx="6" fill="${color}"/><text x="${x + bw / 2}" y="${y + 19}" text-anchor="middle" font-family=${JSON.stringify(FONT)} font-size="13" font-weight="600" fill="${textColor}">${esc(label)}</text>`;
}

function wrap(name, inner, h) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="${h}" viewBox="0 0 640 ${h}">
  <defs><linearGradient id="av" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.blurple}"/><stop offset="1" stop-color="#2f3136"/></linearGradient></defs>
  <rect width="640" height="${h}" fill="${C.bg}"/>
  <rect x="0" y="0" width="640" height="24" fill="#2b2d31"/>
  <circle cx="18" cy="12" r="5" fill="#23a55a"/>
  <text x="34" y="16" font-family=${JSON.stringify(FONT)} font-size="12" font-weight="600" fill="${C.muted}">#techroad</text>
  ${inner}
</svg>`;
  fs.writeFileSync(path.join(OUT, name), svg);
  console.log('wrote', name, h + 'px');
}

// ---------- 1. help ----------
{
  const cats = [
    ['Info', ['help', 'ping', 'guide', 'serverinfo', 'userinfo', 'avatar', 'banner', 'invite', 'stats', 'uptime']],
    ['Utility', ['embed', 'say', 'come', 'poll', 'announce', 'afk', 'status', 'broadcast']],
    ['Moderation', ['ban', 'unban', 'kick', 'timeout', 'untimeout', 'warn', 'warnings', 'clearwarn', 'clear', 'slowmode', 'lock', 'unlock', 'hide', 'unhide', 'hideall', 'unhideall', 'lockall', 'unlockall', 'deleteall', 'role', 'rrole', 'nickname']],
    ['Server Setup', ['welcome', 'autorole', 'autoline', 'verify', 'feedback', 'suggestions', 'logging', 'selfroles']],
    ['Leveling', ['level', 'rank', 'leaderboard']],
    ['Economy (optional)', ['daily', 'balance', 'economy toggle']],
    ['Extras', ['ticket', 'giveaway']]
  ];
  let y = 78;
  let body = header(y, 'TechRoad — Command List'); y += 24;
  body += para(y, 'Slash commands and #prefix both work. Manage Server permission is required for setup commands.', 12.5, C.muted); y += 22;
  body += sep(y); y += 18;
  for (const [name, cmds] of cats) {
    body += `<text x="28" y="${y}" font-family=${JSON.stringify(FONT)} font-size="13.5" font-weight="700" fill="${C.head}">${esc(name)}</text>`;
    y += 8;
    const row = chipRow(28, y, cmds, 584);
    body += row.svg;
    y = row.y + 34;
  }
  body += sep(y - 12); y += 6;
  body += para(y, 'TechRoad • All Rights Reserved', 11.5, C.muted); y += 22;
  const h = y + 50;
  wrap('help.svg', message({ body, bodyH: h - 42 - 12, w: 640, time: 'Today at 10:31 PM' }), h);
}

// ---------- 2. feedback ----------
{
  let y = 84;
  let body = header(y, 'Feedback'); y += 26;
  body += para(y, 'Great server! The events and giveaways are amazing.'); y += 20;
  body += `<circle cx="584" cy="86" r="22" fill="url(#av)" stroke="${C.cardBorder}"/>`;
  body += sep(y); y += 22;
  body += `<text x="28" y="${y}" font-family=${JSON.stringify(FONT)} font-size="13.5" fill="${C.text}"><tspan font-weight="700">har0r</tspan> • general</text>`; y += 24;
  body += para(y, 'TechRoad • All Rights Reserved', 11.5, C.muted); y += 20;
  const h = y + 50;
  wrap('feedback.svg', message({ body, bodyH: h - 42 - 12, time: 'Today at 11:01 PM' }), h);
}

// ---------- 3. suggestion ----------
{
  let y = 84;
  let body = header(y, 'New Suggestion'); y += 26;
  body += para(y, 'Add a music channel where the bot posts new songs every day.'); y += 22;
  body += sep(y); y += 22;
  body += `<text x="28" y="${y}" font-family=${JSON.stringify(FONT)} font-size="13.5" fill="${C.text}"><tspan font-weight="700">From:</tspan> nova_dev • <tspan font-weight="700">Status:</tspan> Pending</text>`; y += 18;
  body += para(y, 'TechRoad • All Rights Reserved', 11.5, C.muted); y += 16;
  body += btn(28, y, 'Accept', C.green) + btn(96, y, 'Reject', C.red); y += 46;
  const h = y + 50;
  wrap('suggestion.svg', message({ body, bodyH: h - 42 - 12, time: 'Today at 9:47 PM' }), h);
}

// ---------- 4. broadcast ----------
{
  let y = 84;
  let body = header(y, 'Confirm Broadcast'); y += 26;
  body += `<text x="28" y="${y}" font-family=${JSON.stringify(FONT)} font-size="13.5" fill="${C.text}"><tspan font-weight="700">Target:</tspan> all members   <tspan font-weight="700">Will DM:</tspan> 128 members</text>`; y += 26;
  body += para(y, 'Message:', 12.5, C.muted); y += 20;
  body += `<rect x="28" y="${y - 14}" width="584" height="44" rx="4" fill="${C.code}"/><text x="38" y="${y + 4}" font-family=${JSON.stringify(FONT)} font-size="13" fill="${C.text}">Join our big event this Friday at 8 PM!</text><text x="38" y="${y + 22}" font-family=${JSON.stringify(FONT)} font-size="13" fill="${C.text}">Special roles for early members.</text>`; y += 52;
  body += sep(y); y += 10;
  body += para(y, 'Sending takes ~1.2s per member. You have 5 minutes to confirm.', 11.5, C.muted); y += 20;
  body += btn(28, y, 'Send to 128 members', C.red) + btn(196, y, 'Cancel', C.grey); y += 46;
  const h = y + 50;
  wrap('broadcast.svg', message({ accent: C.amber, body, bodyH: h - 42 - 12, time: 'Today at 8:12 PM' }), h);
}

// ---------- 5. ticket panel ----------
{
  let y = 84;
  let body = header(y, 'TechRoad Tickets'); y += 26;
  body += para(y, 'Need help or want to report someone? Open a ticket and the support team will join you as fast as possible.'); y += 20;
  body += sep(y); y += 18;
  body += para(y, 'TechRoad • All Rights Reserved • Pick a category below', 11.5, C.muted); y += 16;
  body += btn(28, y, 'Report', C.red) + btn(104, y, 'Support', C.blurple) + btn(196, y, 'General', C.grey) + btn(284, y, 'Partnership', C.green); y += 46;
  const h = y + 50;
  wrap('ticket.svg', message({ body, bodyH: h - 42 - 12, time: 'Today at 7:55 PM' }), h);
}

// ---------- 6. logging ----------
{
  let y = 84;
  let body = header(y, 'Message Deleted'); y += 26;
  body += para(y, 'Message by har0r deleted in #general'); y += 24;
  body += `<text x="28" y="${y}" font-family=${JSON.stringify(FONT)} font-size="12.5" font-weight="700" fill="${C.head}">Author</text>`; y += 17;
  body += `<rect x="28" y="${y - 13}" width="150" height="20" rx="3" fill="${C.code}"/><text x="36" y="${y + 1}" font-family=${JSON.stringify(MONO)} font-size="12" fill="${C.chipText}">har0r • 1508137...</text>`; y += 30;
  body += `<text x="28" y="${y}" font-family=${JSON.stringify(FONT)} font-size="12.5" font-weight="700" fill="${C.head}">Content</text>`; y += 17;
  body += `<rect x="28" y="${y - 13}" width="584" height="22" rx="3" fill="${C.code}"/><text x="36" y="${y + 1}" font-family=${JSON.stringify(MONO)} font-size="12" fill="${C.chipText}">can someone help me with tickets?</text>`; y += 32;
  body += `<text x="28" y="${y}" font-family=${JSON.stringify(FONT)} font-size="12.5" fill="${C.text}"><tspan font-weight="700" fill="${C.head}">Audit Log</tspan>  Deleted by har0r (self-delete)</text>`; y += 20;
  body += para(y, 'TechRoad • All Rights Reserved • Monday, 24 August 2026', 11.5, C.muted); y += 20;
  const h = y + 50;
  wrap('logging.svg', message({ accent: '#ed4245', body, bodyH: h - 42 - 12, time: 'Today at 11:02 PM' }), h);
}

// ---------- 7. come DM ----------
{
  let y = 84;
  let body = header(y, 'You have been summoned'); y += 26;
  body += `<text x="28" y="${y}" font-family=${JSON.stringify(FONT)} font-size="13.5" fill="${C.text}"><tspan font-weight="700">Room:</tspan> Lounge VC in <tspan font-weight="700">TechRoad</tspan>   <tspan font-weight="700">By:</tspan> har0r</text>`; y += 22;
  body += `<text x="28" y="${y}" font-family=${JSON.stringify(FONT)} font-size="13.5" fill="${C.text}"><tspan font-weight="700">Reason:</tspan> Event is starting, we need you here</text>`; y += 18;
  body += sep(y); y += 16;
  body += btn(28, y, 'Open Lounge VC', C.grey); y += 46;
  const h = y + 50;
  wrap('come.svg', message({ body, bodyH: h - 42 - 12, time: 'Today at 6:40 PM' }), h);
}

console.log('done');
