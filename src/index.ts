import "reflect-metadata";
import http from "http"
import express from "express";
import { Server } from "socket.io"
import cors from "cors";
import { createConnection } from "typeorm";

// express & SocketIo init
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:3000" } });

// express configs
let whitelist = ["http://localhost:3000"]
let corsOptions = {
	origin: function (origin: any, callback: any) {
		if (whitelist.indexOf(origin) !== -1) {
			callback(null, true)
		} else {
			callback(new Error('Not allowed by CORS'))
		}
	}
}

app.use(cors(corsOptions));

app.get('/', (req, res) => {
	res.send("Hello world");
})


// typeorm initialization
createConnection({
	type: "postgres",
	host: "localhost",
	port: 5432,
	username: "chat",
	password: "chat1234",
	database: "chat",
	entities: [
	],
	synchronize: true,
	logging: false
}).then(connection => {
	console.log("connected to database successfully")
}).catch(error => console.log(error));



io.on("connection", (socket) => {
	console.info("a user connected");
	socket.on('disconnect', () => {
		console.error('user disconnected');
	});

	socket.on('chat message', (msg) => {
		console.log('message: ' + msg);
	});
})

server.listen(5000, () => {
	console.log('listening on port 3000')
})
