const { ipcRenderer } = require('electron');
const { RokuClient, Keys } = require('roku-client');
const deviceManager = require('./deviceManager');


class RokuDeviceManager {
  constructor() {
    this.availableDevicesList = document.getElementById('roku-devices-available');
    this.savedDevicesList = document.getElementById('roku-devices-saved');
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.devices = "";


    ipcRenderer.on('devices', (event, devices) => {
        if (devices && Array.isArray(devices)) {
            devices.forEach((device) => {
              console.log('Received device:', device.name);
              this.addDeviceToSavedList(device.name, device.nickname);
            });
          } else {
            console.log('No devices received');
          }
    });

    // Load saved devices
    this.discoverDevices();
  }

  // Discover Roku devices
  discoverDevices() {
    this.loadingIndicator.style.display = 'block';
    console.log('Discovering devices...');
    try {
      RokuClient.discoverAll().then((clients) => {
        this.devices = clients.map((c) => new URL(c.ip).hostname);
        this.updateAvailableDevicesList(this.devices);
        this.loadingIndicator.className = '';
        this.loadingIndicator.style.display = 'none'; // Move it here
      }).catch((error) => {
        console.error('RokuClient.discoverAll error:', error);
        this.loadingIndicator.style.display = 'none'; // Also hide on error
        this.loadingIndicator.className = '';
      });
    } catch (error) {
      console.error('RokuClient.discoverAll error:', error);
      this.loadingIndicator.className = '';
      this.loadingIndicator.style.display = 'none'; // Also hide on error
    }
  }

  // Update available devices list
  updateAvailableDevicesList(devices) {
    console.log('Updating available devices list:', devices);
    if (!this.availableDevicesList) {
      console.error('availableDevicesList element not found');
      return;
    }
    this.availableDevicesList.innerHTML = ''; // Clear existing list

    // Ensure devices is an array
    const devicesArray = Array.isArray(devices) ? devices : [devices];
    
    devicesArray.forEach((device) => {
      this.addDeviceToList(device);
    });
  }

  // Add device to available list
  addDeviceToList(device) {
    console.log('Adding device to available list:', device);
    const listItem = document.createElement('li');
    const deviceText = document.createTextNode(device);
    const addButton = document.createElement('button');
    addButton.textContent = 'Add';
    addButton.className = 'btn btn-primary btn-sm';
    addButton.dataset.device = device;
    
    console.log('listItem:', listItem);
    console.log('deviceText:', deviceText);
    console.log('addButton:', addButton);
    
    listItem.appendChild(deviceText);
    listItem.appendChild(document.createTextNode('  '));
    listItem.appendChild(addButton);
    
    addButton.addEventListener('click', () => {
      ipcRenderer.send('add-device', device);
      ipcRenderer.once('device-added', (event, success) => {
        if (success) {
          this.addDeviceToSavedList(device);
          this.removeDeviceFromAvailableList(device); // Remove device from available list
        }
      });
    });
    
    console.log('availableDevicesList:', this.availableDevicesList);
    console.log('availableDevicesList parent:', this.availableDevicesList.parentElement);
    console.log('availableDevicesList outerHTML:', this.availableDevicesList.outerHTML);
    console.log('availableDevicesList childNodes:', this.availableDevicesList.childNodes);

    this.availableDevicesList.appendChild(listItem);
  }

  // Add device to saved list
addDeviceToSavedList(device, nickname) {
    deviceManager.saveDevice(device, device);
    let listItem = document.createElement("li");
    let deviceText = document.createElement('span');
    deviceText.textContent = `${nickname || device}`;
    let removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.className = "btn btn-sm btn-danger";
    removeButton.dataset.device = device;
    removeButton.addEventListener('click', () => {
      this.removeDeviceFromSavedList(device);
    });
    let editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.className = "btn btn-sm btn-secondary";
    editButton.dataset.device = device;
    editButton.addEventListener('click', () => {
      this.editDeviceNickname(device);
    });
    listItem.appendChild(deviceText);
    listItem.appendChild(removeButton);
    listItem.appendChild(editButton);
    this.savedDevicesList.appendChild(listItem);
  }

