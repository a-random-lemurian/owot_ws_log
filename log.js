const OWOTjs = require('owot-js');
const sqlite3 = require('sqlite3');
const crypto = require('crypto');
const fs = require('fs')

const denials = require('./denials.json');

const cfg = require('./config.json');
require("dotenv").config();
const DEBUG = (cfg.debug || process.env.NODE_ENV != "production");
if (DEBUG) {
  console.log('Debug mode');
}
const filename = DEBUG ? 'debug.db' : 'main.db';
const db = new sqlite3.Database(filename);
console.log(`using ${filename}`);

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

let incrementalConnId = 1;
let worldReceivingGlobal = null;

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

/*
 * Cache the message count by incrementing it every time the bot gets a
 * message, so we only have to do an expensive database operation once in the
 * bot's entire lifetime.
 */

let messageCount = 0;
let messageCountChecked = false;

function getMessageCount(callback) {
  if (!messageCountChecked) {
    db.all("select count(*) from msg", (err, rows) => {
      messageCount = rows[0]['count(*)'];
      messageCountChecked = true;
      callback(rows[0]['count(*)']);
    });
  } else {
    callback(messageCount);
  }
}

/** @namespace */
let cmd = {
  size(connData, m) {
    let response = ``;
    if (m["privateMessage"] == "to_me" || isFrontPage(connData, m)) {
      response += `/tell ${m["id"]}`;
    }
    response += `total size: ${fileSizeInBytes(filename) / 1000000.0} MB`;
    getMessageCount((count) => {
      response += ` | ${count} messages`;
      connData.bot.chat.send(response, (m["location"]=="global"));
    })
  }
}

function isValidCmd(m) {
  return Object.keys(cmd).includes(m["message"].split(" ")[1]);
}

function isFrontPage(connData, m) {
  return (connData.world == '' && m["location"] == "page")
}

let canSendDenyMessage = true;

function denyMessage(connData, m) {
  if (!canSendDenyMessage) {
    return;
  }

  /*
   * Send denial messages through PMs on the front page because
   * of Poopman policy.
   */
  let pmString = ``;
  if (isFrontPage(connData, m)) {
    pmString += `/tell ${m["id"]} `
  }

  canSendDenyMessage = false;
  setTimeout(() => { canSendDenyMessage = true },
    cfg.denialMessageRateLimitSeconds || 8 * 1000);

  connData.bot.chat.send(
    pmString += createDenialMessage(m), (m["location"] == "global")
  );
}

function createDenialMessage(m) {
  let denial = ``;
  if (m["privateMessage"] == "to_me") {
    denial += `/tell ${m["id"]} `;
  }

  console.log(m, denials, m["realUsername"] in denials.byUsername)

  if (m["realUsername"] != '' && m["realUsername"] in denials.byUsername) {
    denial += denials.byUsername[m["realUsername"]];
  } else {
    denial += denials.generic[Math.ceil(Math.random() * denials.generic.length)];
  }
  return denial;
}

function processCmds(connData, m) {
  if (!isValidCmd(m)) {
    return;
  }
  if (cfg.trustedUsers.includes(m["realUsername"])) {
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

    messageCount++;

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
