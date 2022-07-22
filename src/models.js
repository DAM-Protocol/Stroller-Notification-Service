const mongoose = require('mongoose');
const { Schema } = mongoose;

// A top-up schame having:
//  index - top-up index object which can be queried from the smart contract.
//  netId - network id of a corresponding top-up index.
const topUpSchema = new Schema({
    index: { type: String, required: true },
    netId: Number
});

const notificationSchema = new Schema({
    message: { type: String, required: true },
    label: String,
    createdAt: Date
});

// Add notification preferences later.
const watcherSchema = new Schema({
    services: { type: Schema.Types.Mixed }
});

// A wallet schema having:
//  address - address of a wallet.
//  topUps - top-up indices of a wallet on all supported chains.
const walletSchema = new Schema({
    address: { type: String, required: true, unique: true },
    topUps: [{ type: Schema.Types.ObjectId, ref: 'TopUps' }],
    watchers: [{ type: Schema.Types.ObjectId, ref: 'Watcher' }],
    notifications: [{ type: Schema.Types.ObjectId, ref: 'Notifications'}]
});

const Wallet = mongoose.model('Wallet', walletSchema);
const TopUp = mongoose.model('TopUps', topUpSchema);
const Notifications = mongoose.model('Notifications', notificationSchema);
const Watcher = mongoose.model('Watcher', watcherSchema);

module.exports = {
    Wallet,
    TopUp,
    Notifications,
    Watcher
};