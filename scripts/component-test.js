// Smoke-test all component handlers (buttons / selectMenus / modals).
// Usage: node scripts/component-test.js
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DB_DIR = path.join(ROOT, 'database');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
const before = new Set(fs.readdirSync(DB_DIR));

let passed = 0, failed = 0;
const failures = [];
const ok = n => { passed++; console.log(`  PASS ${n}`); };
const bad = (n, e) => {
  failed++;
  const msg = String(e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e);
  failures.push({ name: n, msg });
  console.log(`  FAIL ${n}\n       ${msg}`);
};

const FLAG_V2 = 1 << 15;

function validate(payload, via) {
  if (!payload) return;
  const f = Number(payload.flags || 0);
  if (payload.components && !(f & FLAG_V2)) throw new Error(`${via}: components without IsComponentsV2 flag`);
  if ((f & FLAG_V2) && 'content' in payload) throw new Error(`${via}: legacy content with V2 flag`);
  if ((f & FLAG_V2) && payload.embeds) throw new Error(`${via}: embeds with V2 flag`);
  for (const c of payload.components || []) c.toJSON();
}

function makeUser(id) {
  return {
    id: id || '1508137411757080768',
    tag: 'Tester#0001', username: 'tester', bot: false,
    displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
    createdAt: new Date(), createdTimestamp: 0,
    flags: { toArray: () => [] },
    toString() { return `<@${this.id}>`; },
    send: async () => ({})
  };
}
function makeRole() {
  return { id: '555000000000000009', name: 'Role', members: new Map(), position: 3,
    permissions: { has: () => true }, edit: async () => {}, delete: async () => {},
    setName: async () => {}, setColor: async () => {}, setMentionable: async () => {},
    toString() { return `<@&555000000000000009>`; } };
}
function makeMessage() {
  return {
    id: '999000000000000001', author: makeUser('222'), editable: true, deletable: true,
    components: [], content: '',
    edit: async () => makeMessage(), delete: async () => {}, react: async () => {},
    createMessageComponentCollector: () => ({ on: () => {}, stop: () => {} }),
    awaitMessageComponent: () => new Promise(() => {})
  };
}
function makeChannel() {
  const ch = {
    id: '333000000000000001', name: 'general', type: 0,
    isTextBased: () => true, permissionsFor: () => ({ has: () => true }),
    send: async (p) => { validate(p, 'channel.send'); return makeMessage(); },
    bulkDelete: async n => n, sendTyping: async () => {}, messages: { fetch: async () => makeMessage(), delete: async () => {} },
    setName: async () => ch, delete: async () => ch,
    permissionOverwrites: { cache: new Map(), create: async () => {}, edit: async () => {}, delete: async () => {} },
    overwritePermissions: async () => {}, updateOverwrite: async () => {},
    createInvite: async () => ({ url: 'x', code: 'x' }), fetchInvites: async () => new Map(),
    toString() { return `<#${this.id}>`; }
  };
  return ch;
}
function makeMember(id) {
  return {
    id: id || '1508137411757080768',
    user: makeUser(id),
    nickname: 'nick', displayName: 'nick', bannable: true, kickable: true, moderatable: true,
    permissions: { has: () => true },
    roles: { cache: new Map([['r', makeRole()]]), highest: { position: 5 }, add: async () => {}, remove: async () => {} },
    voice: { channel: null },
    timeout: async () => {}, ban: async () => {}, kick: async () => {},
    displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
    communicationDisabledUntilTimestamp: null,
    toString() { return `<@${this.id}>`; }
  };
}
function makeGuild() {
  const g = {
    id: '111000000000000001', name: 'Test Guild', memberCount: 10,
    iconURL: () => null, bannerURL: () => null, splashURL: () => null,
    roles: { everyone: g => g.id, cache: new Map([['r2', makeRole()]]), highest: { position: 9 }, create: async () => makeRole(), fetch: async () => new Map() },
    channels: {
      cache: new Map([['c1', Object.assign(makeChannel(), { type: 4 })], ['c2', makeChannel()]]),
      find: () => null, filter: () => new Map(),
      fetch: async () => makeChannel(),
      create: async o => Object.assign(makeChannel(), { name: (o && o.name) || 'new', type: (o && o.type) || 0 })
    },
    members: (() => {
      const list = new Map([
        ['1508137411757080768', Object.assign(makeMember('1508137411757080768'), { presence: { status: 'online' } })],
        ['444000000000000001', Object.assign(makeMember('444000000000000001'), { presence: { status: 'offline' } })],
        ['555000000000000008', Object.assign(makeMember('555000000000000008'), { user: Object.assign(makeUser('555000000000000008'), { bot: true }) })]
      ]);
      const wrap = m => { m.filter = fn => wrap(new Map([...m.entries()].filter(([, v]) => fn(v)))); m.size = m.size; return m; };
      return { me: makeMember('222'), cache: list, fetch: async () => wrap(new Map(list)), find: () => null, filter: () => new Map() };
    })(),
    bans: { create: async () => {}, remove: async () => {}, fetch: async () => new Map() },
    fetchAuditLogs: async () => ({ entries: new Map() }),
    voiceAdapterCreator: () => {},
    available: true
  };
  g.roles.everyone = g.id;
  return g;
}
function buildClient() {
  const guild = makeGuild();
  guild.fetch = async () => guild;
  return {
    _mockGuild: guild,
    config: require(path.join(ROOT, 'src/config.json')),
    commands: new Map(), prefix: '#',
    user: Object.assign(makeUser('1541188471295709284'), { setPresence: async () => {}, setActivity: async () => {} }),
    users: { cache: new Map(), fetch: async id => makeUser(id) },
    guilds: { cache: new Map([[guild.id, guild]]) },
    channels: { cache: new Map([['333000000000000001', makeChannel()]]), fetch: async () => makeChannel() },
    on: () => {}
  };
}

