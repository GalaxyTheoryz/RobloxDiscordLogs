const { Client, RichEmbed } = require('discord.js');
const client = new Client();
// const auth = require('./auth.json');
// const db = require('quick.db');

let guild;
let categorychannel;
let fulllogchannel;
let errorchannel;
client.on('ready', () => {
	const date = new Date(client.readyTimestamp);
	console.log(date);
	console.log(`Logged in as ${client.user.tag}!`);
	guild = client.guilds.get(process.env.GUILD_ID);
	categorychannel = guild && guild.channels.get(process.env.CATEGORY_ID);
	fulllogchannel = guild && guild.channels.get(process.env.FULL_LOG_ID);
	errorchannel = guild && guild.channels.get(process.env.ERROR_CHANNEL_ID);
	if (categorychannel && fulllogchannel && errorchannel) {
		console.log('Found guild and channels!');
	} else {
		console.error('Couldn\'t find all channels!');
		process.exit(1);
	}
	// console.log(LogChannel);
});

const messagequeue = new Map();
const commandqueue = new Map();
const lastmessages = new Map();
const channels = new Map();
const isServerNumFree = function(num) {
	return !messagequeue.has(num);
};
const addServer = async function(preferred) {
	let newservernum = preferred;
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
	lastmessages.set(newservernum, new Date());
	const channeldata = new Object();
	channeldata.type = 'text';
	channeldata.parent = categorychannel;
	const newchannel = await guild.createChannel('Server' + newservernum, channeldata);
	channels.set(newservernum, newchannel);
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

const deleteServer = async function(servernum, gamename) {
	const channel = channels.get(servernum);
	const newserverembed = new RichEmbed().setTitle('New server').addField('Game:', gamename).setFooter(new Date(channel.createdTimestamp)).setColor([0, 255, 0]);
	fulllogchannel.send('', newserverembed);
	for (const [, value] of channel.messages.filter(message => message.author.id == client.user.id)) {
		// console.log(value.embeds);
		// console.log(value)
		await fulllogchannel.send('', new RichEmbed(value.embeds[0]).setColor([0, 0, 255]));
	}
	const servercloseembed = new RichEmbed().setTitle('Server shutdown').setFooter(new Date()).setColor([255, 0, 0]);
	fulllogchannel.send('', servercloseembed);
	channel.delete('Server shutdown');
	channels.delete(servernum);
	messagequeue.delete(servernum);
	lastmessages.delete(servernum);
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

client.on('message', async message => {
	if (message.author.id == client.user.id) {
		return;
	}
	// console.log(message.author.tag + ': ' + message.content);
	// console.log(message.channel);
	if (message.channel == fulllogchannel && message.content == 'cleanup') {
		const toedit = await message.channel.send('Cleaning channels!');
		for (const [, channel] of categorychannel.children) {
			if (channel != fulllogchannel && channel != errorchannel && !findServerFromChannel(channel)) {
				channel.delete('Server shutdown');
			}
		}
		for (const [server, lastdate] of lastmessages) {
			if (lastdate < new Date() - 60000) {
				deleteServer(server, 'unknown');
			}
		}
		toedit.edit('Cleaned channels!');
	}
	const servernum = findServerFromChannel(message.channel);
	// console.log(servernum);
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
	// console.log('got POST request on /bot:');
	// console.log(req.body);
	// const bodydata = require(req.body);
	const bodydata = req.body;
	const response = {};
	if (bodydata.type == 'newserver') {
		const servernum = await addServer();
		response.servernum = servernum;
		res.status(200).json(response);
	} else if (bodydata.type == 'serverclose') {
		console.log('Server shutdown: ' + bodydata.servernum);
		deleteServer(bodydata.servernum, bodydata.gamename);
		res.sendStatus(204);
	} else if (bodydata.type == 'heartbeat') {
		if (!channels.has(bodydata.servernum)) {
			await addServer(bodydata.servernum);
		}
		if (bodydata.messages.length != 0) {
			const embed = new RichEmbed();
			for (let i = 0; i < bodydata.messages.length; i++) {
				embed.addField(bodydata.messages[i].username, bodydata.messages[i].content);
			}
			embed.setFooter(new Date());
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
		messagequeue.set(bodydata.servernum, []);
		lastmessages.set(bodydata.servernum, new Date());
		res.status(200).json(response);
	} else if (bodydata.type == 'proxy') {
		let proxyresponse;
		axios({
			url: bodydata.url,
			method: bodydata.method,
			headers: bodydata.headers,
			data: bodydata.body,
		}).then(proxyres => {
			proxyresponse = proxyres;
		}).catch(error => {
			console.error('Proxy error');
			console.error(error);
			proxyresponse = error.response;
		}).finally(() => {
			response.status = proxyresponse.status;
			response.statustext = proxyresponse.statusText;
			response.body = proxyresponse.data;
			response.headers = proxyresponse.headers;
			// console.log(response);
			res.json(response);
		});
	}
});

app.get('/bot', async (req, res) => {
	res.sendStatus(405);
});

const port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
	ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

app.listen(port, ip);
console.log('App listening on http://%s:%s', ip, port);
