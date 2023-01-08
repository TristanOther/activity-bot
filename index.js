//=========
//Constants
//=========

//************************
//BOT DEV/PROD MODE switch
//************************
const DEV_MODE = true;
//************************
//BOT DEV/PROD MODE switch
//************************

//File system library
const fs = require('fs');
//Token for logging the bot into Discord.
const BOT_TOKEN = fs.readFileSync('./token.txt', 'utf8').toString();
//Import discord.js
const {Client, Collection, GatewayIntentBits, ActivityType, EmbedBuilder} = require('discord.js');
//Initialize our bot client with intents.
const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildPresences
] });
//Create a collection of client commands.
client.commands = new Collection();
//The bot's ID.
const CLIENT_ID = '1061463758007963758';
//The ID of the test server.
const GUILD_ID = '404033480368979971';
//Our color config file.
const COLOR_CONFIG = JSON.parse(fs.readFileSync('./colorConfig.json', 'utf8'));
//Our cache of tracked users.
const trackedUsers = [];

//======
//Events
//======
//Ready
client.on('ready', () => {
  //Set bot status.
  client.user.setPresence({activities: [{name: 'Everything, everywhere, all at once.', type: ActivityType.Watching}], status: 'online'});
  //Initialize commands.
  try {
    const regSlash = require('./Functions/registerSlashCommands.js');
    regSlash.run(client, CLIENT_ID, GUILD_ID, BOT_TOKEN, DEV_MODE);
  } catch (err) {
    return console.error(err);
  }
  //Log a message to confirm bot is online.
  console.log('Big brother is watching.');

  //Open our database.
  const sqlite3 = require('sqlite3').verbose();
  let activityDB = new sqlite3.Database('./databases/userActivity.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err);
  });
  //Load tracked users into cache.
  activityDB.all('SELECT user_id FROM users WHERE tracking_enabled = 1;', function(err, rows) {
    if (err) return console.error(err);
    if (rows.length > 0) {
      rows.forEach(row => {
        trackedUsers.push(row.user_id);
      });
    }
    //Close database.
    activityDB.close((err) => {
      if (err) return console.log(err);
    });
  });
});

//PresenceUpdate
client.on('presenceUpdate', (oldPresence, newPresence) => {
  //If we're not tracking this user don't log data.
  if (!trackedUsers.includes(newPresence.user.id)) return;
  //Define the user's status.
  var status = "offline";
  if (newPresence.status) status = newPresence.status;
  //Open our database.
  const sqlite3 = require('sqlite3').verbose();
  let activityDB = new sqlite3.Database('./databases/userActivity.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err);
  });
  //Log user's status to database.
  activityDB.run('CREATE TABLE IF NOT EXISTS activity_log(user_id TEXT NOT NULL, status TEXT NOT NULL CHECK(status = "online" OR status = "idle" OR status = "dnd" OR status = "offline"), timestamp TEXT NOT NULL);', function(err) {
    if (err) return console.error(err);
    activityDB.run('INSERT INTO activity_log(user_id, status, timestamp) VALUES(?, ?, ?);', [newPresence.user.id, status, Date.now()], function(err) {
      if (err) return console.error(err);
      //Close database.
      activityDB.close((err) => {
        if (err) return console.log(err);
      });
    });
  });
});

//Interaction
client.on('interactionCreate', async (interaction) => {
  //If interaction is not a command (no buttons or anything at present) return;
  if (!interaction.isCommand()) return;

  var vars = {
    client: client,
    interaction: interaction,
    colorConfig: COLOR_CONFIG,
    EmbedBuilder: EmbedBuilder
  };

  try {
    const command = client.commands.get(interaction.commandName);
    await command.execute(vars);
  } catch (err) {
    interaction.reply({content: "`ERROR: COMMAND NOT FOUND.`"});
    return console.error(err);
  }
});

//Connect bot to Discord.
client.login(BOT_TOKEN);