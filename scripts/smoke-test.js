// Smoke-test every slash command (and each subcommand) with mock interactions.
// Usage: node scripts/smoke-test.js [categoryFilter]
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const db = require(path.join(ROOT, 'src/utils/db'));

const FLAG_V2 = 1 << 15;
const FLAG_EPHEMERAL = 1 << 6;

// ---- snapshot database dir so we can clean up ----
const DB_DIR = path.join(ROOT, 'database');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
const before = new Set(fs.readdirSync(DB_DIR));

let passed = 0, failed = 0;
const failures = [];

function ok(name) { passed++; console.log(`  PASS ${name}`); }
function bad(name, err) {
  failed++;
  const msg = String(err && err.stack ? err.stack.split('\n').slice(0, 3).join(' | ') : err);
  failures.push({ name, msg });
  console.log(`  FAIL ${name}\n       ${msg}`);
}

function makeUser(id) {
  return {
    id: id || '1508137411757080768',
    tag: 'Tester#0001',
    username: 'tester',
    discriminator: '0001',
    bot: false,
    displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
    avatarURL: () => null,
    banner: null,
    accentColor: null,
    createdAt: new Date('2020-01-01'),
    createdTimestamp: Date.parse('2020-01-01'),
    flags: { toArray: () => [] },
    toString() { return `<@${this.id}>`; },
    send: async () => makeMessage()
  };
}

function makeRole(id, name) {
  return {
    id: id || '555000000000000001',
    name: name || 'TestRole',
    hexColor: '#5865f2',
    color: 0x5865f2,
    position: 5,
    members: new Map(),
    editable: true,
    permissions: { has: () => true, toArray: () => [] },
    setName: async () => {}, setColor: async () => {}, setHoist: async () => {},
    setMentionable: async () => {}, setPermissions: async () => {}, delete: async () => {},
    toString() { return `<@&${this.id}>`; }
  };
}

function makeChannel(id, name, type) {
  const ch = {
    id: id || '333000000000000001',
    name: name || 'general',
    type: type === undefined ? 0 : type,
    parentId: null,
    position: 1,
    rateLimitPerUser: 0,
    nsfw: false,
    topic: 'topic',
    guild: null,
    isTextBased: () => true,
    permissionsFor: () => ({ has: () => true }),
    send: async (payload) => makeMessage(payload),
    sendTyping: async () => {},
    bulkDelete: async (n) => n,
    createInvite: async () => ({ url: 'https://discord.gg/abc', code: 'abc' }),
    fetchInvites: async () => new Map(),
    setName: async () => ch, setTopic: async () => ch, setRateLimitPerUser: async () => ch,
    setNSFW: async () => ch, setPosition: async () => ch, setParent: async () => ch,
    lockPermissions: async () => ch,
    permissionOverwrites: {
      cache: new Map(),
      create: async () => {}, edit: async () => {}, delete: async () => {},
      set: async () => {}
    },
    overwritePermissions: async () => {},
    updateOverwrite: async () => {},
    clone: async () => makeChannel(),
    delete: async () => ch,
    messages: { fetch: async () => makeMessage(), delete: async () => {} },
    toString() { return `<#${this.id}>`; }
  };
  return ch;
}

function makeMessage(payload) {
  const comps = payload && Array.isArray(payload.components) ? payload.components : [];
  return {
    id: '999000000000000001',
    content: '',
    components: comps.map(c => ({ toJSON: c.toJSON ? () => c.toJSON() : () => ({}) })),
    author: makeUser('222'),
    channel: null,
    guild: null,
    deletable: true,
    editable: true,
    pinned: false,
    edit: async () => makeMessage(payload),
    delete: async () => {},
    react: async () => {},
    pin: async () => {}, unpin: async () => {},
    createReactionCollector: () => ({ on: () => {}, stop: () => {} }),
    createMessageComponentCollector: () => ({ on: () => {}, stop: () => {} }),
    awaitMessageComponent: () => new Promise(() => {}),
    startThread: async () => makeChannel('777', 'thread', 11)
  };
}

