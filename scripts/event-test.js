// Smoke-test event handlers (guildCreate, guildMemberAdd, messageCreate, interactionCreate, logging).
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const db = require(path.join(ROOT, 'src/utils/db'));
const DB_DIR = path.join(ROOT, 'database');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
const before = new Set(fs.readdirSync(DB_DIR));
// clear leftovers from previous crashed runs of this harness
for (const f of fs.readdirSync(DB_DIR)) { if (f.includes('111000000000000001') || f.startsWith('level_111')) { try { fs.unlinkSync(path.join(DB_DIR, f)); } catch {} } }

let passed = 0, failed = 0;
const failures = [];
const ok = n => { passed++; console.log(`  PASS ${n}`); };
const bad = (n, e) => {
  failed++;
  const msg = String(e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e);
  failures.push({ name: n, msg });
  console.log(`  FAIL ${n}\n       ${msg}`);
};

function makeUser(id) {
  return {
    id: id || '1508137411757080768', tag: 'Tester#0001', username: 'tester', bot: false,
    displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
    createdAt: new Date(), createdTimestamp: 0, flags: { toArray: () => [] },
    banner: null, accentColor: null,
    toString() { return `<@${this.id}>`; },
    send: async () => ({})
  };
}
function makeRole() {
  return { id: '555000000000000009', name: 'Role', members: new Map(), position: 3,
    permissions: { has: () => true }, edit: async () => {}, delete: async () => {},
    toString() { return '<@&555000000000000009>'; } };
}
function makeMessage(payload) {
  const comps = payload && Array.isArray(payload.components) ? payload.components : [];
  const flags = payload && payload.flags ? payload.flags : 0;
  if (comps.length && !(Number(flags) & (1 << 15))) throw new Error('V2 flag missing on message send');
  if ((Number(flags) & (1 << 15)) && payload && 'content' in payload) throw new Error('legacy content with V2 flag on send');
  for (const c of comps) if (!c || typeof c.toJSON !== 'function') throw new Error('bad component');
  for (const c of comps) c.toJSON();
  const msg = {
    id: '999000000000000001', content: '', components: comps.map(c => c.toJSON()),
    author: makeUser('222'), channel: null, guild: null,
    attachments: new Map(), embeds: [], mentions: { users: new Map(), members: new Map(), channels: new Map(), roles: new Map() },
    deletable: true, editable: true, partial: false,
    member: null,
    edit: async () => msg, delete: async () => {}, react: async () => {},
    reply: async (p) => { if (p && p.components) validateP(p); return makeMessage(p); },
    pin: async () => {},
    createMessageComponentCollector: () => ({ on: () => {}, stop: () => {} })
  };
  function validateP(p) {
    if (!(Number(p.flags || 0) & (1 << 15))) throw new Error('V2 flag missing on reply');
    if ((Number(p.flags || 0) & (1 << 15)) && 'content' in p) throw new Error('legacy content with V2 flag');
    if ((Number(p.flags || 0) & (1 << 15)) && p.embeds) throw new Error('embeds with V2 flag');
    for (const c of p.components) c.toJSON();
  }
  return msg;
}
function makeChannel(id, name, type) {
  const ch = {
    id: id || '333000000000000001', name: name || 'general', type: type === undefined ? 0 : type,
    isTextBased: () => true, permissionsFor: () => ({ has: () => true }),
    send: async p => makeMessage(p), sendTyping: async () => {}, bulkDelete: async n => n,
    messages: { fetch: async () => makeMessage(), delete: async () => {} },
    permissionOverwrites: { cache: new Map(), create: async () => {}, edit: async () => {}, delete: async () => {} },
    overwritePermissions: async () => {},
    setName: async () => ch, delete: async () => ch,
    toString() { return `<#${ch.id}>`; }
  };
  return ch;
}
function makeMember(id) {
  return {
    id: id || '1508137411757080768', user: makeUser(id),
    nickname: 'nick', displayName: 'nick', manageable: true, bannable: true, kickable: true, moderatable: true,
    pending: false, joinedTimestamp: Date.now(),
    permissions: { has: () => true },
    roles: { cache: new Map([['r', makeRole()]]), highest: { position: 5 }, add: async () => {}, remove: async () => {}, set: async () => [] },
    voice: { channel: null }, timeout: async () => {}, ban: async () => {}, kick: async () => {},
    setNickname: async () => {},
    displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
    communicationDisabledUntilTimestamp: null,
    toString() { return `<@${this.id}>`; }
  };
}
function col(map) {
  map.filter = fn => col(new Map([...map.entries()].filter(([, v]) => fn(v))));
  map.find = fn => [...map.values()].find(fn);
  map.first = () => map.values().next().value;
  return map;
}
function makeGuild(withSystemChannel) {
  const g = {
    id: '111000000000000001', name: 'Test Guild', memberCount: 7,
    iconURL: () => null, bannerURL: () => null, splashURL: () => null,
    systemChannelId: withSystemChannel ? 'sys1' : null,
    roles: { everyone: '111000000000000001', cache: new Map([['r2', makeRole()]]), highest: { position: 9 }, create: async () => makeRole(), fetch: async () => new Map() },
    channels: {
      cache: new Map([['333000000000000001', Object.assign(makeChannel(), { type: 0 })], ['sys1', Object.assign(makeChannel('sys1', 'system'), { type: 0 })], ['cat1', Object.assign(makeChannel('cat1', 'Cat'), { type: 4 })]]),
      find: fn => [...g.channels.cache.values()].find(fn), filter: () => new Map(),
      fetch: async () => makeChannel(),
      create: async o => Object.assign(makeChannel(undefined, o && o.name), { type: (o && o.type) || 0, parentId: (o && o.parent) || null })
    },
    members: { me: makeMember('222'), cache: new Map(), fetch: async id => makeMember(id), find: () => null, filter: () => new Map(), list: async () => [makeMember()] },
    bans: { create: async () => {}, remove: async () => {}, fetch: async () => new Map() },
    invites: { fetch: async () => new Map() },
    fetchAuditLogs: async () => ({ entries: new Map() }),
    fetchOwner: async () => makeMember('1508137411757080768'),
    voiceAdapterCreator: () => {}, available: true
  };
  g.roles.everyone = g.id;
  g.channels.cache = col(g.channels.cache);
  g.roles.cache = col(g.roles.cache);
  g.members.cache = col(g.members.cache);
  return g;
}
function buildClient(guildOpts) {
  const guild = makeGuild(guildOpts);
  guild.fetch = async () => guild;
  const listeners = {};
  return {
    _mockGuild: guild, _listeners: listeners,
    config: require(path.join(ROOT, 'src/config.json')),
    commands: new Map(), prefix: '#',
    uptime: 1234567, readyAt: new Date(), ws: { ping: 42 },
    user: Object.assign(makeUser('1541188471295709284'), { setPresence: async () => {}, setActivity: async () => {} }),
    users: { cache: col(new Map()), fetch: async id => makeUser(id) },
    guilds: { cache: col(new Map([[guild.id, guild]])), size: 1 },
    channels: { cache: col(new Map()), fetch: async () => makeChannel() },
    on: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); },
    once: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); },
    emit: (ev, ...a) => { for (const fn of listeners[ev] || []) Promise.resolve(fn(...a)).catch(() => {}); }
  };
}

