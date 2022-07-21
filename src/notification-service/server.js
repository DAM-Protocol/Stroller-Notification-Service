require('dotenv').config();
const axios = require('axios');
const express = require('express');

const {TELEGRAM_BOT_TOKEN, SERVER_URL} = process.env;
const TELEGRAM_BOT_URL=`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const URI = `/webhook/${TELEGRAM_BOT_TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;

const app = express();
app.use(express.json());

const init = async() => {
    const res = await axios.get(`${TELEGRAM_BOT_URL}/setWebhook?url=${WEBHOOK_URL}`);
    console.log(res.data);
}

app.post(URI, async (req, res) => {
    console.log(req.body);

    try {
        await axios.post(`${TELEGRAM_BOT_URL}/sendMessage`, {
            chat_id: req.body.message.chat.id,
            text: req.body.message.text
        });
    } catch (error) {
        await axios.post(`${TELEGRAM_BOT_URL}/sendMessage`, {
            chat_id: req.body.message.chat.id,
            text: "Sorry, I ran into an error :("
        });
    }

    return res.send();
});

app.listen(process.env.PORT || 3000, async() => {
    console.log(`App listening on port ${process.env.PORT}`);
    await init();
});