function makeGuild() {
  const g = {
    id: '111000000000000001',
    name: 'Test Guild',
    memberCount: 42,
    iconURL: () => null,
    bannerURL: () => null,
    splashURL: () => null,
    discoverySplashURL: () => null,
    description: 'desc',
    verificationLevel: 1,
    explicitContentFilter: 1,
    premiumTier: 0,
    premiumSubscriptionCount: 0,
    afkTimeout: 300,
    afkChannelId: null,
    systemChannelId: null,
    rulesChannelId: null,
    publicUpdatesChannelId: null,
    maximumMembers: 500000,
    partnered: false,
    verified: false,
    features: [],
    emojis: { cache: new Map(), size: 0 },
    stickers: { cache: new Map(), size: 0 },
    roles: {
      everyone: '111000000000000001',
      highest: { position: 20 },
      cache: new Map([['555000000000000002', makeRole('555000000000000002', 'Admin')]]),
      find: (fn) => null,
      filter: () => new Map(),
      fetch: async () => new Map(),
      create: async () => makeRole()
    },
    channels: {
      cache: new Map([
        ['333000000000000001', Object.assign(makeChannel(), { name: 'general' })],
        ['333000000000000002', Object.assign(makeChannel('333000000000000002', 'logs'), { type: 0 })]
      ]),
      find: (fn) => null,
      filter: () => new Map(),
      fetch: async () => makeChannel(),
      create: async (o) => makeChannel(undefined, o && o.name),
      delete: async () => {}
    },
    members: {
      me: Object.assign(makeMember('222000000000000001'), { user: makeUser('222000000000000001') }),
      cache: new Map(),
      find: () => null,
      filter: () => new Map(),
      fetch: async (id) => makeMember(id),
      list: async () => []
    },
    bans: { create: async () => {}, remove: async () => {}, fetch: async () => new Map(), cache: new Map() },
    invites: { fetch: async () => new Map() },
    webhooks: { fetch: async () => new Map(), create: async () => ({ url: 'http://w' }) },
    fetchAuditLogs: async () => ({ entries: new Map() }),
    fetchOwner: async () => makeMember('1508137411757080768'),
    voiceAdapterCreator: () => {},
    setName: async () => g, setVerificationLevel: async () => g,
    setExplicitContentFilter: async () => g, setAFKTimeout: async () => g,
    setAFKChannel: async () => g, setSystemChannel: async () => g,
    setPublicUpdatesChannel: async () => g, setRulesChannel: async () => g,
    leave: async () => {},
    available: true,
    shard: { ids: [0] },
    presences: { cache: new Map() },
    toString() { return this.name; }
  };
  g.channels.cache.forEach(c => { c.guild = g; });
  return g;
}

function makeMember(id) {
  const user = makeUser(id);
  return {
    id: id || '1508137411757080768',
    user,
    nickname: 'tester-nick',
    displayName: 'tester-nick',
    joinedTimestamp: Date.now() - 100000,
    premiumSinceTimestamp: null,
    pending: false,
    bannable: true,
    kickable: true,
    moderatable: true,
    manageable: true,
    permissions: { has: () => true, toArray: () => [] },
    roles: {
      cache: col(new Map([['555000000000000002', makeRole()]])),
      highest: { position: 5 },
      add: async () => {}, remove: async () => {}, set: async () => []
    },
    voice: { channel: null, serverMute: false, serverDeaf: false, setMute: async () => {}, setDeaf: async () => {}, disconnect: async () => {} },
    timeout: async () => {},
    ban: async () => {}, kick: async () => {},
    displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
    communicationDisabledUntilTimestamp: null,
    fetchBan: async () => ({ reason: 'test' }),
    toString() { return `<@${this.id}>`; }
  };
}

function col(map) {
  map.filter = fn => col(new Map([...map.entries()].filter(([, v]) => fn(v))));
  map.map = fn => [...map.values()].map(fn);
  map.find = fn => [...map.values()].find(fn);
  map.some = fn => [...map.values()].some(fn);
  map.every = fn => [...map.values()].every(fn);
  map.reduce = (fn, init) => init === undefined ? [...map.values()].reduce(fn) : [...map.values()].reduce(fn, init);
  map.sort = fn => { const e = [...map.entries()].sort((a, b) => fn(a[1], b[1])); return col(new Map(e)); };
  map.first = () => map.values().next().value;
  map.last = () => { const a = [...map.values()]; return a[a.length - 1]; };
  map.toJSON = () => [...map.values()];
  return map;
}

