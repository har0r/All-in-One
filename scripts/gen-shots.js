// Regenerates the README screenshots in assets/ (real Chrome render of a Discord replica).
// Requires puppeteer + chrome-headless-shell (kept out of package.json on purpose):
//   npm i puppeteer && npx puppeteer browsers install chrome-headless-shell@stable
// Then set EXEC below to the printed chrome-headless-shell path and run: node scripts/gen-shots.js
'use strict';
const puppeteer = require('puppeteer');
const fs = require('node:fs');
const path = require('node:path');

const OUT = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const EXEC = process.env.CHROME_PATH || '';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const code = s => `<code>${esc(s)}</code>`;

// Discord default bot avatar (the blurple mark)
const DISCORD_MARK = `<svg viewBox="0 0 127.14 96.36" width="26" height="20" fill="#fff"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/></svg>`;

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{background:#313338;font-family:'gg sans','Noto Sans','Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.header{height:48px;display:flex;align-items:center;gap:8px;padding:0 16px;border-bottom:1px solid #26272b}
.header .hash{color:#80848e;font-size:20px}
.header .ch{color:#f2f3f5;font-size:15px;font-weight:600}
.chat{padding:14px 16px 18px}
.reply{display:flex;align-items:center;gap:6px;margin:0 0 4px 56px;color:#b5bac1;font-size:13px}
.reply .ra{width:16px;height:16px;border-radius:50%;flex-shrink:0}
.reply .rname{color:#dbdee1;font-weight:600}
.reply .rsnip{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:340px}
.reply svg{flex-shrink:0}
.msg{display:flex;gap:16px}
.msg + .msg{margin-top:14px}
.avatar{width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.avatar.bot{background:#5865f2}
.avatar.user{background:#3b3d43;color:#dbdee1;font-size:16px;font-weight:700}
.content{flex:1;min-width:0}
.namerow{display:flex;align-items:baseline;gap:6px;margin-bottom:2px}
.name{color:#f2f3f5;font-size:16px;font-weight:500}
.app{background:#5865f2;color:#fff;font-size:10px;font-weight:800;letter-spacing:.4px;padding:1px 4.4px;border-radius:3px;position:relative;top:-1px}
.time{color:#949ba4;font-size:12px;font-weight:500;margin-left:2px}
.umsg{color:#dbdee1;font-size:16px;line-height:1.375rem}
.umsg code{background:#2b2d31;padding:1.5px 5px;border-radius:4px;font-family:Consolas,monospace;font-size:13px}
.v2{margin-top:2px;background:#26272b;border:1px solid #1e1f22;border-left:4px solid var(--accent,#2f3136);border-radius:8px;padding:12px 16px;display:flex;flex-direction:column;gap:8px;max-width:600px}
.v2 .sep{height:1px;background:#3a3c42;margin:2px 0}
.v2 h2{color:#f2f3f5;font-size:18px;font-weight:700;line-height:1.3}
.v2 p{color:#dbdee1;font-size:15px;line-height:1.45}
.v2 .small{color:#949ba4;font-size:12px}
.v2 b{color:#f2f3f5;font-weight:600}
.v2 code{background:#2b2d31;color:#dbdee1;font-family:Consolas,'Andale Mono',monospace;font-size:12.5px;padding:1px 5px;border-radius:4px}
.v2 .block{background:#2b2d31;border:1px solid #1e1f22;border-radius:4px;padding:8px 12px;color:#dbdee1;font-size:15px;line-height:1.5}
.v2 .field-label{color:#f2f3f5;font-size:13px;font-weight:700;margin-bottom:4px}
.v2 .quote{border-left:4px solid #4e5058;padding-left:12px;color:#dbdee1;font-size:15px;line-height:1.45}
.section{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
.section .txt{flex:1}
.thumb{width:72px;height:72px;border-radius:8px;flex-shrink:0;background:linear-gradient(135deg,#5865f2,#2f3136);display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:800}
.btnrow{display:flex;gap:8px;margin-top:2px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;justify-content:center;height:32px;padding:2px 16px;border-radius:8px;font-size:14px;font-weight:600;color:#fff;white-space:nowrap}
.b-secondary{background:#4e5058}.b-danger{background:#da373c}.b-success{background:#248046}.b-primary{background:#5865f2}
`;

const ARROW = `<svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M5 1C5 1 4.5 5 1 5M1 5L4 2.5M1 5L4 7.5" stroke="#6d6f78" stroke-width="1.4" stroke-linecap="round"/></svg>`;

function shot({ header = 'techroad', user = { name: 'Harium', initials: 'H', color: '#5b4a9e' }, userMsg, replyTo, body: botBody, botTime, userTime = 'Yesterday at 10:30 PM', accent, dm }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
  <div class="header"><span class="hash">${dm ? '@' : '#'}</span><span class="ch">${esc(header)}</span></div>
  <div class="chat">
    ${userMsg ? `<div class="reply">${ARROW}<div class="ra" style="background:${user.color};display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:700">${esc(user.initials)}</div><span class="rname">${esc(user.name)}</span><span class="rsnip">${replyTo}</span></div>
    <div class="msg">
      <div class="avatar user" style="background:${user.color}">${esc(user.initials)}</div>
      <div class="content">
        <div class="namerow"><span class="name">${esc(user.name)}</span><span class="time">${esc(userTime)}</span></div>
        <div class="umsg">${userMsg}</div>
      </div>
    </div>` : ''}
    <div class="msg" style="${userMsg ? 'margin-top:12px' : ''}">
      <div class="avatar bot">${DISCORD_MARK}</div>
      <div class="content">
        <div class="namerow"><span class="name">TechRoad All-in-One</span><span class="app">APP</span><span class="time">${esc(botTime)}</span></div>
        <div class="v2" style="--accent:${accent}">${botBody}</div>
      </div>
    </div>
  </div>
</body></html>`;
}

const shots = {};

// ---------- help (user used #help) ----------
{
  const body = `
  <h2>❓ TechRoad Help • All-in-One</h2>
  <p>Welcome to <b>TechRoad</b>! Prefix ${code('#help')} or use slash commands.</p>
  <div class="sep"></div>
  <p><b>ℹ️ Info (10):</b><br>${code('help, ping, guide, serverinfo, userinfo, avatar, banner, invite, stats, uptime')}</p>
  <p><b>🛠️ Utility (8):</b><br>${code('embed, say, come, poll, announce, afk, status, broadcast')}</p>
  <p><b>🔨 Moderation (22):</b><br>${code('ban, unban, kick, timeout, untimeout, warn, warnings, clearwarn, clear, slowmode, lock, unlock, hide, unhide, hideall, unhideall, lockall, unlockall, deleteall, role, rrole, nickname')}</p>
  <p><b>👋 System (8):</b><br>${code('welcome, autorole, autoline, verify, feedback, suggestions, logging, selfroles')}</p>
  <p><b>🛡️ Protection:</b> ${code('protect')} — anti-spam, anti-link, anti-invite, honeypot</p>
  <p><b>📈 Leveling:</b> ${code('level, rank, leaderboard')}</p>
  <p><b>💰 Economy:</b> ${code('daily, balance, economy')} • <b>🎫 Tickets:</b> ${code('ticket')} • <b>🎉 Giveaway:</b> ${code('giveaway')}</p>
  <div class="sep"></div>
  <div class="small">TechRoad • All Rights Reserved • Prefix: # • Support: TechRoad</div>`;
  shots['help'] = shot({ userMsg: `used ${code('#help')}`, replyTo: `used ${code('#help')}`, botTime: 'Yesterday at 10:30 PM', accent: '#2f3136', body });
}

// ---------- feedback ----------
{
  const body = `
  <div class="section">
    <div class="txt">
      <h2>💬 Feedback</h2>
      <p>Great server! The events and giveaways are amazing.</p>
    </div>
    <div class="thumb">h</div>
  </div>
  <div class="sep"></div>
  <p><b>har0r</b> • general</p>
  <div class="small">TechRoad • All Rights Reserved</div>`;
  shots['feedback'] = shot({ user: { name: 'har0r', initials: 'h', color: '#7a3b8f' }, userMsg: 'Great server! The events and giveaways are amazing.', replyTo: 'Great server! The events…', botTime: 'Yesterday at 11:01 PM', accent: '#2f3136', body });
}

// ---------- suggestion ----------
{
  const body = `
  <h2>💡 New Suggestion</h2>
  <p>Add a clips channel where we can share gameplay moments.</p>
  <div class="sep"></div>
  <p><b>From:</b> nova_dev • <b>Status:</b> Pending</p>
  <div class="small">TechRoad • All Rights Reserved</div>
  <div class="btnrow"><span class="btn b-success">✅ Accept</span><span class="btn b-danger">❌ Reject</span></div>`;
  shots['suggestion'] = shot({ user: { name: 'nova_dev', initials: 'n', color: '#2d7d5a' }, userMsg: 'Add a clips channel where we can share gameplay moments.', replyTo: 'Add a clips channel…', botTime: 'Yesterday at 9:47 PM', userTime: 'Yesterday at 9:45 PM', accent: '#2f3136', body });
}

// ---------- broadcast ----------
{
  const body = `
  <h2>⚠️ Confirm Broadcast</h2>
  <p><b>Target:</b> all members &nbsp;•&nbsp; <b>Will DM:</b> ${code('128')} members</p>
  <div class="small">Message:</div>
  <div class="quote">Join our big event this Friday at 8 PM!<br>Special roles for early members.</div>
  <div class="small">Sending takes ~1.2s per member. You have 5 minutes to confirm.</div>
  <div class="btnrow"><span class="btn b-danger">Send to 128 members</span><span class="btn b-secondary">Cancel</span></div>`;
  shots['broadcast'] = shot({ user: { name: 'Harium', initials: 'H', color: '#5b4a9e' }, userMsg: `used ${code('/broadcast')}`, replyTo: `used ${code('/broadcast')}`, botTime: 'Yesterday at 8:12 PM', userTime: 'Yesterday at 8:11 PM', accent: '#faa61a', body });
}

// ---------- ticket panel ----------
{
  const body = `
  <h2>🎫 TechRoad Tickets</h2>
  <p>Need help or want to report someone? Open a ticket and the support team will join you as fast as possible.</p>
  <p><b>Categories:</b> Report 🔴 • Support 🛠️ • General 💬 • Partnership 🤝</p>
  <div class="sep"></div>
  <div class="small">TechRoad • All Rights Reserved • Select a category</div>
  <div class="btnrow"><span class="btn b-danger">🚨 Report</span><span class="btn b-primary">🛠️ Support</span><span class="btn b-secondary">💬 General</span><span class="btn b-success">🤝 Partnership</span></div>`;
  shots['ticket'] = shot({ user: { name: 'Harium', initials: 'H', color: '#5b4a9e' }, userMsg: `used ${code('/ticket setup')}`, replyTo: `used ${code('/ticket setup')}`, botTime: 'Yesterday at 7:55 PM', userTime: 'Yesterday at 7:54 PM', accent: '#2f3136', body });
}

// ---------- logging ----------
{
  const body = `
  <h2>🗑️ Message Deleted</h2>
  <p>Message by <b>har0r</b> deleted in <b>#general</b></p>
  <div class="sep"></div>
  <p><b>Author:</b> har0r ${code('1508137411757080768')}<br><b>Channel:</b> #general ${code('1541505464121036880')}</p>
  <p><b>Content:</b></p>
  <div class="block">can someone help me with tickets?</div>
  <p><b>Audit Log:</b> Deleted by har0r (self-delete)</p>
  <div class="small">TechRoad • All Rights Reserved • Tuesday, 25 August 2026</div>`;
  shots['logging'] = shot({ user: { name: 'har0r', initials: 'h', color: '#7a3b8f' }, userMsg: 'can someone help me with tickets?', replyTo: 'can someone help me…', botTime: 'Yesterday at 11:02 PM', userTime: 'Yesterday at 11:01 PM', accent: '#ed4245', body });
}

// ---------- come (DM: summoned back to their ticket) ----------
{
  const body = `
  <h2>📌 You have been summoned</h2>
  <p><b>Room:</b> #ticket-0001 in <b>TechRoad</b><br><b>Summoned by:</b> mod_har0r<br><b>Reason:</b> We replied to your ticket and are waiting for your response</p>
  <div class="sep"></div>
  <div class="small">TechRoad • All Rights Reserved</div>
  <div class="btnrow"><span class="btn b-secondary">Open ticket-0001</span></div>`;
  shots['come'] = shot({ header: 'har0r', dm: true, botTime: 'Yesterday at 6:40 PM', accent: '#2f3136', body });
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'shell', executablePath: EXEC || undefined, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  for (const [name, html] of Object.entries(shots)) {
    const p = await browser.newPage();
    await p.setViewport({ width: 680, height: 500, deviceScaleFactor: 2 });
    await p.setContent(html, { waitUntil: 'networkidle0' });
    const card = await p.$('.v2');
    const box = await card.boundingBox();
    await p.setViewport({ width: 680, height: Math.ceil(box.height + box.y + 20), deviceScaleFactor: 2 });
    await p.screenshot({ path: path.join(OUT, `${name}.png`) });
    console.log('shot', name);
    await p.close();
  }
  await browser.close();
})();
