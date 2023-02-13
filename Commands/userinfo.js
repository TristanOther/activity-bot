const {SlashCommandBuilder} = require('@discordjs/builders'); //Library for building new slash commands.
const sqlite3 = require('sqlite3').verbose(); //Database library.

//Lets us call our code from another file.
module.exports = {
  //Data allowing our slash command to be registered when our bot starts.
  data: new SlashCommandBuilder()
  .setName('userinfo')
  .setDescription('Display info about user (default: yourself).'),

  //Code to be run when an interaction is receieved.
  async execute(vars) {
    //Fetch required variables from variable passthrough argument.
    var interaction = vars.interaction;
    var EmbedBuilder = vars.EmbedBuilder;
    var colorConfig = vars.colorConfig;

    //Open database.
    let activityDB = new sqlite3.Database('./databases/userActivity.db', sqlite3.OPEN_READWRITE, (err) => {
      if (err) return console.error(err);
    });

    //Query user timezone from users table.
    var timezone = 'UTC+0'; //Default to UTC+0 in case user has no configured timezone.
    activityDB.get(`SELECT * FROM users WHERE user_id = ?;`, [interaction.member.id], function(userData, err) {
      if (err) return console.error(err);


    });

    //Create userinfo embed and reply to interaction.
    var embed = new EmbedBuilder()
    .setAuthor({name: interaction.member.displayName, iconURL: interaction.user.displayAvatarURL()})
    .setColor(colorConfig.info)
    .addFields(
      {name: 'Username:', value: interaction.user.tag, inline: true},
      {name: 'User ID:', value: interaction.user.id, inline: true},
      {name: 'Server Nickname:', value: interaction.member.displayName, inline: true},
      {name: 'Account Created:', value: interaction.member.joinedAt, inline: true},
      {name: 'Joined Server:', value: interaction.user.createdAd, inline: true},
      {name: 'User Timezone:', value: "", inline: true},
    )
    .setFooter({text: 'Set your timezone with `/timezone` command.'});
    interaction.reply({embeds: [embed], ephemeral: false});
  }
}