function buildClient() {
  const guild = makeGuild();
  guild.fetch = async () => guild;
  guild.roles.cache = col(guild.roles.cache);
  guild.channels.cache = col(guild.channels.cache);
  guild.members.cache = col(guild.members.cache);
  guild.presences.cache = col(guild.presences.cache);
  guild.emojis.cache = col(guild.emojis.cache);
  const client = {
    _mockGuild: guild,
    prefix: '#',
    uptime: 1234567,
    readyAt: new Date(),
    ws: { ping: 42 },
    config: require(path.join(ROOT, 'src/config.json')),
    commands: new Map(),
    user: Object.assign(makeUser('1541188471295709284'), { setPresence: async () => {}, setStatus: async () => {}, setActivity: async () => {} }),
    users: { cache: col(new Map()), fetch: async (id) => makeUser(id) },
    guilds: { cache: col(new Map([[guild.id, guild]])), get: (id) => (id === guild.id ? guild : null), fetch: async () => guild, size: 1 },
    channels: { cache: col(new Map()), fetch: async () => makeChannel() },
    emoji: { cache: col(new Map()) },
    on: () => {}, once: () => {}
  };
  return client;
}

function optsProxy(schemaOptions, overrides, extraSub) {
  const byName = {};
  for (const o of schemaOptions || []) byName[o.name] = o;

  const valFor = (name) => {
    if (overrides && Object.prototype.hasOwnProperty.call(overrides, name)) return overrides[name];
    const def = byName[name];
    if (!def) return undefined;
    switch (def.type) {
      case 3: return def.choices && def.choices.length ? def.choices[0].value : 'test';
      case 4: return def.choices && def.choices.length ? def.choices[0].value : 1;
      case 10: return 1.5;
      case 5: return true;
      case 6: return makeUser();
      case 7: return makeChannel();
      case 8:
      case 9: return makeRole();
      case 11: return { name: 'file.txt', contentType: 'text/plain' };
      default: return undefined;
    }
  };

  const store = {};
  return {
    _store: store,
    data: [],
    get: (n, r) => { const v = valFor(n); if (v === undefined && r) throw new Error(`missing required option ${n}`); return v; },
    getString: (n, r) => { const v = valFor(n); if ((v === undefined || v === null) && r) throw new Error(`missing ${n}`); return v === undefined || v === null ? null : String(v); },
    getInteger: (n, r) => { const v = valFor(n); if ((v === undefined || v === null) && r) throw new Error(`missing ${n}`); return v == null ? null : Number(v); },
    getNumber: (n, r) => { const v = valFor(n); return v == null ? null : Number(v); },
    getBoolean: (n, r) => { const v = valFor(n); return v == null ? null : Boolean(v); },
    getUser: (n, r) => { const v = valFor(n); return v == null ? null : v; },
    getMember: (n, r) => { const v = valFor(n); return v == null ? null : makeMember(v.id); },
    getChannel: (n, r) => { const v = valFor(n); return v == null ? null : v; },
    getRole: (n, r) => { const v = valFor(n); return v == null ? null : v; },
    getMentionable: (n, r) => { const v = valFor(n); return v == null ? null : v; },
    getAttachment: () => null,
    getMessage: () => null,
    focus: () => {},
    getSubcommand: () => (extraSub ? extraSub.sub : null) || null,
    getSubcommandGroup: () => null
  };
}

async function runInteraction(client, cmdName, json, overrides, subInfo, mod) {
  const calls = [];
  let deferred = false, replied = false;
  const validatePayload = (payload, via) => {
    if (!payload) return;
    const flags = payload.flags || 0;
    if (payload.components) {
      if (!(flags & FLAG_V2)) throw new Error(`${via}: components sent without IsComponentsV2 flag`);
      for (const c of payload.components) {
        if (!c || typeof c.toJSON !== 'function') throw new Error(`${via}: component missing toJSON`);
        c.toJSON(); // throws on invalid structures
      }
    }
    if ((flags & FLAG_V2) && ('content' in payload)) throw new Error(`${via}: legacy content field with IsComponentsV2 (MESSAGE_CANNOT_USE_LEGACY_FIELDS)`);
    if ((flags & FLAG_V2) && payload.embeds) throw new Error(`${via}: embeds field with IsComponentsV2`);
    if (typeof payload.content === 'string' && payload.components) throw new Error(`${via}: content+components mix`);
  };

  const interaction = {
    commandName: cmdName,
    options: optsProxy(json.options || (subInfo && subInfo.schemaOptions) || [], overrides, subInfo),
    guildId: client._mockGuild.id,
    channelId: '333000000000000001',
    appPermissions: { has: () => true },
    member: makeMember(),
    user: makeUser(),
    guild: client._mockGuild,
    channel: makeChannel(),
    client,
    deferred, replied,
    token: 'x', id: 'i1',
    createdTimestamp: Date.now(),
    locale: 'enUS',
    guildLocale: 'enUS',
    async deferReply(opts = {}) { deferred = true; this.deferred = true; calls.push(['deferReply']); validatePayload(opts, 'deferReply'); return {}; },
    async reply(payload = {}) { replied = true; this.replied = true; calls.push(['reply']); validatePayload(payload, 'reply'); return makeMessage(payload); },
    async editReply(payload = {}) { calls.push(['editReply']); validatePayload(payload, 'editReply'); return makeMessage(payload); },
    async followUp(payload = {}) { calls.push(['followUp']); validatePayload(payload, 'followUp'); return makeMessage(payload); },
    async update(payload = {}) { calls.push(['update']); validatePayload(payload, 'update'); return makeMessage(payload); },
    async deferUpdate() { calls.push(['deferUpdate']); },
    async showModal(m) { if (!m || typeof m.toJSON !== 'function') throw new Error('showModal: not a ModalBuilder'); m.toJSON(); calls.push(['showModal']); },
    isChatInputCommand: () => true,
    isButton: () => false, isModalSubmit: () => false, isAnySelectMenu: () => false,
    isRepliable: () => true, inCachedGuild: () => true, inGuild: () => true,
    isStringSelectMenu: () => false, isAutocomplete: () => false
  };
  await mod.execute(interaction, client);
  if (!calls.length) throw new Error('no response was sent (reply/defer/etc)');
}

