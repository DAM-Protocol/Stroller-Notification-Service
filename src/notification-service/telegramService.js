require('dotenv').config();
const axios = require('axios');
const express = require('express');
const telegramRouter = express.Router();
const ethers = require('ethers');
const { Wallet, Watcher, Notifications } = require('../models');

const { TELEGRAM_BOT_TOKEN, SERVER_URL } = process.env;
const TELEGRAM_BOT_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const URI = `/webhook/${TELEGRAM_BOT_TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;
const SEND_MESSAGE = `${TELEGRAM_BOT_URL}/sendMessage`;

const init = async () => {
    const res = await axios.get(`${TELEGRAM_BOT_URL}/setWebhook?url=${WEBHOOK_URL}`);
    console.log(res.data);
}

const watchWallet = async (watcherId, walletAddress) => {
    const watcherExists = await Watcher.exists({ services: { telegram: watcherId } });
    const walletExists = await Wallet.exists({ address: walletAddress });

    // If wallet doesn't exist in our database, convey the same to the user.
    if (!walletExists) throw new Error("Given address doesn't have a top-up");

    if (!watcherExists) {
        const newWatcher = new Watcher({
            services: {
                telegram: watcherId
            }
        });

        try {
            await Wallet.findOneAndUpdate({ address: walletAddress }, { $push: { watchers: newWatcher } });
            await newWatcher.save();
        } catch (error) {
            console.error(`Error while adding new watcher: ${error}`);
            throw new Error("Couldn't watch given address \u{1F615}");
        }
    } else {
        try {
            const watcher = await Watcher.findOne({ services: { telegram: watcherId } });
            await Wallet.findOneAndUpdate({ address: walletAddress }, { $push: { watchers: watcher } });
        } catch (error) {
            console.error(`Error while adding watcher: ${error}`);
            throw new Error("Couldn't watch given address \u{1F615}");
        }
    }

    return;
};

const unwatchWallet = async (watcherId, walletAddress) => {
    const watcherExists = await Watcher.exists({ services: { telegram: watcherId } });
    const walletExists = await Wallet.exists({ address: walletAddress });

    // If wallet doesn't exist in our database, convey the same to the user.
    if (!walletExists) throw new Error("Given address doesn't have a top-up");

    if (!watcherExists) {
        throw new Error("You are not a watcher \u{1F914}");
    } else {
        try {
            const watcher = await Watcher.findOne({ services: { telegram: watcherId } });
            const watcherOfWallet = await Wallet.exists({ address: walletAddress, watchers: watcher._id });

            if(!watcherOfWallet) throw new Error("You don't watch this address.");

            // Note: even if the watcher wasn't watching this wallet, the following line won't throw any error.
            // However, the watcher will receive unwatched address message.
            await Wallet.findOneAndUpdate({ address: walletAddress }, { $pull: { watchers: watcher._id } });
        } catch (error) {
            console.error(`Error while adding watcher: ${error}`);
            throw new Error(error.message);
        }
    }

    return;
};

// Route to handle user-bot interaction. User can:
//  1. /watch {address} - Watch an address for top-up status.
//  2. /unwatch {address} - Unwatch an address for top-up status.
// Is there a better way to handle bot commands and responses?
telegramRouter.post(URI, async (req, res) => {
    if(req.body.message === undefined) return res.send();

    const messageText = req.body.message.text;
    const watcherChatID = req.body.message.chat.id;

    if (messageText.startsWith("/start")) {
        await axios.post(SEND_MESSAGE, {
            chat_id: watcherChatID,
            text: `Hello! I can notify you about an address' Stroller top-up status.\n\nPlease enter /watch followed by an address you would like to monitor .\n\nTo stop notifications, run command /unwatch followed by an address.`
        });
    } else if (messageText.startsWith("/watch")) {
        const watchAddress = messageText.split(" ")[1];
        console.log(`Watch address given: ${watchAddress}`);

        if (watchAddress === undefined) {
            await axios.post(SEND_MESSAGE, {
                chat_id: watcherChatID,
                text: "Please enter an address after /watch"
            });

            return res.send();
        }

        if (ethers.utils.isAddress(watchAddress)) {
            try {
                await watchWallet(watcherChatID, watchAddress);

                await axios.post(SEND_MESSAGE, {
                    chat_id: watcherChatID,
                    text: `Watching address ${ethers.utils.getAddress(watchAddress)}`
                });
            } catch (error) {
                console.log(`Error encountered while sending watching address message: ${error}`);
                await axios.post(SEND_MESSAGE, {
                    chat_id: watcherChatID,
                    text: error.message
                });
            }
        } else {
            await axios.post(SEND_MESSAGE, {
                chat_id: watcherChatID,
                text: "Invalid address entered"
            });
        }
    } else if (messageText.startsWith("/unwatch")) {
        const watchAddress = messageText.split(" ")[1];
        console.log(`Watch address given: ${watchAddress}`);

        if (watchAddress === undefined) {
            await axios.post(SEND_MESSAGE, {
                chat_id: watcherChatID,
                text: "Please enter an address after /unwatch"
            });

            return res.send();
        }

        if (ethers.utils.isAddress(watchAddress)) {
            try {
                await unwatchWallet(watcherChatID, watchAddress);

                await axios.post(SEND_MESSAGE, {
                    chat_id: watcherChatID,
                    text: `Unwatched address ${ethers.utils.getAddress(watchAddress)}`
                });
            } catch (error) {
                console.error(`Error encountered while sending unwatching address message: ${error}`);
                await axios.post(SEND_MESSAGE, {
                    chat_id: watcherChatID,
                    text: error.message
                });
            }
        } else {
            await axios.post(SEND_MESSAGE, {
                chat_id: watcherChatID,
                text: "Invalid address entered"
            });
        }
    } else {
        await axios.post(SEND_MESSAGE, {
            chat_id: watcherChatID,
            text: "Please enter one of the commands or type /start"
        });
    }

    return res.send();
});

module.exports = {
    init,
    telegramRouter
};