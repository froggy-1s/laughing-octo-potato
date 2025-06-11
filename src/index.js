const bedrock = require("bedrock-protocol");
const { v4: uuidv4 } = require('uuid');

const usernames = ["first", "second", "third", 'forth', 'pixel', 'fifth', 'sixth', 'timedout'];
const clients = new Map();
const HOST = "donutsmp.net";
const PORT = 19132;
const MAX_AFK_INDEX = 64;

const sendCommand = (client, command) => {
  client.queue("command_request", {
    command,
    origin: { type: "Player", uuid: uuidv4(), request_id: "" },
    interval: false,
    version: 52,
  });
};

const handleText = (client, username) => (packet) => {
  const state = clients.get(username);
  if (!state.isSearching) return;

  const message = packet.message;
  if (message.includes("Unfortunately this region is full")) {
    state.currentAfkIndex++;
    if (state.currentAfkIndex < MAX_AFK_INDEX) {
      setTimeout(() => {
        sendCommand(client, `/afk ${state.currentAfkIndex}`);
      }, 2000);
    } else {
      state.isSearching = false;
    }
  } else {
    state.isSearching = false;
  }
};

const handleJoin = (client, username) => () => {
  const state = clients.get(username);
  state.isSearching = true;
  state.currentAfkIndex = 0;
  console.log(`[#] ${client.username} joined.`)
  setTimeout(() => {
    if (username === "fifth") {
      sendCommand(client, `/home 1`);
      state.isSearching = false; // Stop searching for AFK spots
    } else {
      sendCommand(client, `/afk ${state.currentAfkIndex}`);
    }
  }, 1000);
};

const connectClient = (username) => {
  clients.set(username, { currentAfkIndex: 0, isSearching: false });

  const client = bedrock.createClient({
    host: HOST,
    port: PORT,
    profilesFolder: `./bots/${username}`,
    offline: false,
  });

  client.on("join", handleJoin(client, username));
  client.on("text", handleText(client, username));
  client.on("disconnect", (packet) => console.log(`[${username}] Disconnected: ${client.username}`));
  client.on("error", (err) => {
    if (!err.message?.includes("Invalid tag") || !err.message.includes("block_entity_data")) {
      console.log(`[${username}] Error:`, err.message || err);
    }
  });

  clients.get(username).client = client;
};

console.log(`[SYSTEM] Starting ${usernames.length} clients...`);
usernames.forEach(connectClient);

const gracefulExit = () => {
  console.log("[SYSTEM] Exiting, disconnecting clients...");
  clients.forEach(({ client }, username) => client?.disconnect && client.disconnect());
  process.exit(0);
};

process.on('SIGINT', gracefulExit);
process.on('SIGTERM', gracefulExit);
