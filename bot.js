// Web-scaper bot that notifies the user when a new element pops up on a table
require('dotenv').config();

// package version
const package = require('./package.json');

const axios = require('axios');
const cheerio = require('cheerio');
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

var BirdSighting = require('./birdSighting.js');

let previousBirdSightings = [];

async function scrapeWebsite() {
	const url = process.env.URL;
	const response = await axios.get(url);
	const $ = cheerio.load(response.data);

	// Select the table and the rows
	const table = $('table > tbody');
	const rows = table.find('tr');

	// Iterate over the rows
	let currentBirdSightings = [];
	rows.each((index, element) => {
		const datetime = $(element).find('td:nth-child(1)').text();
		const species = $(element).find('td:nth-child(2)').text();
		const rarity = $(element).find('td:nth-child(2)').find('a > i').attr('title');
		const number = $(element).find('td:nth-child(3)').text();
		const location = $(element).find('td:nth-child(4)').text();
		const url = "https://waarneming.nl/" + $(element).find('td:nth-child(1)').find('a').attr('href');

		// Create a new BirdSighting object
		const birdSighting = new BirdSighting(datetime, species, rarity, number, location, url);

		// Add the new bird sighting to the currentBirdSightings array
		currentBirdSightings.push(birdSighting);
	});

	return currentBirdSightings;
}

function prepareMessage(birdSighting) {
	return `New ${birdSighting.rarity.trim()} sighting: ${birdSighting.number.trim()} of species ${birdSighting.species.trim()} at ${birdSighting.location.trim()} on ${birdSighting.datetime.trim()}. More info: ${birdSighting.url}`;
}

function sendTelegramMessage(text) {
	const bot = new TelegramBot(process.env.TELEGRAM_TOKEN);
	const chatId = process.env.TELEGRAM_CHAT_ID;
	console.log(text);
	bot.sendMessage(chatId, text);
}

function sendBirdSightingToTelegram(birdSighting) {
	const message = prepareMessage(birdSighting);
	sendTelegramMessage(message);
}

async function checkForNewEntries() {
	console.log('Checking for new bird sightings...');
	const currentBirdSightings = await scrapeWebsite();

	// Filter out the new bird sightings.
	const newBirdSightings = currentBirdSightings.filter((currentBirdSighting) => {
		return !previousBirdSightings.some((previousBirdSighting) => {
			return previousBirdSighting.url === currentBirdSighting.url;
		});
	});

	console.log(`Found ${currentBirdSightings.length} bird sightings.`);
	console.log(`We had ${previousBirdSightings.length} bird sightings.`);
	console.log(`Found ${newBirdSightings.length} new bird sightings.`);

	// If the bot has just started, ignore the first run and only send the last bird sighting as a test
	if (previousBirdSightings.length === 0) {
		previousBirdSightings = currentBirdSightings;
		sendTelegramMessage(`BirdWatcher version ${package.version} is online and watching 👀.\n\nCached initial ${previousBirdSightings.length} sightings.`);
		return;
	}

	// If there are new bird sightings, send a message
	if (newBirdSightings.length > 0) {
		console.log("New birds have been found. Sending messages...");
		newBirdSightings.forEach((birdSighting) => {
			sendBirdSightingToTelegram(birdSighting);
		});
	}

	// Update the previousBirdSightings array
	previousBirdSightings = currentBirdSightings;
}


// BIRD WATCHER


checkForNewEntries();

// Create cron job for checking birds every 10 minutes.
cron.schedule('* * * * *', () => {
	checkForNewEntries();
});

// Listen to port for heroku to not crash
const PORT = process.env.PORT || 3000;
const app = require('express')();
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
	res.send('BirdWatcher is online and watching 👀');
});

app.get('/birds', (req, res) => {
	res.send(previousBirdSightings);
});

app.get('/previous', (req, res) => {
	res.send(previousBirdSightings);
});