function makeComponentInteraction(kind, customId, client, extra = {}) {
  let deferred = false, replied = false;
  const calls = [];
  const base = {
    customId, client,
    guildId: client._mockGuild.id,
    channelId: '333000000000000001',
    member: makeMember(), user: makeUser(),
    guild: client._mockGuild,
    channel: makeChannel(),
    message: makeMessage(),
    values: extra.values || [],
    fields: extra.fields || null,
    deferred, replied,
    async deferReply(o = {}) { validate(o, 'deferReply'); deferred = true; this.deferred = true; calls.push('deferReply'); },
    async deferUpdate() { deferred = true; this.deferred = true; calls.push('deferUpdate'); },
    async reply(o = {}) { replied = true; this.replied = true; validate(o, 'reply'); calls.push('reply'); },
    async editReply(o = {}) { validate(o, 'editReply'); calls.push('editReply'); },
    async followUp(o = {}) { validate(o, 'followUp'); calls.push('followUp'); },
    async update(o = {}) { validate(o, 'update'); calls.push('update'); },
    async showModal(m) { m.toJSON(); calls.push('showModal'); },
    isButton: () => kind === 'button',
    isAnySelectMenu: () => kind === 'select',
    isStringSelectMenu: () => kind === 'select',
    isModalSubmit: () => kind === 'modal',
    isRepliable: () => true
  };
  base._calls = calls;
  return base;
}

async function tryHandler(label, handler, interaction) {
  try {
    await handler.execute(interaction, interaction.client);
    ok(label);
  } catch (e) {
    bad(label, e);
  }
}

async function main() {
  const client = buildClient();
  const compDir = path.join(ROOT, 'src/components');

  // ---------- BUTTONS ----------
  console.log('\n=== buttons ===');
  const btnDir = path.join(compDir, 'buttons');
  const btnIdsByFile = {
    broadcast: ['broadcast_confirm_expired_123', 'broadcast_cancel_expired_123'],
    economy: ['economy_yes_111000000000000001', 'economy_no_111000000000000001'],
    deleteall: ['deleteall_confirm_333000000000000001', 'deleteall_cancel_333000000000000001']
  };
  for (const f of fs.readdirSync(btnDir).filter(f => f.endsWith('.js'))) {
    const name = f.replace('.js', '');
    const mod = require(path.join(btnDir, f));
    if (typeof mod.execute !== 'function') { bad(`buttons/${name}`, 'no execute'); continue; }
    const ids = btnIdsByFile[name] || [`${name}_111000000000000001`];
    let anyBad = false;
    for (const id of ids) {
      const inter = makeComponentInteraction('button', id, client);
      try {
        await mod.execute(inter, client);
        for (const p of inter._calls) void p;
      } catch (e) { bad(`buttons/${name} (${id})`, e); anyBad = true; break; }
    }
    if (!anyBad) ok(`buttons/${name}`);
  }

  // ---------- SELECT MENUS ----------
  console.log('\n=== selectMenus ===');
  const selDir = path.join(compDir, 'selectMenus');
  const selIdsByFile = {};
  for (const f of fs.readdirSync(selDir).filter(f => f.endsWith('.js'))) {
    const name = f.replace('.js', '');
    const mod = require(path.join(selDir, f));
    if (typeof mod.execute !== 'function') { bad(`selectMenus/${name}`, 'no execute'); continue; }
    const ids = selIdsByFile[name] || [`${name}_select`];
    let anyBad = false;
    for (const id of ids) {
      const inter = makeComponentInteraction('select', id, client, { values: ['opt0'] });
      try { await mod.execute(inter, client); } catch (e) { bad(`selectMenus/${name} (${id})`, e); anyBad = true; break; }
    }
    if (!anyBad) ok(`selectMenus/${name}`);
  }

  // ---------- MODALS ----------
  console.log('\n=== modals ===');
  const modDir = path.join(compDir, 'modals');
  const fieldsFor = name => ({
    getTextInputValue: (id) => {
      const map = {
        title: 'Test Title', description: 'Test description here',
        color: '#5865f2', image: '', thumbnail: '', button1: '', button2: '',
        button3: '', button4: '', url1: '', url2: '', url3: '', url4: '',
        footer: 'foot', message: 'hello world', roles: 'role1, role2',
        placeholder: 'ph', label: 'lbl', question: 'q', channel_id: '333000000000000001',
        type: 'buttons'
      };
      if (!(id in map)) throw new Error(`unexpected field ${id}`);
      return map[id];
    },
    fields: new Map()
  });
  for (const f of fs.readdirSync(modDir).filter(f => f.endsWith('.js'))) {
    const name = f.replace('.js', '');
    const mod = require(path.join(modDir, f));
    if (typeof mod.execute !== 'function') { bad(`modals/${name}`, 'no execute'); continue; }
    const ids = {
      embed: ['embed_modal_create_new'],
      announce: ['announce_modal_send'],
      selfroles: ['selfroles_modal_create'],
      ticket: ['ticket_setup:333000000000000001:1508137411757080768'],
      broadcast: ['broadcast_modal:all:1508137411757080768']
    };
    for (const id of (ids[name] || [`${name}_modal_submit`])) {
      const inter = makeComponentInteraction('modal', id, client, { fields: fieldsFor(name) });
      try { await mod.execute(inter, client); } catch (e) { bad(`modals/${name} (${id})`, e); }
    }
    ok(`modals/${name}`);
  }

  for (const f2 of fs.readdirSync(DB_DIR)) {
    if (!before.has(f2)) { try { fs.unlinkSync(path.join(DB_DIR, f2)); } catch {} }
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
