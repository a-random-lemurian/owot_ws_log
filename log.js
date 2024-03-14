const OWOTjs = require('owot-js');
const sqlite3 = require('sqlite3');
const crypto = require('crypto');
const filename = 'main.db';
const db = new sqlite3.Database(filename);

const cfg = require('./config.json')

let incrementalConnId = 1;
var bots = {};

function log_message(json, world) {
  metadata = {
    msg_json_sha256: crypto.createHash('sha256')
      .update(json)
      .digest('base64')
  }

  db.run(`INSERT INTO msg (msg_json, metadata_json, world) VALUES(?,?,?)`,
    [JSON.stringify(JSON.parse(json)), JSON.stringify(metadata), world]);
}

function initWorldConn(world, allowGlobal)
{
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
    log_message(JSON.stringify(m), '');
  });

  connData.bot.on("close", () => {
    console.log(`reconnecting to ${world}`);
    console.log(`summary of conn: ${connData}`)
    initWorldConn(world);
  })

  console.log(`Joined '${world}'`);
  bots[world] = connData;
}

cfg.worlds.forEach(world => {
  let = shouldReceiveGlobal = false;
  if (cfg.globalChatPolicy == "frontPageOnly" && world == '') {
    shouldReceiveGlobal = true;
  }

  initWorldConn(world, shouldReceiveGlobal);
})

console.log(`joined all the worlds`)
console.log(bots)
