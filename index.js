//=========
//Constants
//=========
const fs = require('fs'); //Node file system library.
const sqlite3 = require('sqlite3').verbose(); //Database library.
const BOT_TOKEN = fs.readFileSync('./token.txt', 'utf8').toString(); //API login token.
const {Client, Collection, GatewayIntentBits, ActivityType, EmbedBuilder} = require('discord.js'); //API.
const client = new Client({intents: [ //Initialize bot's client with required intents (data the API sends).
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildPresences
]});
client.commands = new Collection(); //Create a collection for our client's commands.
const CLIENT_ID = '1061463758007963758'; //The ID of the bot.
const GUILD_ID = '404033480368979971'; //The ID of the test server (for development mode command registration).
const COLOR_CONFIG = JSON.parse(fs.readFileSync('./colorConfig.json', 'utf8')); //Color config file (for embeds).
const trackedUsers = []; //Cache of tracked users.

//************************
//BOT DEV/PROD MODE switch
//************************
//When true:  commmands are registered in the test server (instantly).
//When false: commands are registered globally (takes around an hour).
const DEV_MODE = true;
//************************
//BOT DEV/PROD MODE switch
//************************

//========
// Events
//========
//Ready event (fires when client connects to Discord).
client.on('ready', () => {
  client.user.setPresence({activities: [{name: 'Everything, everywhere, all at once.', type: ActivityType.Watching}], status: 'online'}); //Set bot's status.
  //Initialize commands using externally stored function.
  try {
    const regSlash = require('./Functions/registerSlashCommands.js');
    regSlash.run(client, CLIENT_ID, GUILD_ID, BOT_TOKEN, DEV_MODE);
  } catch (err) {
    return console.error(err);
  }
  console.log('Big brother is watching.');
  //Open our database.
  let activityDB = new sqlite3.Database('./databases/userActivity.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err);
  });
  //Load tracked users from database into cache.
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

//PresenceUpdate event (fires when any aspect of a user's presence changes).
client.on('presenceUpdate', (oldPresence, newPresence) => {
  if (!trackedUsers.includes(newPresence.user.id)) return; //If we're not tracking this user don't log data.
  //Get the user's status.
  var status = "offline"; //Initialize to offline because sometimes Discord doesn't bother storing "offline" in the presence object.
  if (newPresence.status) status = newPresence.status; //If the presence object has a stored status, use that.
  //Get the user's connected devices.
  var devices = []; //Initialize list for stroing devices.
  if (newPresence.clientStatus) devices = Object.keys(newPresence.clientStatus); //If clientStatus is present in the presence object, grab devices. Keyed because for some reason clientStatus is an object of device types with individual statuses for each, despite them all being synchronized by design -_-
  //Open our database.
  let activityDB = new sqlite3.Database('./databases/userActivity.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err);
  });
  //Query for creating an activity log table if one doesn't exist.
  var activityTableCreation = 'CREATE TABLE IF NOT EXISTS activity_log(\
    user_id TEXT NOT NULL,\
    presence TEXT NOT NULL CHECK(presence = "online" OR presence = "idle" OR presence = "dnd" OR presence = "offline"),\
    status TEXT NOT NULL,\
    timestamp INTEGER NOT NULL,\
    mobile BOOLEAN NOT NULL CHECK(mobile IN (0, 1)),\
    desktop BOOLEAN NOT NULL CHECK(desktop IN (0, 1)),\
    web BOOLEAN NOT NULL CHECK(web IN (0, 1))\
  );';
  //SQL queries.
  var userTableCreation = 'CREATE TABLE IF NOT EXISTS users(\
    user_id UNIQUE TEXT PRIMARY KEY,\
    timezone_hour INTEGER DEFAULT 0,\
    timezone_minute INTEGER DEFAULT 0 CHECK(timezone_minute IN (0, 60)),\
    tracking_enabled BOOLEAN NOT NULL CHECK(tracking_enabled IN (0, 1))\
  );';
  //Create our users table if it doesn't exist.
  activityDB.run(userTableCreation, function(err) {
    if (err) return console.error(err);
  });
  //Create the activity log table if it doesn't exist.
  activityDB.run(activityTableCreation, function(err) {
    if (err) return console.error(err);
    //Log user's status to the activity log table with relevant info an timestamp.
    activityDB.run('INSERT INTO activity_log(user_id, presence, status, timestamp, mobile, desktop, web) VALUES(?, ?, ?, ?, ?, ?, ?);', [newPresence.user.id, status, "PLACEHOLDER", parseInt(Date.now()), devices.includes('mobile') ? 1 : 0, devices.includes('desktop') ? 1 : 0, devices.includes('web') ? 1 : 0], function(err) {
      if (err) return console.error(err);
      //Close database.
      activityDB.close((err) => {
        if (err) return console.log(err);
      });
    });
  });
});

//Interaction event (fires when client recieves an interaction).
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return; //If interaction is not a command (haven't yet implement buttons etc) return.
  //Create our variable passthrough object.
  var vars = {
    client: client,
    interaction: interaction,
    colorConfig: COLOR_CONFIG,
    EmbedBuilder: EmbedBuilder
  };
  const command = client.commands.get(interaction.commandName); //Fetch the interacted command from our client's command cache.
  //Run the interacted command if it exists.
  if (command) {
    try {
      await command.execute(vars);
    } catch (err) {
      interaction.reply({content: "`An error occured executing this command.`"});
      return console.error(err);
    }
  } else {
    interaction.reply({content: "`ERROR: COMMAND NOT FOUND.`"});
  }
});

client.login(BOT_TOKEN); //Connect bot to Discord API.


//NN   N  OOOOO  TTTTT  EEEEE  SSSSS
//N N  N  O   O    T    E      S
//N  N N  O   O    T    EEEE   SSSSS
//N   NN  O   O    T    E          S
//N    N  OOOOO    T    EEEEE  SSSSS

/*

*If two consecutive timestamped entries have the same status and array of 3 connected device booleans they're duplicates regardless of timestamp difference, because the connected devices update matching statuses at different rates.

*/

//TODO
/*

*Replace db.all calls with db.each for activity queries
*Build a way to display activity data.

*/
