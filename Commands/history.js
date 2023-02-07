//Date/time Library
const dayjs = require('dayjs');

//Library for building new constructs.
const {SlashCommandBuilder} = require('@discordjs/builders');

//Export module, allows code to be run from another file.
module.exports = {
  //Data allowing our slash command to be registered when our bot starts.
  data: new SlashCommandBuilder()
  .setName('history')
  .setDescription('Display your activity history.'),

  //Code to be run when an interaction is receieved.
  async execute(vars) {
    //Initialize variables from vars input.
    var interaction = vars.interaction;
    var EmbedBuilder = vars.EmbedBuilder;
    var colorConfig = vars.colorConfig;

    //Functions
    function getTimestampMin(timestamp) {
      return (Math.floor(timestamp / 60000) + 1) * 60000;
    }

    function getTimestampHour(timestamp) {
      //return (Math.floor(timestamp / 3600000) + 1) * 3600000; //Remove +1 somehow to void rounding
      return Math.floor(timestamp / 3600000) * 3600000;
    }

    function getLastNHours(n) {
      var hours = [];
      for (i=(3600000*n);i>=3600000;i-=3600000) {
        hours.push(getTimestampHour(Date.now() - i));
      }
      return hours;
    }

    function presenceFormat(presence) {
      if (presence == 'online') return ':green_square:';
      if (presence == 'idle') return ':yellow_square:';
      if (presence == 'dnd') return ':red_square:';
      return ':black_large_square:'
    }

    //Open database.
    const sqlite3 = require('sqlite3').verbose();
    let activityDB = new sqlite3.Database('./databases/userActivity.db', sqlite3.OPEN_READWRITE, (err) => {
      if (err) return console.error(err);
    });

    //Query past 24 hours of data.
    activityDB.all(`SELECT * FROM activity_log WHERE user_id = ? ORDER BY timestamp ASC;`, [interaction.member.id], async function(err, rows) { //Date.now() - 97200
      if (err) return console.error(err);
      if (!rows || rows.length <= 0) return await interaction.reply({embeds: [new EmbedBuilder().setColor(colorConfig.error).setDescription("No tracking data avalible for this user.")]});
      var statuses = {};
      for (i = 0; i < rows.length; i++) {
        let minute = getTimestampMin(rows[i].timestamp);
        //while loop to fill in until next timestamp V
        var finalMin;
        if (rows.length > i + 1) {
          finalMin = rows[i + 1].timestamp;
        } else {
          finalMin = getTimestampMin(Date.now());
        }
        while (minute < finalMin) {
          statuses[minute] = {presence: rows[i].presence, status: rows[i].status, devices: [rows[i].mobile, rows[i].desktop, rows[i].web]};
          minute += 60000;
        }
      }
      //Close database.
      activityDB.close((err) => {
        if (err) return console.log(err);
        replyToInteraction(statuses);
      });
    });

    function replyToInteraction(statuses) {
      var hourlyStatuses = {};
      var statusKeys = Object.keys(statuses).sort();
      var hours = getLastNHours(24);
      var hourIndex = 0;
      var curHour = hours[0];
      var nextHour = hours[1];
      for (i=0;i<statusKeys.length;i++) {
        if (statusKeys[i] < curHour) continue;
        if (statusKeys[i] >= nextHour) {
          hourIndex++;
          curHour = hours[hourIndex];
          nextHour = hours[hourIndex+1];
        }
        if (!hourlyStatuses[curHour]) hourlyStatuses[curHour] = [];
        hourlyStatuses[curHour].push(statuses[statusKeys[i]]);
      }

      var averagedHourlyStatuses = {};
      var hourKeys = Object.keys(hourlyStatuses).sort();
      for (i=0;i<hourKeys.length;i++) {
          let onlineTally=0,awayTally=0,dndTally=0,offlineTally=0;
          hourlyStatuses[hourKeys[i]].forEach(status => {
            if (status.presence == 'online') onlineTally++;
            if (status.presence == 'idle') awayTally++;
            if (status.presence == 'dnd') dndTally++;
            if (status.presence == 'offline') offlineTally++;
          });
          let averagePresence;
          let maxTally = Math.max(onlineTally, awayTally, dndTally, offlineTally);
          if (offlineTally == maxTally) averagePresence = 'offline';
          if (dndTally == maxTally) averagePresence = 'dnd';
          if (awayTally == maxTally) averagePresence = 'idle';
          if (onlineTally == maxTally) averagePresence = 'online';
          averagedHourlyStatuses[hourKeys[i]] = {hourString: new dayjs(parseInt(hourKeys[i])).format('h a'), presence: averagePresence};
      }

      var content = '';
      Object.values(averagedHourlyStatuses).forEach(hour => {
        content += `${presenceFormat(hour.presence)} - ${hour.hourString}\n`;
      });

      //Make averagedHourlyStatuses into this:
      /*
        1pm: :green_circle:
        2pm: :yellow_circle:
        ...
      */

      var embed = new EmbedBuilder()
      .setTitle('Activity in the past 24hr:')
      .setAuthor({name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL()})
      .setColor(colorConfig.history)
      .addFields(
        {name: `Presence (ET):`, value: content, inline: true},
      );
      interaction.reply({embeds: [embed], emphemeral: false});
    }
  }
}
