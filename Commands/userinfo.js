//Library for building new constructs.
const {SlashCommandBuilder} = require('@discordjs/builders');

//Export module, allows code to be run from another file.
module.exports = {
  //Data allowing our slash command to be registered when our bot starts.
  data: new SlashCommandBuilder()
  .setName('userinfo')
  .setDescription('Display info about user (default: yourself).'),

  //Code to be run when an interaction is receieved.
  async execute(vars) {
    //Initialize variables from vars input.
    var interaction = vars.interaction;
    var EmbedBuilder = vars.EmbedBuilder;
    var colorConfig = vars.colorConfig;

    //Open database.
    const sqlite3 = require('sqlite3').verbose();
    let activityDB = new sqlite3.Database('./databases/userActivity.db', sqlite3.OPEN_READWRITE, (err) => {
      if (err) return console.error(err);
    });

    //Query user timezone.
    activityDB.all(``)

    //Create userinfo embed.
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

    //Reply to interaction with our embed.
    interaction.reply({embeds: [embed], ephemeral: false});
  }
}
