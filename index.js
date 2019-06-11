const { Client, RichEmbed } = require('discord.js');
const client = new Client();
const auth = require('./private/auth.json');
// const db = require('quick.db');

const queue = {};
let LogChannel;
client.on('ready', () => {
	const date = new Date(client.readyTimestamp);
	console.log(date);
	console.log(`Logged in as ${client.user.tag}!`);
	LogChannel = client.channels.get(auth.channel_id);
	console.log(LogChannel);
});


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
	if (message.channel !== LogChannel) return;
	if (message.content == '!restart' && message.author.id == 214262712753061889) {
		message.channel.send('restarting').then(() => {
			process.exit(0);
		});
	}
	if (!message.content.startsWith('!server')) {
		return;
	}
	const servernum = message.content.substring(7).match(/\d+/);
	if (!servernum) return message.reply('please provide a valid server number');
	if (!queue[servernum]) return message.reply('that server is not online.');
	const newmessage = {
		'username': message.author.username,
		'message': message.content.substring(8),
	};
	queue[servernum].push(newmessage);
});

client.on('error', error => {
	console.error(new Date() + ': error');
	console.error(error.message);
});

client.login(auth.token);

const app = require('./Interface/app');

app.post('/', (req, res) => {
	const bodydata = require(req.body);
	if (bodydata.type == 'newserver') {
		queue[toString(queue.length)] = [];
	} else if (bodydata.type == 'serverclose') {
		queue[bodydata.servernum] = null;
	}
});