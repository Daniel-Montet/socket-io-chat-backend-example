import "reflect-metadata";
import http from "http"
import express from "express";
import { Server, Socket } from "socket.io"
import cors from "cors";
// import { createConnection } from "typeorm";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

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
// createConnection({
// 	type: "postgres",
// 	host: "localhost",
// 	port: 5432,
// 	username: "chat",
// 	password: "chat1234",
// 	database: "chat",
// 	entities: [
// 	],
// 	synchronize: true,
// 	logging: false
// }).then(connection => {
// 	console.log("connected to database successfully")
// }).catch(error => console.log(error));


interface socket extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> {
	username?: string
}


io.use((socket: socket, next) => {
	const username = socket.handshake.auth.username;
	if (!username) {
		return next(new Error("Invalid username"))
	}
	socket.username = username;
	next()
})


io.on("connection", (socket: socket) => {
	console.log(`${socket.username} connected`);

	const users = [];
	for (let [id, socket] of io.of("/").sockets) {
		let socketType: socket = socket;
		users.push({
			userID: id,
			username: socketType.username
		});
	}
	socket.emit("users", users);

	socket.broadcast.emit("user connected", {
		userID: socket.id,
		username: socket.username,
	});

	socket.on('disconnect', () => {
		console.error(`${socket.username} disconnected`);
		socket.broadcast.emit("user disconnected", {
			userID: socket.id,
			username: socket.username
		})
	});

	socket.on('private message', ({ message, to }) => {
		console.log(message)
		socket.to(to).emit("private message", {
			message,
			from: socket.id
		})
	})


})

server.listen(8000, () => {
	console.log('listening on port 8000')
})
