const {SlashCommandBuilder} = require('@discordjs/builders'); //Library for building new slash commands.

//Lets us call our code from another file.
module.exports = {
  //Data allowing our slash command to be registered when our bot starts.
  data: new SlashCommandBuilder()
  .setName('info')
  .setDescription('Info about this bot.'),

  //Code to be run when an interaction is receieved.
  async execute(vars) {
    //Fetch required variables from variable passthrough argument.
    var interaction = vars.interaction;
    var EmbedBuilder = vars.EmbedBuilder;
    var colorConfig = vars.colorConfig;
    var client = vars.client;

    //Create info embed and fill in necessary data.
    var embed = new EmbedBuilder()
    .setTitle('Info about Activity Tracker')
    .setAuthor({name: client.user.tag, iconURL: client.user.displayAvatarURL()})
    .setColor(colorConfig.info)
    .addFields(
      {name: 'BETA:', value: 'Activity Tracker bot is currently in BETA release. Data loss may occur, and features may be added or modified at any time.'},
      {name: 'About:', value: 'The primary purpose of Activity Tracker bot is to allow users to track their Discord status over time. To get started, enable tracking with the /toggletracking command. From there, avalible presence data may be browsed for your own purposes.'},
      {name: 'Privacy Policy:', value: 'In order for Activity Tracker to function it must store presence data from participating users. By enabling tracking you agree to have presence data processed and stored by the Activity Tracker bot. This data is not encrypted or otherwise obfuscated, but is used solely for the function of this bot, and not viewed by any parties. By disabling tracking the bot ceases to collect presence data from a user, and stored user data may be deleted at the request of the user.'}
    );

    //Reply to interaction with our embed.
    interaction.reply({embeds: [embed], ephemeral: false});
  }
}
