# open-BF720
Solution for automatic sync of weight measurements from a Beurer BF 720 scale.

##

## Description

Application will sync measurements from the scale at a predefined rate (Cron schedule). Measurements are stored by the application in a file on the RPI. Synced measurements can be retreived using the application REST API.

**NOTE**:
_A reverse proxy is only required if your are planning on using host names / domain names for access. Otherwise `IP:PORT` will work fine without it._


![alt text](images/architecture.png)


## Use case

This solution allows for easy storage and automatic retrieval of weight- and body composition measurements from the Beurer BF720 scale. A user only needs to weigh in, and at a predefined schedule the app will sync measurements from the scale to persistent storage (default schedule: once every 24h, at midnight).

Complete list with examples: See postman collection: [backend/open-bf720.postman_collection.json](backend/open-bf720.postman_collection.json)

## Backend / Frontend
Individual descriptions for the backend and frontend can be found here:
- [Backend README.md](backend/README.md)
- [Frontend README.md](frontend/README.md)

# Prerequisites
- Environment for running npm/node (see configuration/installation guide(s) below)
- Bluetooth BLE dongle **OR** Raspberry Pi with built-in BLE


# Configuring Rasberry Pi (Arch linux)

## Bluetooth

Install bluetooth pacman packages:
```sh
sudo pacman -Sy bluez bluez-libs bluez-utils
```

Check if the the kernel found the bluetooth device:
```sh
sudo dmesg | grep Bluetooth

>
[    9.801493] Bluetooth: Core ver 2.22
[    9.801545] Bluetooth: HCI device and connection manager initialized
[    9.801562] Bluetooth: HCI socket layer initialized
[    9.801572] Bluetooth: L2CAP socket layer initialized
[    9.801587] Bluetooth: SCO socket layer initialized
[    9.863647] Bluetooth: hci0: unexpected event for opcode 0x0000
[   10.078534] Bluetooth: hci0: hardware error 0x35
[   10.925171] Bluetooth: BNEP (Ethernet Emulation) ver 1.3
[   10.925186] Bluetooth: BNEP filters: protocol multicast
[   10.925201] Bluetooth: BNEP socket layer initialized
```

Check that bluetooth service is running
```
systemctl status bluetooth

> bluetooth.service - Bluetooth service
     Loaded: loaded (/usr/lib/systemd/system/bluetooth.service; enabled; vendor preset: disabled)
     Active: active (running) since Mon 2021-02-15 11:08:28 CET; 1 months 2 days ago
       Docs: man:bluetoothd(8)
   Main PID: 302 (bluetoothd)
     Status: "Running"
      Tasks: 1 (limit: 4915)
     CGroup: /system.slice/bluetooth.service
             `-302 /usr/lib/bluetooth/bluetoothd
```

If not, enable and start the service:

```sh
sudo systemctl enable bluetooth
sudo systemctl start bluetooth
```

## NPM & Node
Install nodejs and NPM
```sh
sudo pacman -Sy nodejs
sudo pacman -Sy npm
```

Check installed versions:
```sh
# Versions
node --version
> v15.5.1

npm --version
> 6.14.11
```

## Raw access to Bluetooth device
Grant the node binary **cap_net_raw privileges**, so it can start/stop BLE advertising.
```sh
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
```

# Configuring Rasberry Pi (Raspberry Pi OS)
## Bluetooth
Bluetooth is supported out-of-the-box and you should not need to install any packages.

Check if the the kernel found the bluetooth device:
```sh
sudo dmesg | grep Bluetooth

[   13.012254] Bluetooth: Core ver 2.22
[   13.012327] Bluetooth: HCI device and connection manager initialized
[   13.012350] Bluetooth: HCI socket layer initialized
[   13.012360] Bluetooth: L2CAP socket layer initialized
[   13.012375] Bluetooth: SCO socket layer initialized
[   13.702776] Bluetooth: HCI UART driver ver 2.3
[   13.702787] Bluetooth: HCI UART protocol H4 registered
[   13.702849] Bluetooth: HCI UART protocol Three-wire (H5) registered
[   13.703552] Bluetooth: HCI UART protocol Broadcom registered
[   14.036937] Bluetooth: BNEP (Ethernet Emulation) ver 1.3
[   14.036947] Bluetooth: BNEP filters: protocol multicast
[   14.036960] Bluetooth: BNEP socket layer initialized
```

Check that bluetooth service is running
```
systemctl status bluetooth

● bluetooth.service - Bluetooth service
     Loaded: loaded (/lib/systemd/system/bluetooth.service; enabled; vendor preset: enabled)
     Active: active (running) since Sat 2021-12-11 13:24:24 GMT; 1 weeks 1 days ago
       Docs: man:bluetoothd(8)
   Main PID: 612 (bluetoothd)
     Status: "Running"
      Tasks: 1 (limit: 4915)
        CPU: 109ms
     CGroup: /system.slice/bluetooth.service
             └─612 /usr/libexec/bluetooth/bluetoothd
```

If not, enable and start the service:

```sh
sudo systemctl enable bluetooth
sudo systemctl start bluetooth
```

## NPM & Node
_There are probably better ways to do this, but it was the first of many that actually worked._

NodeJS and NPM are not especially updated if using _apt_ (12.22.5 vs 16+), so we need perform a manual install.
This is based on the article [Install Node.js and Npm latest Version on Raspberry Pi 4?](https://officialrajdeepsingh.dev/install-node-js-and-npm-latest-version-on-raspberry-pi-4/).

**NOTE:**
If you already have node/nodejs installed, **you must install the old version before proceeding**.

First, determine which architecture (`armv7l` or `armv8l`) the device is running via:
```sh
uname -m
```

Then navigate to [nodejs.org](https://nodejs.org/en/download/) and their (alternative) downloads page.
Locate the version of `Linux Binaries (ARM)` matching your architecture and _copy the link_ (right-click > copy link address).

Open a shell and navigate to Downloads or a temporary directory, then run:
```sh
wget <url to binaries>
```

After the download completes, extract the tarball via:
```sh
tar -xf <downloaded file>
```

Now, navigate into the extracted directory and remove unnecessary files:
```sh
rm CHANGELOG.md LICENSE README.md
```

Then we copy the rest to `/usr/local/bin` via:
```sh
sudo cp -r * /usr/local/
```

Finally we need to re-start the shell for it to properly find our new binaries.
Test that it works properly via:
```sh
node -v && npm -v
```

## Raw access to Bluetooth device
In order for node to access the bluetooth device/dongle and start/stop BLE advertising, we need to grant the node binary
**cap_net_raw privileges**. This is easiest done via:
```sh
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
```
