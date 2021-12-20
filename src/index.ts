import http from "http"
import express from "express";
import { Server } from "socket.io"
import cors from "cors";


const app = express();
const server = http.createServer(app);
const io = new Server(server);
// express configs
let whitelist = [
	"http://localhost:3000",
	"ws://localhost:3000",
]
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

io.on("connection", (socket) => {
	console.info("a user connected");
	socket.on('disconnect', () => {
		console.error('user disconnected');
	})
})

server.listen(5000, () => {
	console.log('listening on port 3000')
})
