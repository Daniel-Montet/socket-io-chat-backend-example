"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const crypto_1 = __importDefault(require("crypto"));
const sessionStore_1 = require("./lib/sessionStore");
const messageStore_1 = require("./lib/messageStore");
const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV;
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: ["http://localhost:3000", "https://chat-frontend-nine.vercel.app"] } });
const randomId = () => crypto_1.default.randomBytes(8).toString("hex");
const sessionStore = new sessionStore_1.InMemorySessionStore();
const messageStore = new messageStore_1.InMemoryMessageStore();
app.get("/", (_, res) => {
    if (NODE_ENV === "development") {
        res.send(`running in ${NODE_ENV} environment`);
    }
    res.send(`running in ${NODE_ENV} environment`);
});
io.use((socket, next) => {
    const sessionID = socket.handshake.auth.sessionID;
    if (sessionID) {
        const session = sessionStore.findSession(sessionID);
        if (session) {
            socket.sessionID = sessionID;
            socket.userID = session.userID;
            socket.username = session.username;
            return next();
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
});
io.on("connection", async (socket) => {
    sessionStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        connected: true
    });
    socket.emit("session", {
        sessionID: socket.sessionID,
        userID: socket.userID,
        username: socket.username
    });
    socket.join(socket.userID);
    console.log(`${socket.username} connected`);
    const users = [];
    const [messages, sessions] = await Promise.all([
        messageStore.findMessagesForUser(socket.userID),
        sessionStore.findAllSessions()
    ]);
    const messagesPerUser = new Map();
    messages.forEach(message => {
        const { from, to } = message;
        const otherUser = socket.userID === from ? to : from;
        if (messagesPerUser.has(otherUser)) {
            messagesPerUser.get(otherUser).push(message);
        }
        else {
            messagesPerUser.set(otherUser, [message]);
        }
    });
    sessions.forEach((session) => {
        users.push({
            userID: session.userID,
            username: session.username,
            connected: session.connected,
            messages: messagesPerUser.get(session.userID) || []
        });
    });
    socket.emit("users", users);
    socket.broadcast.emit("user connected", {
        userID: socket.userID,
        username: socket.username,
        connected: true,
        messages: []
    });
    socket.on('private message', ({ content, to }) => {
        const message = {
            content,
            from: socket.userID,
            to,
        };
        io.to([to, socket.userID]).emit("private message", message);
        messageStore.saveMessage(message);
    });
    socket.on('disconnect', async () => {
        const matchingSockets = await io.in(socket.userID).allSockets();
        const isDisconnected = matchingSockets.size === 0;
        if (isDisconnected) {
            socket.broadcast.emit("user disconnected", socket.userID);
            sessionStore.saveSession(socket.sessionID, {
                userID: socket.userID,
                username: socket.username,
                connected: false,
            });
        }
    });
});
server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
//# sourceMappingURL=index.js.map