  // Remove device from available list
  removeDeviceFromAvailableList(device) {
    const availableDeviceListItems = this.availableDevicesList.children;
    for (let i = 0; i < availableDeviceListItems.length; i++) {
      const listItem = availableDeviceListItems[i];
      const deviceText = listItem.textContent.trim().split('  ')[0]; // Get device text
      if (deviceText === device) {
        listItem.remove();
        break;
      }
    }
  }

  // Remove device from saved list
    removeDeviceFromSavedList(device) {
        deviceManager.deleteDevice(device);
        const savedListItem = document.querySelector(`#roku-devices-saved li button[data-device="${device}"]`).parentElement;
        savedListItem.remove();
    
        // Add device back to available list
        const availableDevicesList = document.getElementById('roku-devices-available');
        const existingDevice = availableDevicesList.querySelector(`li button[data-device="${device}"]`);
        if (!existingDevice) {
        const listItem = document.createElement("li");
        const deviceText = document.createElement('span');
        deviceText.textContent = device;
        const addButton = document.createElement("button");
        addButton.textContent = "Add";
        addButton.className = "btn btn-sm btn-primary";
        addButton.dataset.device = device;
        addButton.addEventListener('click', () => {
            this.addDeviceToSavedList(device);
        });
        listItem.appendChild(deviceText);
        listItem.appendChild(addButton);
        availableDevicesList.appendChild(listItem);
        }
    }

  // Edit device nickname
    editDeviceNickname(device) {
        const modal = document.getElementById('editNicknameModal');
        const nicknameInput = document.getElementById('nicknameInput');
        const saveButton = document.getElementById('saveNicknameButton');
        const cancelButton = document.getElementById('cancelButton');
        const closeButton = document.querySelector('.close');
    
        // Set device as data attribute
        saveButton.dataset.device = device;
    
        // Show modal
        modal.style.display = 'block';
    
        // Add event listeners
        saveButton.addEventListener('click', saveNickname);
        cancelButton.addEventListener('click', hideModal);
        closeButton.addEventListener('click', hideModal);
    
        // Event listener functions
        function saveNickname() {
        const newNickname = nicknameInput.value.trim();
        deviceManager.editDevice(device, newNickname);
        if (newNickname) {
            ipcRenderer.send('update-nickname', device, newNickname);
            ipcRenderer.once('nickname-updated', () => {
            const savedDevicesList = document.getElementById('roku-devices-saved');
            const devices = savedDevicesList.children;
            for (let i = 0; i < devices.length; i++) {
                const deviceElement = devices[i].querySelector('button[data-device]');
                if (deviceElement && deviceElement.dataset.device === device) {
                devices[i].querySelector('span').textContent = `${newNickname || device}`;
                break;
                }
            }
            hideModal();
            });
        }
        }
    
        function hideModal() {
        modal.style.display = 'none';
        // Remove event listeners
        saveButton.removeEventListener('click', saveNickname);
        cancelButton.removeEventListener('click', hideModal);
        closeButton.removeEventListener('click', hideModal);
        }
    }

// Show saved devices with loader
showSavedDevices() {
  const loader = document.getElementById('loader');
  const savedDevicesList = document.getElementById('roku-devices-saved');

  // Show loader
  loader.style.display = 'block';
  savedDevicesList.innerHTML = '';

  // Load saved devices
  const devices = deviceManager.getAllDevices();

  // Hide loader
  loader.style.display = 'none';

  devices.forEach(device => {
    let listItem = document.createElement("li");
    let deviceText = document.createElement('span');
    deviceText.textContent = `${device.deviceNickname || device.deviceName}`;
    let removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.className = "btn btn-sm btn-danger";
    removeButton.dataset.device = device.deviceName;
    removeButton.addEventListener('click', () => {
      this.removeDeviceFromSavedList(device.deviceName);
    });
    let editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.className = "btn btn-sm btn-secondary";
    editButton.dataset.device = device.deviceName;
    editButton.addEventListener('click', () => {
      this.editDeviceNickname(device.deviceName);
    });
    listItem.appendChild(deviceText);
    listItem.appendChild(removeButton);
    listItem.appendChild(editButton);
    savedDevicesList.appendChild(listItem);
  });
  }
}

document.addEventListener('DOMContentLoaded', () => {
    const roku = new RokuDeviceManager();
});