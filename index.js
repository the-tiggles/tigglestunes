/**
 *
 * TigglesBot
 * link https://github.com/tiggaaaaah/TigglesBot
 * Design/Dev: Tiggles 
 *
 */




 // ================================
//  Index
// ================================
//
// 0 - DEPENDENCIES
// 
// 1 - START-UP & STATUS
//
// 2 - COMMANDS
//
// 3 - MUSIC
//
//
//
//


// ================================
//  0 - Dependencies
// ================================
const express = require('express');
const path = require('path');

const Discord = require("discord.js");
var bot = new Discord.Client({ disableMentions: 'everyone' });
var botconfig = require("./botconfig.json");


var app = express();
var fs = require("fs"); //require a file system
const http = require("http");


var purple = botconfig.purple;

// this will give the bot the ability to be 'live' and ping-able

let port = process.env.PORT;

app.use(express.static('site'))

app.get('/', function(req, res) {
  res.sendFile('./site/index.html', {root: __dirname });
})
app.get('/about', function(req, res) {
  res.sendFile('./site/about.html', {root: __dirname });
})
app.listen(port);


bot.commands = new Discord.Collection();
//this will boot up the bot and load the commands in the folder
fs.readdir("./commands/", (err, files) => {
  if (err) console.log(err);
  //'f' is for file
  let jsfile = files.filter(f => f.split(".").pop() === "js")
  if (jsfile.length <= 0) {
    console.log("Couldn't find commands.");
    return
  }
  console.group("Commands");
  jsfile.forEach((f, i) => {
    let props = require(`./commands/${f}`);
    console.log(`${f}`);
    bot.commands.set(props.help.name, props);
  });
  console.groupEnd();
});

// ================================
//  1 - Start-up & Status
// ================================


bot.on("ready", async () => {
  console.log(`${bot.user.username}: ONLINE (${bot.guilds.cache.size})!`);
  bot.user.setUsername("TiggieTunes");
  bot.user.setPresence({
    activity: {
      name: 'the chillest, illest tunes'
    },
    status: 'online'
  })
  .catch(console.error);
});


bot.on('warn', console.warn);
bot.on('error', console.error);
bot.on('disconnect', () => console.log('I just disconnected, making sure you know, I will reconnect now...'));
bot.on('reconnecting', () => console.log('I am reconnecting now!'));



// ================================
//  2 - Commands
// ================================

bot.on("message", async message => {
  if (message.author.bot) return;
  if (message.channel.type === "dm") {
    //Reply to the user via DM.
    message.reply("I'll ask for you. One Moment.");
    //This logs the message to the console.
    console.log('\x1b[42m%s\x1b[0m', `(BotPM) ${message.author.username}: ${message.content}`); 
    //This get the user by their ID and assigns it to a variable.
    let userid = bot.users.cache.get("320721242833289229"); 
    //Send the username and message content to the user
    return userid.send(`(BotPM) ${message.author.username}: ${message.content}`); 
  }
  // eyes everywhere
  console.log(`[ ${message.guild} | ${message.channel.name} ] ${message.author.username}: ${message.content}`);
  let prefixes = JSON.parse(fs.readFileSync("./prefixes.json", "utf8"));
  if(!prefixes[message.guild.id]) {
   prefixes[message.guild.id] = {
     prefixes: botconfig.prefix
   };
  }
  let prefix = prefixes[message.guild.id].prefixes;  
  let messageArray = message.content.split(" ");
  let cmd = messageArray[0];
  let args = messageArray.slice(1);
  if(prefix == cmd.slice(0,1)){
    let commandfile = bot.commands.get(cmd.slice(prefix.length));
    if (commandfile) commandfile.run(bot, message, args);
  };
});



// ================================
//  2 - Music
// ================================

const YTDL = require("ytdl-core");
const YouTube = require('simple-youtube-api');
const youtube = new YouTube(process.env.YOUTUBE);
const queue = new Map();
const Util = require('discord.js');

var servers = {};



