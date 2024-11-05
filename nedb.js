const DataStore = require('nedb');
const path = require('path');

const db = new DataStore({ filename: path.join(__dirname, 'devices.db'), autoload: true });

const nedb = {
  addDevice: (device, nickname) => {
    db.insert({ name: device, nickname });
  },
  removeDevice: (device) => {
    db.remove({ name: device });
  },
  getDevices: (callback) => {
    db.find({}, callback);
  },
  updateNickname: (device, nickname) => {
    db.update({ name: device }, { $set: { nickname } });
  },
};

module.exports = nedb;