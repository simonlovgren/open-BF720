# Frontend
Simple frontend application for viewing measurements via a static web app.
Uses recharts for plotting. One graph is generated per registered user

# Application configuration
The frontend application requires some configuration to work properly.
- **BACKEND_URL** - IP/URL of backend service (default localhost)
- **BACKEND_PORT** - Port of backend service (default: 3000)
- **PORT** - Port to use when running frontend development server (default: 3000)

Rename (or copy) the `example.env` file to `.env` file and edit the corresponding paramaters.
```sh
# Backend
BACKEND_URL="localhost"
BACKEND_PORT=3000

# Frontend dev-server port
PORT=4000
```

**NOTE:**
The `BACKEND_URL` and `BACKEND_PORT` is not relative to the RaspberryPi/Server running the frontend application.
This is a client-side application, so it needs to be the public IP/hostname of the RaspberryPi/Server running the backend service.


# Build and run
Navigate to this directory in a a shell and start by running the following command:
```sh
npm install
```

There are two ways to launch the application. Either _build_ the application and host the contents of the resulting
`build` directory in a web server (apache, nginx, etc.), or run the static host server available via node.

## Build and host in a local nginx server
For simplicity, we assume only one site is hosted by the nginx server, in `/var/www/html`:

```sh
npm run build
sudo cp -r ./build/* /var/www/html/
```

## Start the frontend app in a development server
This type of server should only be used for development, and is very useful for such as it is reloaded every time a file
is changed.
```sh
npm start
```

The web application should automatically open in your default browser, otherwise you may access it via `localhost:<port>`
(where `<port>` is what you configured in the `.env` file, default is `4000`).