async function main() {
  const eventsDir = path.join(ROOT, 'src/events');

  // ---------- guildCreate ----------
  console.log('\n=== guildCreate ===');
  {
    const mod = require(path.join(eventsDir, 'guildCreate'));
    const client = buildClient(true);
    try { await mod.execute(client._mockGuild, client); ok('guildCreate (with system channel)'); } catch (e) { bad('guildCreate (system)', e); }
    const client2 = buildClient(false);
    try { await mod.execute(client2._mockGuild, client2); ok('guildCreate (no system channel)'); } catch (e) { bad('guildCreate (no system)', e); }
  }

  // ---------- guildMemberAdd ----------
  console.log('\n=== guildMemberAdd ===');
  {
    const mod = require(path.join(eventsDir, 'guildMemberAdd'));
    const client = buildClient(true);
    const gm=makeMember(); gm.guild=client._mockGuild; try { await mod.execute(gm, client); ok('guildMemberAdd (welcome unset)'); } catch (e) { bad('guildMemberAdd unset', e); }
    db.set(client._mockGuild.id, 'welcome', { channelId: '333000000000000001', message: 'Hey {user} welcome!' });
    const gm2=makeMember(); gm2.guild=client._mockGuild; try { await mod.execute(gm2, client); ok('guildMemberAdd (welcome set)'); } catch (e) { bad('guildMemberAdd set', e); }
    fs.unlinkSync(path.join(DB_DIR, `${client._mockGuild.id}_welcome.json`));
  }

  // ---------- messageCreate ----------
  console.log('\n=== messageCreate ===');
  {
    const mod = require(path.join(eventsDir, 'messageCreate'));
    const guildId = '111000000000000001';

    // bot message ignored
    {
      const client = buildClient(true);
      const m = makeMessage(); m.author = Object.assign(makeUser('999'), { bot: true }); m.guild = client._mockGuild; m.channel = client._mockGuild.channels.cache.get('333000000000000001');
      try { await mod.execute(m, client); ok('messageCreate ignores bots'); } catch (e) { bad('bot msg', e); }
    }

    // chat adds XP
    {
      const client = buildClient(true);
      const m = makeMessage(); m.content = 'hello everyone'; m.author = makeUser(); m.member = makeMember();
      m.guild = client._mockGuild; m.channel = client._mockGuild.channels.cache.get('333000000000000001');
      try { await mod.execute(m, client); const d = db.get(`level_${guildId}_${m.author.id}`); if (!d) throw new Error('XP not saved'); ok('messageCreate grants XP'); } catch (e) { bad('xp grant', e); }
      fs.unlinkSync(path.join(DB_DIR, `level_${guildId}_${m.author.id}.json`));
    }

    // autoline image-only deletes text posts
    {
      const client = buildClient(true);
      db.set(guildId, 'autoline', { channelId: '333000000000000001', imageOnly: true });
      let deleted = false;
      const m = makeMessage(); m.content = 'no image here'; m.author = makeUser(); m.member = makeMember();
      m.guild = client._mockGuild; m.channel = client._mockGuild.channels.cache.get('333000000000000001');
      m.deletable = true; m.delete = async () => { deleted = true; };
      try { await mod.execute(m, client); if (!deleted) throw new Error('text was not deleted in image-only channel'); ok('autoline deletes text in image-only'); } catch (e) { bad('autoline', e); }
      fs.unlinkSync(path.join(DB_DIR, `${guildId}_autoline.json`));
    }

    // feedback conversion sends exactly ONE message with buttons
    {
      const client = buildClient(true);
      db.set(guildId, 'feedback', { channelId: '333000000000000001' });
      let sentCount = 0;
      const m = makeMessage(); m.content = 'great server love it'; m.author = makeUser(); m.member = makeMember();
      m.guild = client._mockGuild;
      const ch = client._mockGuild.channels.cache.get('333000000000000001');
      m.channel = ch;
      const origSend = ch.send.bind(ch);
      ch.send = async p => { sentCount++; return origSend(p); };
      m.deletable = true; m.delete = async () => {};
      try {
        await mod.execute(m, client);
        if (sentCount !== 1) throw new Error(`expected 1 message, got ${sentCount}`);
        ok('feedback converts to single buttoned post');
      } catch (e) { bad('feedback flow', e); }
      fs.unlinkSync(path.join(DB_DIR, `${guildId}_feedback.json`));
    }

    // AFK removal + mention notice
    {
      const client = buildClient(true);
      const afkUserId = '1508137411757080768';
      db.set(guildId, 'afk', { [afkUserId]: { reason: 'sleeping', since: Date.now() - 1000 } });
      const m = makeMessage(); m.content = 'im back'; m.author = makeUser(afkUserId); m.member = makeMember(afkUserId);
      m.guild = client._mockGuild; m.channel = client._mockGuild.channels.cache.get('333000000000000001');
      try { await mod.execute(m, client); const after = db.get(guildId, 'afk'); if (after[afkUserId]) throw new Error('AFK entry not removed'); ok('AFK auto-remove on return'); } catch (e) { bad('afk remove', e); }
      fs.unlinkSync(path.join(DB_DIR, `${guildId}_afk.json`));
    }

    // prefix bridge: #ping and #help through real commands
    {
      const client = buildClient(true);
      for (const dir of fs.readdirSync(path.join(ROOT, 'src/commands'))) {
        for (const f of fs.readdirSync(path.join(ROOT, 'src/commands', dir)).filter(f => f.endsWith('.js'))) {
          const cmd = require(path.join(ROOT, 'src/commands', dir, f));
          if (cmd.data) client.commands.set(cmd.data.name, cmd);
        }
      }
      const m = makeMessage(); m.content = '#ping'; m.author = makeUser(); m.member = makeMember();
      m.guild = client._mockGuild; m.channel = client._mockGuild.channels.cache.get('333000000000000001');
      try { await mod.execute(m, client); ok('prefix bridge #ping'); } catch (e) { bad('#ping prefix', e); }

      const m2 = makeMessage(); m2.content = '#help'; m2.author = makeUser(); m2.member = makeMember();
      m2.guild = client._mockGuild; m2.channel = client._mockGuild.channels.cache.get('333000000000000001');
      try { await mod.execute(m2, client); ok('prefix bridge #help'); } catch (e) { bad('#help prefix', e); }
    }
  }

  // ---------- interactionCreate routing ----------
  console.log('\n=== interactionCreate ===');
  {
    const mod = require(path.join(eventsDir, 'interactionCreate'));

    // slash ping
    {
      const client = buildClient(true);
      const pingCmd = require(path.join(ROOT, 'src/commands/info/ping.js'));
      client.commands.set('ping', pingCmd);
      const inter = {
        isChatInputCommand: () => true, isButton: () => false, isModalSubmit: () => false, isAnySelectMenu: () => false, isAutocomplete: () => false,
        commandName: 'ping', options: { getString: () => null, getSubcommand: () => null }, client,
        guild: client._mockGuild, channel: makeChannel(), member: makeMember(), user: makeUser(),
        deferred: false, replied: false,
        async reply(p) { if (p.components && !(Number(p.flags || 0) & (1 << 15))) throw new Error('no v2 flag'); }, 
        async deferReply(o) { this.deferred = true; },
        async editReply(p) { if (p.components && !(Number(p.flags || 0) & (1 << 15))) throw new Error('no v2 flag'); }
      };
      try { await mod.execute(inter, client); ok('routes /ping'); } catch (e) { bad('/ping route', e); }
    }

    // unknown command reply
    {
      const client = buildClient(true);
      const inter = {
        isChatInputCommand: () => true, isButton: () => false, isModalSubmit: () => false, isAnySelectMenu: () => false, isAutocomplete: () => false,
        commandName: 'doesnotexist', options: {}, client,
        guild: client._mockGuild, channel: makeChannel(), member: makeMember(), user: makeUser(),
        deferred: false, replied: false,
        async reply(p) { if (p.components && !(Number(p.flags || 0) & (1 << 15))) throw new Error('no v2 flag'); }
      };
      try { await mod.execute(inter, client); ok('unknown command handled'); } catch (e) { bad('unknown cmd', e); }
    }

    // music button routes to handler without crash
    {
      const client = buildClient(true);
      const inter = {
        isChatInputCommand: () => false, isButton: () => true, isModalSubmit: () => false, isAnySelectMenu: () => false, isAutocomplete: () => false,
        customId: 'music_pause', values: [], client,
        guild: client._mockGuild, channel: makeChannel(), member: makeMember(), user: makeUser(), message: makeMessage(),
        deferred: false, replied: false,
        async deferReply(o) { this.deferred = true; }, async deferUpdate() { this.deferred = true; },
        async reply(p) { if (p.components && !(Number(p.flags || 0) & (1 << 15))) throw new Error('no v2 flag'); this.replied = true; },
        async followUp(p) { if (p.components && !(Number(p.flags || 0) & (1 << 15))) throw new Error('no v2 flag'); }
      };
      try { await mod.execute(inter, client); ok('routes music_pause button'); } catch (e) { bad('music button route', e); }
    }

    // expired musicpick select routes safely
    {
      const client = buildClient(true);
      const inter = {
        isChatInputCommand: () => false, isButton: () => false, isModalSubmit: () => false, isAnySelectMenu: () => true, isAutocomplete: () => false,
        customId: 'musicpick_expired_123', values: ['0'], client,
        guild: client._mockGuild, channel: makeChannel(), member: makeMember(), user: makeUser(), message: makeMessage(),
        deferred: false, replied: false,
        async deferReply(o) { this.deferred = true; }, async deferUpdate() { this.deferred = true; },
        async reply(p) { if (p.components && !(Number(p.flags || 0) & (1 << 15))) throw new Error('no v2 flag'); this.replied = true; }
      };
      try { await mod.execute(inter, client); ok('routes expired musicpick'); } catch (e) { bad('musicpick route', e); }
    }

    // economy choice buttons route + persist
    {
      const client = buildClient(true);
      const inter = {
        isChatInputCommand: () => false, isButton: () => true, isModalSubmit: () => false, isAnySelectMenu: () => false, isAutocomplete: () => false,
        customId: `economy_yes_${client._mockGuild.id}`, values: [], client,
        guild: client._mockGuild, channel: makeChannel(), member: makeMember(), user: makeUser(), message: makeMessage(),
        deferred: false, replied: false,
        async deferReply(o) { this.deferred = true; }, async deferUpdate() { this.deferred = true; },
        async update(p) { if (p.components && !(Number(p.flags || 0) & (1 << 15))) throw new Error('no v2 flag'); this.replied = true; },
        async reply(p) { if (p.components && !(Number(p.flags || 0) & (1 << 15))) throw new Error('no v2 flag'); this.replied = true; }
      };
      try {
        await mod.execute(inter, client);
        const val = require(path.join(ROOT, 'src/utils/db')).get(client._mockGuild.id, 'economy_enabled');
        if (val !== true) throw new Error('economy_enabled not saved as true');
        ok('economy choice persists');
        fs.unlinkSync(path.join(DB_DIR, `${client._mockGuild.id}_economy_enabled.json`));
      } catch (e) { bad('economy button route', e); }
    }
  }

  // ---------- logging attach ----------
  console.log('\n=== logging ===');
  {
    const mod = require(path.join(eventsDir, 'logging'));
    const client = buildClient(true);
    try {
      await mod.execute(client);
      if (!client._listeners['messageDelete']) throw new Error('messageDelete listener not attached');
      ok('logging attaches listeners');
      // fire one listener with a fake deleted message (log channel not configured -> should no-op)
      const m = makeMessage(); m.guild = client._mockGuild; m.author = makeUser(); m.channel = makeChannel();
      for (const fn of client._listeners['messageDelete']) await fn(m);
      ok('messageDelete listener no-ops safely unconfigured');
    } catch (e) { bad('logging', e); }
  }

  // ---------- verification (interactionCreate handler for verify buttons) ----------
  console.log('\n=== verification ===');
  {
    try {
      const mod = require(path.join(eventsDir, 'verification'));
      const client = buildClient(true);
      // unconfigured guild -> should reply with setup error, not crash
      const inter = {
        isButton: () => true, customId: 'verify_button', guildId: client._mockGuild.id,
        guild: client._mockGuild, member: makeMember(), user: makeUser(), client,
        deferred: false, replied: false,
        async reply(p) { if (p.components && !(Number(p.flags || 0) & (1 << 15))) throw new Error('no v2 flag'); this.replied = true; },
        async deferReply() { this.deferred = true; }, async editReply() {}, async followUp() {}
      };
      await mod.execute(inter, client);
      if (!inter.replied) throw new Error('no response for verify button');
      ok('verification handles unconfigured verify button');
    } catch (e) { bad('verification', e); }
  }

  for (const f of fs.readdirSync(DB_DIR)) {
    if (!before.has(f)) { try { fs.unlinkSync(path.join(DB_DIR, f)); } catch {} }
  }

  console.log(`\n========================`);
  console.log(`PASSED: ${passed}  FAILED: ${failed}`);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach((f, i) => console.log(`${i + 1}. ${f.name}\n   ${f.msg}`));
  }
  process.exit(failed ? 1 : 0);
}

main().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
