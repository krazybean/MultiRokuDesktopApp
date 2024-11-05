// deviceManager.js
const db = require('electron-db');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'devices.json');

async function init() {
  try {
    if (!fs.existsSync(dbPath)) {
      await db.createTable('devices', dbPath);
    }
  } catch (error) {
    console.error('Error creating database table:', error);
  }
}

init();

// Save device
async function saveDevice(deviceName, deviceNickname = '') {
  try {
    const device = { deviceName, deviceNickname };
    await db.insertTableContent('devices', device);
  } catch (error) {
    console.error('Error saving device:', error);
  }
}

// Edit device
async function editDevice(deviceName, deviceNickname) {
  try {
    const where = { deviceName };
    const set = { deviceNickname };
    await db.updateRow('devices', where, set);
  } catch (error) {
    console.error('Error editing device:', error);
  }
}

// Delete device
async function deleteDevice(deviceName) {
  try {
    await db.deleteRow('devices', { deviceName });
  } catch (error) {
    console.error('Error deleting device:', error);
  }
}

// Get all devices
async function getAllDevices() {
  try {
    const devices = await db.getAll('devices');
    return devices;
  } catch (error) {
    console.error('Error getting devices:', error);
  }
}

// Get device by name
async function getDeviceByName(deviceName) {
  try {
    const device = await db.getField('devices', { deviceName });
    return device;
  } catch (error) {
    console.error('Error getting device by name:', error);
  }
}

module.exports = {
  saveDevice,
  editDevice,
  deleteDevice,
  getAllDevices,
  getDeviceByName,
};