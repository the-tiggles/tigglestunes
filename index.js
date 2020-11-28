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
//        -- Auto-Responses
//
// 4 - MUSIC
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



 

 
 
bot.login(process.env.BOT_TOKEN);