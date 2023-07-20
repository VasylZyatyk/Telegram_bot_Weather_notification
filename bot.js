const Telegraf = require('telegraf');
const axios = require('axios');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(token);
const weatherApiKey = process.env.OPENWEATHERMAP_API_KEY;

bot.command('weather', async (ctx) => {
    const city = ctx.message.text.split(' ')[1];

    try {
        const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}`);
        const weatherData = response.data;

        const kelvinToCelsius = (temp) => (temp - 273.15).toFixed(2);
        const temperature = kelvinToCelsius(weatherData.main.temp);
        const feelsLike = kelvinToCelsius(weatherData.main.feels_like);
        const description = weatherData.weather[0].description;

        ctx.reply(`Температура в ${city} становить ${temperature} і відчувається як ${feelsLike}°C. Погода ${description}.`);
    } catch (error) {
        ctx.reply('Вибачте,я не отримав дані про погоду.Спробуйте пізніше.');
    }
});

const subscriptions = [];

bot.command('subscribe', (ctx) => {
    const chatId = ctx.chat.id;
    const location = ctx.message.text.split(' ')[1];

    // Add the user's chat ID and location to the subscriptions object
    subscriptions[chatId] = location;

    ctx.reply(`Ви успішно підписались на оновлення даних про погоду для ${location}.`);
});

bot.command('unsubscribe', (ctx) => {
    const chatId = ctx.chat.id;

    // Remove the user's chat ID from the subscriptions object
    delete subscriptions[chatId];

    ctx.reply('Ви успішно відписались від оновлень даних про погоду.');
});

// Function to send daily weather updates to all subscribed users
const sendDailyUpdates = async () => {
    // Get the current date and time
    const now = new Date();

    // Calculate the time until the next update (9:00 AM local time)
    let nextUpdate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0) - now;
    if (nextUpdate < 0) {
        nextUpdate += 86400000; // it's after 9am, try 9am tomorrow.
    }

    // Set a timeout to run this function again at the next update time
    setTimeout(sendDailyUpdates, nextUpdate);

    // Send an update to each subscribed user
    for (const [chatId, location] of Object.entries(subscriptions)) {
        try {
            const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${weatherApiKey}`);
            const weatherData = response.data;

            const kelvinToCelsius = (temp) => (temp - 273.15).toFixed(2);
            const temperature = kelvinToCelsius(weatherData.main.temp);
            const feelsLike = kelvinToCelsius(weatherData.main.feels_like);
            const description = weatherData.weather[0].description;

            bot.telegram.sendMessage(chatId, `Температура ${location} становить ${temperature}°C , відчувається як ${feelsLike}°C. Погода ${description}.`);
        } catch (error) {
            bot.telegram.sendMessage(chatId, 'Вибачте,я не отримав дані про погоду.Спробуйте пізніше');
        }
    }
};

// Start sending daily updates
sendDailyUpdates();

bot.launch();