// ---- load commands ----
const filter = process.argv[2];

async function main() {
const cmdDir = path.join(ROOT, 'src/commands');
const groups = fs.readdirSync(cmdDir).filter(f => fs.statSync(path.join(cmdDir, f)).isDirectory()).sort();

for (const group of groups) {
  if (filter && !group.includes(filter)) continue;
  const files = fs.readdirSync(path.join(cmdDir, group)).filter(f => f.endsWith('.js')).sort();
  console.log(`\n=== ${group} (${files.length}) ===`);
  for (const file of files) {
    const full = path.join(cmdDir, group, file);
    let mod;
    try { mod = require(full); } catch (e) { bad(`${group}/${file}`, e); continue; }
    if (!mod.data || typeof mod.execute !== 'function') { bad(`${group}/${file}`, 'missing data/execute'); continue; }

    let json;
    try { json = mod.data.toJSON(); } catch (e) { bad(`${group}/${file} (toJSON)`, e); continue; }
    const name = json.name;

    // no subcommands -> single run
    const subs = (json.options || []).filter(o => o.type === 1 || o.type === 2);
    if (!subs.length) {
      const client = buildClient();
      try {
        await runInteraction(client, name, json, {}, null, mod);
        ok(`${group}/${name}`);
      } catch (e) { bad(`${group}/${name}`, e); }
      continue;
    }
    // subcommands (type 1) and groups (type 2)
    for (const opt of subs) {
      if (opt.type === 1) {
        const client = buildClient();
        const schemaOpts = (opt.options || []).map(o => ({ ...o }));
        try {
          await runInteraction(client, name, { options: schemaOpts }, {}, { sub: opt.name, schemaOptions: schemaOpts }, mod);
          ok(`${group}/${name} ${opt.name}`);
        } catch (e) { bad(`${group}/${name} ${opt.name}`, e); }
      } else if (opt.type === 2) {
        for (const s of opt.options || []) {
          const client = buildClient();
          const flat = [...(s.options || [])];
          try {
            await runInteraction(client, name, { options: flat }, {}, { sub: s.name, schemaOptions: flat }, mod);
            ok(`${group}/${name} ${opt.name} ${s.name}`);
          } catch (e) { bad(`${group}/${name} ${opt.name} ${s.name}`, e); }
        }
      }
    }
  }
}

// ---- cleanup db files created during tests ----
for (const f of fs.readdirSync(DB_DIR)) {
  if (!before.has(f)) { try { fs.unlinkSync(path.join(DB_DIR, f)); } catch {} }
}

// ---- static checks: APIs that do not exist in discord.js 14.25 ----
{
  const badPatterns = ['ThumbnailBuilder.from(', 'SectionBuilder.from('];
  const srcDir = path.join(ROOT, 'src');
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []);
  for (const file of walk(srcDir)) {
    const src = fs.readFileSync(file, 'utf8');
    for (const bp of badPatterns) {
      if (src.includes(bp)) bad(`static/${path.relative(ROOT, file)}`, `uses non-existent API: ${bp}`);
    }
  }
  if (!failures.some(f => f.name.startsWith('static/'))) ok('static/no invalid builder APIs');
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
