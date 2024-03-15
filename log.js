const OWOTjs = require('owot-js');
const sqlite3 = require('sqlite3');
const crypto = require('crypto');
const filename = 'main.db';
const db = new sqlite3.Database(filename);
const fs = require('fs')

const cfg = require('./config.json');

let incrementalConnId = 1;
let worldReceivingGlobal = null;

var bots = {};

function log_message(connData, json, world) {
  metadata = {
    msg_json_sha256: crypto.createHash('sha256')
      .update(json)
      .digest('base64'),
    sent_by_bot: json["id"] == connData.bot.player.id
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

let cmd = {
  size(connData, m) {
    let response = `total size: ${fileSizeInBytes(filename) / 1000000.0} MB`;
    db.all("select count(*) from msg", (err, rows) => {
      response += ` | ${rows[0]['count(*)']} messages`;
      connData.bot.chat.send(response, (m["location"]=="global"));
    });
  }
}

let canSendDenyMessage = true;

function denyMessage(connData, m) {
  if (!canSendDenyMessage) {
    return;
  }
  canSendDenyMessage = false;
  setTimeout(() => { canSendDenyMessage = true }, 8000);
  
  let messages = {
    "ultraleland7Ziggy": "Ziggy, fuck right off. Stop telling me what to do! Only Lemuria can!"
  };

  connData.bot.chat.send(
    messages[m.realUsername] ||
    "You shall not pass, nor shall you run this command!",
    (m["location"] == "global")
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

    console.log(`${world} ${JSON.stringify(m)}`);
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