bot.on("message", async msg => {


  // let args = messageArray.slice(1);
  if (msg.author.bot) return;
  if (msg.content.substring(0, 1) == "?") {
    // var args = msg.content.substring(1).split('');
    // var cmd = args[0];
    let messageArray = msg.content.split(" ");
    let cmd = messageArray[0].slice(1);
    let args = messageArray.slice(1);
        
    // args = args.splice(1);

    const searchString = args.slice(0).join(' ');
    const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
    const serverQueue = queue.get(msg.guild.id);
    
    switch (cmd) { 
      case "play":
      case "p":
        const voiceChannel = msg.member.voiceChannel;
        if (!args[1]) {
          msg.channel.send("Please provide a link");
          return;
        }
        if (!msg.member.voiceChannel) {
          msg.channel.send("You gotsta be in a voice channel, homie.");
          return;
        }
        if(!servers[msg.guild.id]) servers[msg.guild.id] = {
          queue: []
        };
        var server = servers[msg.guild.id];
        server.queue.push(args[1]);
        if (!msg.guild.voiceConnection) msg.member.voiceChannel.join().then(function(connection) {
          play(connection, msg);
        });
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
          const playlist = await youtube.getPlaylist(url);
          const videos = await playlist.getVideos();
          for (const video of Object.values(videos)) {
            const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
            await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
          }
          return msg.channel.send(`✅ Playlist: **${playlist.title}** has been added to the queue!`);
        } else {
          try {
            var video = await youtube.getVideo(url);
          } catch (error) {
            try {
              var videos = await youtube.searchVideos(searchString, 10);
              let index = 0;
              let theOptions = `
              __**Song selection:**__
${videos.map(video2 => `**${++index} -** ${video2.title}`).join('\n')}
Please provide a value to select one of the search results ranging from 1-10.`;
              msg.channel.send(theOptions).then(theOptions => {theOptions.delete(10000)});
            // eslint-disable-next-line max-depth
              try {
                var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
                  maxMatches: 1,
                  time: 10000,
                  errors: ['time']
                });
                response.delete();
              } catch (err) {
                console.error(err);
                return msg.channel.send('no or invalid value entered, cancelling video selection.');
              }
              const videoIndex = parseInt (response.first().content);
              var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
            } catch (err) {
              console.error(err);
              return msg.channel.send("woof. I couldn't obtain any search results.");
            }
          }
          return handleVideo(video, msg, voiceChannel);
        }
        break;
      case "skip": 
        if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!');
        if (!serverQueue) return msg.channel.send('There is nothing playing that I could skip for you.');
        serverQueue.connection.dispatcher.end('Skip command has been used!');
        break;
      case "next": 
        if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!');
        if (!serverQueue) return msg.channel.send('There is nothing playing that I could skip for you.');
        serverQueue.connection.dispatcher.end('Skip command has been used!');
        break;
      case "stop":
      case "stop":
        var server = servers[msg.guild.id];
        if (msg.guild.voiceConnection) msg.guild.voiceConnection.disconnect();
        break;
      case "np" :
        if (!serverQueue) return msg.channel.send("there is nothing playing.");
        return msg.channel.send(`🎶 Now playing: **${serverQueue.songs[0].title}**`);
        break;
      case "q":
      case "q":
        let theQueue = `
        __🎶**Song queue:**🎶__ 
${serverQueue.songs.map(song =>`**-** ${song.title}`).join('\n')}
➡️**Now playing:** ${serverQueue.songs[0].title}`;
        if (!serverQueue) return msg.channel.send('There is nothing playing.');
        return msg.channel.send(theQueue).then(theQueue => {theQueue.delete(10000)});
      case "pause":
        if (serverQueue && serverQueue.playing) {
          serverQueue.playing = false;
          serverQueue.connection.dispatcher.pause();
          return msg.channel.send("⏸ Paused the Tunes");
        }
        return msg.channel.send("There is nothing playing.");
        break;
      case "resume":
        if (serverQueue && !serverQueue.playing) {
          serverQueue.playing = true;
          serverQueue.connection.dispatcher.resume();
          return msg.channel.send("▶️ Resumed the Tunes");
        }
        return msg.channel.send("There is nothing playing.");
        break;
        
      
    }
  }
  // console.log(prefix);
  
  // eyes everywhere
  console.log(`[ ${msg.guild} | ${msg.channel.name} ] ${msg.author.username}: ${msg.content}`);
  
  
  if (msg.channel.type === "dm") {
    msg.reply("lemme ask for you"); 
    console.log('\x1b[42m%s\x1b[0m', `(BotPM) ${msg.author.username}: ${msg.content}`); 
    let userid = bot.users.get("320721242833289229"); 
    return userid.send(`(BotPM) ${msg.author.username}: ${msg.content}`); 
  }
  // console.log(searchString);
});


async function handleVideo(video, msg, voiceChannel, playlist = false) {
	const serverQueue = queue.get(msg.guild.id);
	// console.log(video);
	const song = {
		id: video.id,
		title: Util.escapeMarkdown(video.title),
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true
		};
		queue.set(msg.guild.id, queueConstruct);
		queueConstruct.songs.push(song);
		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			queue.delete(msg.guild.id);
			return msg.channel.send(`I could not join the voice channel: ${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		// console.log(serverQueue.songs);
		if (playlist) return undefined;
		else return msg.channel.send(`✅ **${song.title}** has been added to the queue!`).then(msg => {msg.delete(10000)})
	}
	return undefined;
}

function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
    setTimeout(function() {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
    }, 20000);
    return;
	}
	console.log(serverQueue.songs);
	const dispatcher = serverQueue.connection.playStream(YTDL(song.url))
		.on('end', reason => {
			if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
			else console.log(reason);
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
	serverQueue.textChannel.send(`🎶 Start playing: **${song.title}**`);
}






 

 
 
bot.login(process.env.BOT_TOKEN);