const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const weatherApiKey = process.env.OPENWEATHERMAP_API_KEY;

bot.onText(/\/weather (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const city = match[1];

    try {
        const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}`);
        const weatherData = response.data;

        const kelvinToCelsius = (temp) => (temp - 273.15).toFixed(2);
        const temperature = kelvinToCelsius(weatherData.main.temp);
        const feelsLike = kelvinToCelsius(weatherData.main.feels_like);
        const description = weatherData.weather[0].description;

        bot.sendMessage(chatId, `The temperature in ${city} is ${temperature}°C and it feels like ${feelsLike}°C. The weather is ${description}.`);
    } catch (error) {
        bot.sendMessage(chatId, 'Sorry, I could not get the weather data. Please try again later.');
    }
});
