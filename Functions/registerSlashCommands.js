const fs = require('fs'); //Node file system library.
const { REST } = require('@discordjs/rest'); //Discord's REST API.
const { Routes } = require('discord-api-types/v9'); //Discord API types library.

//Lets us call our code from another file.
exports.run = async (client, CLIENT_ID, GUILD_ID, BOT_TOKEN, DEV_MODE) => {
  const rest = new REST({ version: '10' }).setToken(BOT_TOKEN); //Initialize the REST API.
  const commands = []; //Cache for commands we're going to register.
  const commandFiles = fs.readdirSync('./Commands').filter(file => file.endsWith('.js')); //Collection of js file names in our commands folder.

  //Cache every command in our commands folder.
  for (const file of commandFiles) {
    const command = require(`../Commands/${file}`); //Fetch the command based on it's file name.
    commands.push(command.data.toJSON()); //Add command to our local cache for registering.
    client.commands.set(command.data.name, command); //Add command to our client's commands collection so we can respond to interactions.
  }

  //Register slash commands with Discord API.
  (async () => {
      try {
        console.log(`Started refreshing application (/) commands.`);
        //If in dev mode, register cached commands to the dev server, otherwise globally.
        if (DEV_MODE) {
          await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            {body: commands}
          );
        } else {
          await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            {body: commands}
          );
        }
        console.log(`Successfully reloaded application (/) commands.`);
      } catch (error) {
        console.error(error);
      }
  })();
}
