# F-Taxes

F-Taxes is a free and open source crypto tax calculation tool.
It strives to be an alternative to the dozens of overpriced online services.

Advantages:
- Very fast in comparison with online services as it runs locally on your PC instead of in the cloud.
- All your data stays under your control.
- No transaction limits.
- Open source, extensible by the community.
- Free, because paying taxes sucks already enough.

F-Taxes is very, very early stage and not usable yet. Feel free to run the app yourself and tinker with it though.

**Warning:** While you could self-host this app on a webspace it's strongly recommended to NOT do that.
The reason is that this software is in a very early stage and is missing A LOT of the typical
security mechanisms to have it accessible from the outside world in a safe way.

## Tech Stack

The backend is written in GO. The frontend is a Single Page Application with heavily uses web components.
The lib for the web components is called lit-element (https://lit.dev/).
Mongodb is used to store the data.

## How to run F-Taxes for development

Follow these steps to run F-Taxes locally for development. It comes ready to go with build tooling.

### Prerequisites

F-Taxes uses Mongodb as it's database. You can either simply install mongodb (https://www.mongodb.com/try/download/community) on your machine.
This makes it available on localhost:27017 or you run `docker-compose up -d` to spin up mongodb using docker.

Next you need to have the GO programming language installed. Please refer to https://go.dev/ for the installation steps.
For the frontend you need to have nodejs installed. Please refer to https://docs.npmjs.com/downloading-and-installing-node-js-and-npm for the installation steps.

For build tooling you need to install `air` and `gowebbuild`

```bash
go install github.com/cosmtrek/air@latest
```

```bash
go install github.com/trading-peter/gowebbuild@latest
```

Next make sure that Mongodb runs on localhost:27017 (that's the default and should therefore be the case).

Open a terminal and navigate into the `frontend` folder.
Type `npm install` and hit enter. This installs all the dependencies of the frontend.

Navigate into the project root.
Type `air` and hit enter. This will start the backend with support for auto-reloading on file changes in the `backend/` folder.

Open a second terminal in the project root.
Type `gowebbuild` and hit enter. This will rebuild the frontend every time you change a file in `frontend/src`.

You can leverage the auto-reload feature in your browser by using the livereload extension (https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei).

Open your browser and navigate to http://localhost:8000

You should see the F-Taxes UI.

To stop developing press CTRL+C in both terminals.
