## Features
  - Private Messaging
  - New Message notification
  - In Memory session
  - Send Message to yourself
  - User Connection status

## Getting Started

First, clone repo and install dependancies,:

```bash
npm install
# or
yarn install
```

## Running development server

RUN
```
npm run dev
# or
yarn dev
# or 
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```
Open [http://localhost:8000](http://localhost:8000) with your browser to see the result.

## Clone client and run it as well

The client repository can be found [here](https://github.com/Daniel-Montet/socket-io-nextjs-chat-client-example/)


## TO DO
- Add a Redis inmemory data store
- Scale the app


## Licence (MIT)
