require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const telegramService = require('./telegram-service/telegramService');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/', telegramService.router);

const initServices = async() => {
    try {
        await telegramService.init();
    } catch (error) {
        console.log(`Telegram service intiation failed: ${error}`);
    }
}

app.listen(process.env.NOTIFICATIONS_PORT || 3000, async() => {
    console.log(`App listening on port ${process.env.NOTIFICATIONS_PORT}`);
    await initServices();
});