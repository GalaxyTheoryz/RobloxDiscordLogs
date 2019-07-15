const { Client, RichEmbed } = require('discord.js');
const client = new Client();
// const auth = require('./auth.json');
// const db = require('quick.db');

let guild;
let categorychannel;
let fulllogchannel;

client.on('ready', () => {
	const date = new Date(client.readyTimestamp);
	console.log(date);
	console.log(`Logged in as ${client.user.tag}!`);
	guild = client.guilds.get(process.env.GUILD_ID);
	categorychannel = guild && guild.channels.get(process.env.CATEGORY_ID);
	fulllogchannel = guild && guild.channels.get(process.env.FULL_LOG_ID);
	if (categorychannel && fulllogchannel) {
		console.log('Found guild');
	} else {
		console.error('Couldn\'t find guild');
	}
	// console.log(LogChannel);
});

const messagequeue = new Map();
const commandqueue = new Map();
const channels = new Map();
const isServerNumFree = function(num) {
	return !messagequeue.has(num);
};
const addServer = function() {
	let newservernum;
	// console.log(messagequeue.size);
	let i = 1;
	while (!newservernum) {
		if (isServerNumFree(i)) {
			newservernum = i;
		}
		i = i + 1;
	}
	messagequeue.set(newservernum, []);
	commandqueue.set(newservernum, []);
	const channeldata = new Object();
	channeldata.type = 'text';
	channeldata.parent = categorychannel;
	guild.createChannel('Server' + newservernum, channeldata).then((newchannel => {
		channels.set(newservernum, newchannel);
	}));
	console.log('New server: ' + newservernum);
	return newservernum;
};

const findServerFromChannel = function(channel) {
	for (const [key, value] of channels) {
		// console.log(value);
		// console.log('comparing to');
		// console.log(channel);
		if (value == channel) {
			return key;
		}
	}
};

// start - messageReaction
/* only for emoji adds, but we don't do anything with those (yet)
client.on('raw', async event => {
	if (!events.hasOwnProperty(event.t)) return;
	// console.log('raw event');

	const { d: data } = event;
	const user = client.users.get(data.user_id);
	const channel = client.channels.get(data.channel_id) || await user.createDM();

	// if (channel.messages.has(data.message_id)) return;

	const message = await channel.fetchMessage(data.message_id);
	const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
	let reaction = message.reactions.get(emojiKey);

	if (!reaction) {
		// Create an object that can be passed through the event like normal
		const emoji = new Emoji(client.guilds.get(data.guild_id), data.emoji);
		reaction = new MessageReaction(message, emoji, 1, data.user_id === client.user.id);
	}

	// console.log(events[event.t]);
	client.emit(events[event.t], reaction, user);

	/* new way using discordjs.guide
	if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
	// Grab the channel to check the message from
	const channel = client.channels.get(packet.d.channel_id);
	if (!channel) return console.log('Channel not found');
	// There's no need to emit if the message is cached, because the event will fire anyway for that
	if (channel.messages.has(packet.d.message_id)) return;
	// Since we have confirmed the message is not cached, let's fetch it
	channel.fetchMessage(packet.d.message_id).then(message => {
		// Emojis can have identifiers of name:id format, so we have to account for that case as well
		const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
		// This gives us the reaction we need to emit the event properly, in top of the message object
		const reaction = message.reactions.get(emoji);
		// Adds the currently reacting user to the reaction's users collection.
		if (reaction) reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));
		// Check which type of event it is before emitting
		if (packet.t === 'MESSAGE_REACTION_ADD') {
			client.emit('messageReactionAdd', reaction, client.users.get(packet.d.user_id));
		}
		if (packet.t === 'MESSAGE_REACTION_REMOVE') {
			client.emit('messageReactionRemove', reaction, client.users.get(packet.d.user_id));
		}
	});
});
*/
// end - MessageReaction

client.on('message', message => {
	if (message.author.id == client.user.id) {
		return;
	}
	console.log(message.author.tag + ': ' + message.content);
	// console.log(message.channel);
	const servernum = findServerFromChannel(message.channel);
	console.log(servernum);
	if (!servernum) {
		return;
	}
	const newmessage = {
		'username': message.member.nickname || message.author.username,
		'message': message.content,
	};
	const currentmessagequeue = messagequeue.get(servernum);
	currentmessagequeue.push(newmessage);
	messagequeue.set(servernum, currentmessagequeue);
});

client.on('error', error => {
	console.error(new Date() + ': error');
	console.error(error.message);
});

client.login(process.env.AUTH_TOKEN);

const axios = require('axios');
const express = require('express');
const app = express();

app.use(express.json());

app.post('/bot', async (req, res) => {
	console.log('got POST request on /bot:');
	console.log(req.body);
	// const bodydata = require(req.body);
	const bodydata = req.body;
	let response = {};
	if (bodydata.type == 'newserver') {
		const servernum = addServer();
		response.servernum = servernum;
		res.json(response);
	} else if (bodydata.type == 'serverclose') {
		const channel = channels.get(bodydata.servernum);
		for (const [key,value] of channel.messages.filter(message => message.author.id == client.user.id)) {
			console.log(value.embeds);
			// console.log(value)
			await fulllogchannel.send('', value.embeds[0]);
		};
		channel.delete();
		channels.delete(bodydata.servernum);
		messagequeue.delete(bodydata.servernum);
		res.end();
	} else if (bodydata.type == 'heartbeat') {
		if (bodydata.messages.length != 0) {
			const embed = new RichEmbed();
			for (let i = 0; i < bodydata.messages.length; i++) {
				embed.addField(bodydata.messages[i].username, bodydata.messages[i].content);
			}
			channels.get(bodydata.servernum).send('', embed);
		}
		let topic = bodydata.gamename + ': ' + bodydata.players.length + ' players online: ';
		for (let i = 0; i < bodydata.players.length; i++) {
			topic += bodydata.players[i] + ', ';
		}
		topic = topic.substring(0, topic.length - 2);
		channels.get(bodydata.servernum).setTopic(topic);
		response.servernum = bodydata.servernum;
		response.messages = messagequeue.get(bodydata.servernum);
		response.commands = commandqueue.get(bodydata.servernum);
		console.log(response);
		messagequeue.set(bodydata.servernum, []);
		res.json(response);
	} else if (bodydata.type == 'proxy') {
		try {
			axios({
				url: bodydata.url,
				method: bodydata.method,
			}).then(proxyresponse => {
				response = proxyresponse;
			}).catch(error => {
				console.error('Proxy error: ');
				console.error(error);
			}).finally(() => {
				res.send(response);
			});
		} catch (error) {
			console.error('Proxy error: ');
			console.error(error);
		}
	}
});

app.get('/bot', (req, res) => {
	res.status(405).send('Method Not Allowed');
});

const port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
	ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

app.listen(port, ip);
console.log('App listening on http://%s:%s', ip, port);
