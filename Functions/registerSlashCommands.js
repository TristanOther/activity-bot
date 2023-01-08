//Packages needed to register slash commands.
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
//File system library.
const fs = require('fs');

//Lets us call our code from another file.
exports.run = async (client, CLIENT_ID, GUILD_ID, BOT_TOKEN, DEV_MODE) => {
  //Intialize our rest api declared above with our token.
  const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

  //Initialize commands for slash commands from our slash command directory.
  const commands = [];
  const commandFiles = fs.readdirSync('./Commands').filter(file => file.endsWith('.js'));

  //For each file in our slash command files directory.
  for (const file of commandFiles) {
    //Initializes this file's module.
    const command = require(`../Commands/${file}`);
    //Pushes this file's data to our commands array.
    commands.push(command.data.toJSON());
    //Adds this command to our commands collection for responding later.
    client.commands.set(command.data.name, command);
  }

  //Register slash commands to our guild ID.
  (async () => {
      //Try catch just prevents bs crashes.
      try {
        //Logs a message to console to alert you when slash command start to be registered.
        console.log(`Started refreshing application (/) commands.`);
        //Registers commands.
        if (DEV_MODE) {
          await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
          );
        } else {
          await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands },
          );
        }
        //Logs a message to console when this guild's commands are successfully registered.
        console.log(`Successfully reloaded application (/) commands.`);
      } catch (error) {
        //Logs the error.
        console.error(error);
      }
  })();
}