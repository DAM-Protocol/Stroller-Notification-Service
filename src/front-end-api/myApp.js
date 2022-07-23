require('dotenv').config();
const express = require('express');
const apiRouter = express.Router();
// const mongoose = require('mongoose');
// const { Schema } = mongoose;
const app = express();
const { Wallet, TopUp } = require('../models');


// Register a wallet and corresponding top-up index.
// TODO Use auth methods.
// Maybe break this route into two: (1) Register and (2) Add.
// (1) Register will register the wallet address and create a wallet document.
// (2) Add will be used to add a top-up to the corresponding wallet document.
apiRouter.post('/api/topup/add', async (req, res) => {
    const walletAddress = req.body.address;
    const topUpIndex = req.body.index;
    const topUpNetId = req.body.netId;

    // Only for debugging.
    // console.log("Top up wallet: ", walletAddress);
    // console.log("Top up index: ", topUpIndex);
    // console.log("Top up network id: ", topUpNetId);

    // If the sent data is undefined, return an error response.
    if (walletAddress === undefined || topUpIndex === undefined || topUpNetId === undefined) {
        console.error("Undefined data sent");
        return res.json({ error: "Undefined data" });
    }

    // Check if the wallet already exists.
    const walletExists = await Wallet.exists({ address: walletAddress });

    // Create a new top-up document.
    const newTopUp = new TopUp({
        index: topUpIndex,
        netId: topUpNetId
    });

    // If wallet doesn't exist in our database, create an entry.
    if (!walletExists) {
        try {
            await newTopUp.save();

            const newWallet = new Wallet({
                address: walletAddress
            });

            newWallet.topUps.push(newTopUp);
            await newWallet.save();
        } catch (error) {
            console.error(`Error while creating a new wallet document: ${error}`);
            return res.json({ error: "Couldn't create new wallet" });
        }
    } else {
        // If a wallet exists, check if the top-up also already exists.
        const topUpExists = await TopUp.exists({ index: topUpIndex, netId: topUpNetId });

        // If the top-up exists as well, do nothing.
        if (topUpExists) {
            console.log(`Top up ${topUpIndex} already exists for wallet ${walletAddress}`);
            return res.send();
        } else {
            // Else, save the new top-up document and update the top-ups array.
            try {
                await newTopUp.save();
                await Wallet.findOneAndUpdate({ address: walletAddress }, { $push: { topUps: newTopUp } });
            } catch (error) {
                console.error(`Error while adding a top-up to existing wallet: ${error}`);
                return res.json({ error: "Couldn't push new top-up data" });
            }
        }
    }

    console.log(`Added a new top-up ${topUpIndex} of wallet ${walletAddress}`);

    return res.send();
});

apiRouter.delete('/api/topup/delete', async(req, res) => {
    const walletAddress = req.body.address;
    const topUpIndex = req.body.index;
    const topUpNetId = req.body.netId;

    // Only for debugging.
    // console.log("Top up wallet: ", walletAddress);
    // console.log("Top up index: ", topUpIndex);
    // console.log("Top up network id: ", topUpNetId);

    // If the sent data is undefined, return an error response.
    if (walletAddress === undefined || topUpIndex === undefined || topUpNetId === undefined) {
        console.error("Undefined data sent");
        return res.json({ error: "Undefined data" });
    }

    // Check if the wallet already exists.
    const walletExists = await Wallet.exists({ address: walletAddress });

    if(!walletExists) {
        console.log(`Wallet ${walletAddress} doesn't exist in the database`);
        return res.json({ error: "Wallet not found"});
    }

    // This pre hook doesn't work. Investigate later.
    // topUpSchema.pre('findOneAndDelete', async() => {
    //     console.log("This object: ", this);
    //     try {
    //         await Wallet.findOneAndUpdate({ address: walletAddress }, { $pullAll: { topUps: [{_id: this._id}] } });
    //     } catch (error) {
    //         console.error(`Error while updating top-ups array: ${error}`);
    //         return res.json({ error: "Error while deleting top-up from wallet"});
    //     }
    // });

    try {
        const topUpIndexId = await TopUp.findOne({ index: topUpIndex });
        console.log("TopUpIndexId: ", topUpIndexId);

        await TopUp.findByIdAndDelete({ _id: topUpIndexId._id });
        await Wallet.findOneAndUpdate({ address: walletAddress }, { $pullAll: { topUps: [{_id: topUpIndexId._id}] } });
    } catch (error) {
        console.error(`Error while deleting top-up: ${error}`);
        return res.json({ error: "Error while deleting top-up"});
    }

    console.log(`Top-up index ${topUpIndex} deleted for wallet ${walletAddress}`);
    return res.send();
});

module.exports = {
    apiRouter
};