// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const dbFolder = path.join(__dirname, '..', '..', 'database');

function ensureFolder() {
  if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder, { recursive: true });
}

function resolvePath(a, b) {
  ensureFolder();
  if (b === undefined) {
    // single key => file is `${a}.json`
    return path.join(dbFolder, `${a}.json`);
  }
  // guildId + name => `${guildId}_${name}.json`
  return path.join(dbFolder, `${a}_${b}.json`);
}

/**
 * Get data from JSON file.
 * Supports:
 *  get("economy_123_456")
 *  get(guildId, "welcome")
 *  get(guildId, key)
 */
function get(a, b) {
  try {
    const file = resolvePath(a, b);
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, 'utf8');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

/**
 * Set data to JSON file.
 * Supports:
 *  set("economy_123_456", { coins: 100 })
 *  set(guildId, "welcome", { channel: "123" })
 */
function set(a, b, c) {
  ensureFolder();
  let file;
  let data;
  if (c === undefined) {
    file = resolvePath(a);
    data = b;
  } else {
    file = resolvePath(a, b);
    data = c;
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

/**
 * Delete JSON file or key inside object.
 * If only file deletion needed:
 *  del("economy_123_456")
 *  del(guildId, "welcome")
 * If you pass third arg as subKey, it deletes that property from object and re-saves.
 */
function del(a, b, c) {
  ensureFolder();
  // del(guildId, name, subKey) => delete property
  if (c !== undefined) {
    const file = resolvePath(a, b);
    if (!fs.existsSync(file)) return false;
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (data && typeof data === 'object' && c in data) {
        delete data[c];
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }
  // del(a) or del(a,b) => delete file
  const file = resolvePath(a, b);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    return true;
  }
  return false;
}

function all() {
  ensureFolder();
  const files = fs.readdirSync(dbFolder).filter(f => f.endsWith('.json'));
  return files.map(f => ({
    file: f,
    key: f.replace(/\.json$/, ''),
    data: (() => { try { return JSON.parse(fs.readFileSync(path.join(dbFolder, f), 'utf8')); } catch { return null; } })()
  }));
}

function getOrDefault(a, b, def) {
  const val = b === undefined ? get(a) : get(a, b);
  return val === null || val === undefined ? def : val;
}

module.exports = { get, set, del, all, getOrDefault, folder: dbFolder };

// Made with ❤️ by TechRoad © 2026/2027 - All Rights Reserved
// Please do not remove this credit
