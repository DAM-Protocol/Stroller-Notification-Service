require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { apiRouter } = require('./front-end-api/myApp');
const { rulesRouter } = require('./rules-engine/rules');
const telegramService = require('./notification-service/telegramService');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(apiRouter);
app.use(rulesRouter);
app.use(telegramService.telegramRouter);

app.listen(process.env.SERVER_PORT || 3000, async () => {
    console.log(`App listening on port ${process.env.SERVER_PORT}`);

    await telegramService.init();
});