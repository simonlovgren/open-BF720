# Application configuration
The rest server/application will need some configuration before it is usable.
- **Port** - for exposing the endpoint (default 3000)
- **Debug level** - (default: warn)
- **Cron schedule** - (default: once per day 1 min past midnight: '1 0 * * *')

Rename (or copy) the `example.env` file to `.env` file and edit the corresponding paramaters.
```sh
# Port
PORT=3000

# Debug
LOG_LEVEL='warn'

# CRON Schedule - how frequent app should fetch measurements from scale (more frequent = more battery drain of scale)
CRON_SCHEDULE_SYNC='1 0 * * *'
```

# Build application
Navigate to this directory in a a shell and run the following:

```sh
npm install
npm run build
```

# Run
To temporarily run the application (for development, testing, etc.), run:
```sh
npm start
```

## Run using pm2 (Preferred option)
If you are planning on running the application long-term, you should consider using [PM2](https://pm2.keymetrics.io/), a daemon process manager which monitors application status and re-starts the application if it should crash or the raspberry pi restarts.

### Installing
Installing PM2 is as simple as:
```sh
sudo npm install pm2 -g
```
Since we want to install it globally, to ensure it can start the application on power-on/startup, we need to have root
privileges.

### Add the application to PM2
Start the application in PM2 by navigating to `open-BF720/backend` in a shell, then run the following command:
```sh
sudo pm2 start --name bf720-backend build/app.js
```
This will start the application process with the name `bf720-backend` (for ease of access later), see example output below:
```shell
sudo pm2 start --name bf720-backend ./build/app.js
[PM2] Starting /home/pi/open-BF720/backend/build/app.js in fork_mode (1 instance)
[PM2] Done.
┌─────┬──────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name             │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼──────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ bf720-backend    │ default     │ 1.0.0   │ fork    │ 19606    │ 0s     │ 0    │ online    │ 0%       │ 18.8mb   │ root     │ disabled │
└─────┴──────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘

```

### Save the application to PM2
Now we save the current process set in PM2, this will make PM2 automatically start the application if the RaspberryPi reboots:
```sh
sudo pm2 save
```
Example output:
```sh
sudo pm2 save
[PM2] Saving current process list...
[PM2] Successfully saved in /root/.pm2/dump.pm2
```

### Other useful PM2 commands
Stopping a running process:
```sh
sudo pm2 stop bf720-backend
```

Restarting a running process:
```sh
sudo pm2 restart bf720-backend
```

Starting a stopped application:
```sh
sudo pm2 start bf720-backend
```

Removing an application from auto-start:
```sh
sudo pm2 delete bf720-backend
```

# Usage / Set-up of users
In order to access measurements, the scale needs to be registered in the application and users need to be added via the application.

### Postman Collection
A complete list of API endpoints are available in the postman collection (Complete list with examples: See postman collection: [open-bf720.postman_collection.json](open-bf720.postman_collection.json)). Import it to postman and set up a postman environment with `BACKEND_URL` and `BACKEND_PORT`, and you'll have an easy way of
viewing and testing the API.

## 0. Prepare the scale

If you already have users added to the scale, you need to **_clear the user data of the scale_** to avoid duplicate users.

This is usually done by starting the scale and pressing the _mode_-button for 6-10 seconds.

## 1. List available scales

First we need to find available scales.

**GET** (`/manage/availableScales`) returns a list of scales it can see:
``` json
# Rest Response
[
    {
        "id": "c8b21ecc5222",
        "name": "BF720"
    }
]
```
## 2. Create scale setting
Find the scale you want to add in the scales list, and copy its `id`.
Then send the following POST request:

**POST** (`/manage/settings`) creates a new scale setting:
``` json
# Body JSON payload
{
    "id": "c8b21ecc5222",
    "name": "My BF720 scale"
}
```
_`name` can be whatever you want, but the `id` must match the scale we found._

## 3. Add a new user
Adding a new user to the scale requires the new user to perform a one-time measurement during the registration process.
1. Post a new user according as shown below.
2. Wait for the scale to turn on.
3. The new user now needs to step onto the scale and wait for the measurement to complete.
4. Done.

**POST** (`/user/add`) adds a new user:
```json
# Body JSON payload
{
    "name":"Foo",
    "gender": "m",
    "dateOfBirth":"1930-01-01",
    "heightInCm": 177
}
```

## 4. Confirm that the user exists
Send a request to verify the user was correctly added.
**Make special note of that an index is present, as a user without it was not correctly paired/registered with the scale.**

**GET** (`/user`) lists existing users:
```json
# Rest Response
[
    {
        "id": "6d94500c-5024-4ffd-b1a9-358c261b98da",
        "name": "Foo",
        "initials": "F",
        "heightInCm": 156,
        "gender": "m",
        "dateOfBirth": "1985-03-02",
        "consentCode": 9490,
        "index": 1
    }
]
```

## 5. Sync (download) measurements from the scale
The application will automatically download measurements according to the cronjob configuration, but it is also possible
to manually sync data from the scale.

**NOTE:**
`<userid>` is the `id` returned when listing users.

**GET** (`/user/<userid>/measurements/sync`) syncs measurement for a user.
```json
# Body JSON payload
{
    "Measurements synced for user Foo!"
}
```
_A URI with user ID added would look something like `/user/6d94500c-5024-4ffd-b1a9-358c261b98da/measurements/sync`._

## 6. Fetch measurements
Verify that the measurement was correctly read from the scale. This can be done either by fetchin **all** measurements,
or by fetching measurements from a specific user.

**GET** (`/measurements`) gets all measurements:
```json
[
    {
        "userIndex": 1,
        "weightInKg": 92.9,
        "timestamp": "2021-12-19T15:16:26.000Z",
        "bodyFatInPct": 27.8,
        "bmrInJoule": 1890.9,
        "musclesInPct": 37.6,
        "softLeanMassInKg": 63.67,
        "waterMassInKg": 44.68,
        "impedanceInOhm": 510,
        "userId": "6d94500c-5024-4ffd-b1a9-358c261b98da"
    }
]
```

**GET** (`/user/<userid>/measurements`) gets measurements for a single user:
```json
[
    {
        "userIndex": 1,
        "weightInKg": 92.9,
        "timestamp": "2021-12-19T15:16:26.000Z",
        "bodyFatInPct": 27.8,
        "bmrInJoule": 1890.9,
        "musclesInPct": 37.6,
        "softLeanMassInKg": 63.67,
        "waterMassInKg": 44.68,
        "impedanceInOhm": 510,
        "userId": "6d94500c-5024-4ffd-b1a9-358c261b98da"
    }
]
```
_A URI with user ID added would look something like `/user/6d94500c-5024-4ffd-b1a9-358c261b98da/measurements`._

## 7. All done
The scale and application are now correctly set up with a registered user.
Register more users by repeating **step 3**.
