const cfg = require('./config.json');
require("dotenv").config();
const DEBUG = (cfg.debug || process.env.NODE_ENV != "production");

if (DEBUG) {
  console.log('Debug mode');
}

const OWOTjs = require('owot-js');
const sqlite3 = require('sqlite3');
const crypto = require('crypto');

const filename = cfg.debug ? 'main.db' : 'debug.db';
const db = new sqlite3.Database(filename);
console.log(`using ${filename}`);

const fs = require('fs')

const denials = require('./denials.json');

let incrementalConnId = 1;
let worldReceivingGlobal = null;

/**
* @typedef {object} ChatsLoggedStats
* @property {number} page:
* @property {number} global
*/

/**
 * @typedef {object} OWOTMessage
 * @property {kind} {string}
 * @property {nickname} {string}
 * @property {realUsername} {string}
 * @property {id} {number}
 * @property {message} {string}
 * @property {registered} {boolean}
 * @property {location} {string}
 * @property {op} {boolean}
 * @property {admin} {boolean}
 * @property {staff} {boolean}
 * @property {color} {string},
 * @property {date} {number}
 */

/**
 * @type {Array<{bot: OWOTjs.Client, world: string, id: number, allowGlobal: boolean, connStart: Date, chatsLogged: ChatsLoggedStats}>}
 */
var bots = {};

function isSelfMessage(connData, m) {
  return m["id"] == connData.bot.player.id;
}

function log_message(connData, json, world) {
  metadata = {
    msg_json_sha256: crypto.createHash('sha256')
      .update(json)
      .digest('base64'),
    sent_by_bot: isSelfMessage(connData, json)
  }

  db.run(`INSERT INTO msg (msg_json, metadata_json, world) VALUES(?,?,?)`,
    [JSON.stringify(JSON.parse(json)), JSON.stringify(metadata), world]);
}

function reassignGlobalChatReceiver() {
  console.log(`Redesignating global chat receiver`)
  worldReceivingGlobal = null;
  let newGlobalReceiver = bots[Math.ceil(Math.random() * Object.keys(bots).length)];
  bots[newGlobalReceiver].connData.allowGlobal = true;
  worldReceivingGlobal = newGlobalReceiver;
  console.log(`Redesignated connection to '${world}' as receiver of global chat`);
}

function fileSizeInBytes(filename) {
  return fs.statSync(filename)["size"];
}

/** @namespace */
let cmd = {
  size(connData, m) {
    let response = ``;
    if (m["privateMessage"] == "to_me") {
      response += `/tell ${m["id"]}`;
    }
    response += `total size: ${fileSizeInBytes(filename) / 1000000.0} MB`;
    db.all("select count(*) from msg", (err, rows) => {
      response += ` | ${rows[0]['count(*)']} messages`;
      connData.bot.chat.send(response, (m["location"]=="global"));
    });
  }
}

function isValidCmd(m) {
  return Object.keys(cmd).includes(m["message"].split(" ")[1]);
}

function createDenialMessage(m) {
  let denial = ``;
  if (m["privateMessage"] == "to_me") {
    denial += `/tell ${m["id"]} `;
  }

  if (messages[m["realUsername"]]) {
    return denial + denials.byUsername[m["realUsername"]];
  } 
  return denial + denials.generic[Math.ceil(Math.random() * denials.length)];
}

let canSendDenyMessage = true;

function denyMessage(connData, m) {
  if (!canSendDenyMessage) {
    return;
  }
  canSendDenyMessage = false;
  setTimeout(() => { canSendDenyMessage = true }, 8000);

  connData.bot.chat.send(
    createDenialMessage(m), (m["location"] == "global")
  );
}

function processCmds(connData, m) {
  /*
   * TODO: figure out what's causing
   * cfg.trustedUsers.includes(m["realusername"])
   * to go weird and deny everyone from running
   * chatbot commands, even lemuria
   * 
   * hardcoded for now because i'm the only
   * person the chatbot will ever trust for
   * a long, long while.
   */
  if (!isValidCmd(m)) {
    return;
  }
  if (m["realUsername"] == "lemuria") {
    if (m["message"] == `ch size`) {
      cmd.size(connData, m);
    }
  } else {
    denyMessage(connData, m)
  }
  return;
}

function initWorldConn(world) {
  let allowGlobal = false;
  if (!worldReceivingGlobal && world != '') {
    console.log(`Designated connection to '${world}' as receiver of global chat`);
    worldReceivingGlobal = world;
    allowGlobal = true;
  }

  let connData = {
    bot: new OWOTjs.Client({ "world": world, hide: true }),
    world: world,
    id: incrementalConnId,
    allowGlobal: allowGlobal,
    connStart: new Date(),
    chatsLogged: {
      page: 0,
      global: 0
    }
  };
  incrementalConnId++;

  connData.bot.on("join", () => {
    console.log(`chat logger started - world \'${world}\' - so far ${connData.id} connections`);
  });

  connData.bot.on("chat", (m) => {
    connData.chatsLogged[m["location"]]++;

    if (m["location"] == "global" && connData.allowGlobal == false) {
      return;
    }
    if (m["message"].startsWith(`ch `)) {
      processCmds(connData, m);
    }

    console.log(`${world} ${isSelfMessage(connData, m) ? '- SELF -' : ''} ${JSON.stringify(m)}`);
    log_message(connData, JSON.stringify(m), '');
  });

  connData.bot.on("close", () => {
    if (connData.allowGlobal) {
      console.log(`connection to '${world}' lost, it was designated receiver of global chat`);
      reassignGlobalChatReceiver();
    }

    console.log(`reconnecting to ${world}`);
    console.log(`summary of conn: ${connData}`)
    initWorldConn(world);
  })

  console.log(`Joined '${world}'`);
  bots[world] = connData;
}

cfg.worlds.forEach(world => {
  let shouldReceiveGlobal = false;
  if (cfg.globalChatPolicy == "frontPageOnly" && world == '') {
    shouldReceiveGlobal = true;
  }

  initWorldConn(world);
})

console.log(`joined all the worlds`)
console.log(bots)
