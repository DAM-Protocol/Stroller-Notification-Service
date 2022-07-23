require('dotenv').config();
const axios = require('axios');
const express = require('express');
const rulesRouter = express.Router();
const ethers = require('ethers');
const { Wallet, Notifications, Watcher, TopUp } = require('../models');
const strollManagerABI = require('./IStrollManager.json').abi;

const { STROLLMANAGER_ADDRESS, ALCHEMY_URL } = process.env;
const alchemyProvider = new ethers.providers.AlchemyProvider(network="maticmum", ALCHEMY_URL);
const publicKey = "0x917A19E71a2811504C4f64aB33c132063B5772a5";
const signer = new ethers.VoidSigner(publicKey, alchemyProvider);
const strollManagerContract = new ethers.Contract(STROLLMANAGER_ADDRESS, strollManagerABI, signer);

// console.log("StrollManager contract: ", strollManagerContract);
console.log("Signer: ", signer)

const checkWallet = async(walletAddress) => {
    let walletTopUps = await Wallet.findOne({ address: walletAddress }).select('topUps');

    console.log("Top ups: ", walletTopUps);

    for (let i = 0; i < walletTopUps.topUps.length; ++i) {
        let index;
        try {
            const topUp = await TopUp.findById(walletTopUps.topUps[i]._id).select('index');
            index = topUp.index;
            console.log("Index value: ", topUp.index);
        } catch (error) {
            console.log(`Error while getting top-up index: ${error.message}`);
            throw new Error("Error while getting top-up data");
        }

        try {
            console.log("minLower: ", await strollManagerContract.minLower());
            const res = await strollManagerContract.getTopUpByIndex(index);
            console.log("Get top up result: ", res);
        } catch (error) {
            console.log(`Error while getting top-up by index: ${error.message}`);
            throw new Error("Error while getting top-up by index");
        }

    }
};

rulesRouter.get('/api/topup/check?:address', async(req, res) => {
    const walletAddress = req.query.address;

    console.log("Wallet address: ", walletAddress);

    try {
        await checkWallet(walletAddress);
    } catch (error) {
        console.error(`Error while checking for top-up: ${error.message}`);
    }

    return res.send();
});

module.exports = {
    rulesRouter
};