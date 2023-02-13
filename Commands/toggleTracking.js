const {SlashCommandBuilder} = require('@discordjs/builders'); //Library for building new slash commands.
const sqlite3 = require('sqlite3').verbose(); //Database library.

//Lets us call our code from another file.
module.exports = {
  //Data allowing our slash command to be registered when our bot starts.
  data: new SlashCommandBuilder()
  .setName('toggletracking')
  .setDescription('Enable/disable user activity tracking (disabled by default).'),

  //Code to be run when an interaction is receieved.
  async execute(vars) {
    //Open our database.
    let activityDB = new sqlite3.Database('./databases/userActivity.db', sqlite3.OPEN_READWRITE, (err) => {
      if (err) return console.error(err);
    });

    //Fetch required variables from variable passthrough argument.
    var interaction = vars.interaction;
    var EmbedBuilder = vars.EmbedBuilder;
    var colorConfig = vars.colorConfig;
    var trackingState = 1;

    //Query to see if user is already in the table.
    activityDB.get('SELECT * FROM users WHERE user_id = ?;', [interaction.member.id], function(err, userData) {
      if (err) return console.error(err);
      //If no row found, create one for the user with tracking enabled, otherwise invert the current tracking setting.
      if (userData == null || userData == undefined) {
        activityDB.run('INSERT INTO users(user_id, tracking_enabled) VALUES(?, ?);', [interaction.member.id, 0, 0, trackingState], function (err) {
          if (err) return console.error(err);
          sendEmbed(trackingState); //Call function to reply to interaction.
        });
      } else {
        trackingState = userData.tracking_enabled ? 0 : 1; //Invert existing tracking state.
        activityDB.run('UPDATE users SET tracking_enabled = ? WHERE user_id = ?;', [trackingState, interaction.member.id], function (err) {
          if (err) return console.error(err);
          sendEmbed(trackingState); //Call function to reply to interaction.
        });
      }
    });

    //Function for constructing our embed and replying to the interaction.
    async function sendEmbed(trackingState) {
      //Create embed.
      var embed = new EmbedBuilder()
      .setTitle(`Tracking ${trackingState ? "enabled" : "disabled"}:`)
      .setDescription(`Tracking ${trackingState ? "enabled" : "disabled"} for user ${interaction.member.displayName}.`)
      .setColor(colorConfig.tracking)
      .setFooter({text: 'By enabling tracking you agree to have presence data stored by this bot. To opt out of this data storage, simply disable tracking.'});

      //Close database.
      activityDB.close((err) => {
        if (err) return console.log(err);
      });

      //Reply to interaction.
      await interaction.reply({embeds: [embed], ephemeral: false});
    }
  }
}
