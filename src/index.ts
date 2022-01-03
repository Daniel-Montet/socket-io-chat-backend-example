import "reflect-metadata";
import http from "http"
import express from "express";
import { Server } from "socket.io"
import { socket } from "./lib/interfaces/socket";
import crypto from "crypto";
import { InMemorySessionStore, session } from "./lib/sessionStore";
import { InMemoryMessageStore } from "./lib/messageStore";

// express & SocketIo init
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:3000" } });

const randomId = () => crypto.randomBytes(8).toString("hex");
const sessionStore = new InMemorySessionStore();
const messageStore = new InMemoryMessageStore();


app.get("/", (req, res) => {
	console.log("hello")
	res.send("hi")
})

io.use((socket: socket, next) => {
	const sessionID = socket.handshake.auth.sessionID;
	if (sessionID) {
		const session = sessionStore.findSession(sessionID);
		if (session) {
			socket.sessionID = sessionID;
			socket.userID = session.userID;
			socket.username = session.username;
			return next()
		}
	}

	const username = socket.handshake.auth.username;
	if (!username) {
		return next(new Error("Invalid username"));
	}
	socket.sessionID = randomId();
	socket.userID = randomId();
	socket.username = username;
	next();
})


io.on("connection", async (socket: socket) => {
	// persist session
	sessionStore.saveSession(socket.sessionID, {
		userID: socket.userID,
		username: socket.username,
		connected: true
	})

	// emit session details
	socket.emit("session", {
		sessionID: socket.sessionID,
		userID: socket.userID,
		username: socket.username
	})

	// join the "userID" room
	socket.join(socket.userID!)

	// fetch existing users and sort messages
	console.log(`${socket.username} connected`);
	const users: any[] = [];
	const [messages, sessions] = await Promise.all([
		messageStore.findMessagesForUser(socket.userID!),
		sessionStore.findAllSessions()
	]);

	/**
	socket.userID's sample messages array
	  [
		  { from:"ken",to: "john",content:"message1" },
		   { from:"john",to:"ken",content:"message2" }
	 ]

	 socket.userID's messagesPerUser sample result
	 [
		"john": [
			{from: "ken", to:"john", content:"message1" },
			{from: "john", to: "ken", content: "message2"}
		]
	 ]

	Logic ==>  we search for all messages in our message store belonging to
		 the current connecting socket, if any..
		 using the 'to' and 'from' properties of each message found, 
		 we can derive whether a message was to or from the current connecting 
		 user ==> result is messagesPerUser Map

		 we then loop the existing users and assign their respective messages
		 if any matches their userID..
		 the resulting users array is of type
		 [
			 {
				userID: 'john',
				username: 'john',
				connected: true,
				messages: [
						{	from: "ken", to:"john", content:"message1" },
						{from: "john", to: "ken", content: "message2"}
		]
			 }
		 ] 
	 */
	const messagesPerUser = new Map();
	messages.forEach(message => {
		const { from, to } = message;
		const otherUser = socket.userID === from ? to : from;
		if (messagesPerUser.has(otherUser)) {
			messagesPerUser.get(otherUser).push(message);
		} else {
			messagesPerUser.set(otherUser, [message]);
		}
	})
	sessions.forEach((session: session) => {
		users.push({
			userID: session.userID,
			username: session.username,
			connected: session.connected,
			messages: messagesPerUser.get(session.userID) || []
		})
	})
	socket.emit("users", users);

	// notify existing users
	socket.broadcast.emit("user connected", {
		userID: socket.userID,
		username: socket.username,
		connected: true,
		messages: []
	});

	// forward the private message to the right recepient 
	// (and to other tabs of the sender as well)
	socket.on('private message', ({ content, to }) => {
		const message = {
			content,
			from: socket.userID!,
			to,
		};

		socket.to(to).to(socket.userID!).emit("private message", message)
		messageStore.saveMessage(message!);
	})

	// notify users upon disconnection
	socket.on('disconnect', async () => {
		const matchingSockets = await io.in(socket.userID!).allSockets()
		const isDisconnected = matchingSockets.size === 0;
		if (isDisconnected) {
			// notify other users
			socket.broadcast.emit("user disconnected", socket.userID);
			// update the connection status of the session
			sessionStore.saveSession(socket.sessionID, {
				userID: socket.userID,
				username: socket.username,
				connected: false,
			});
		}

	});

})

server.listen(8000, () => {
	console.log('listening on port 8000')
})
