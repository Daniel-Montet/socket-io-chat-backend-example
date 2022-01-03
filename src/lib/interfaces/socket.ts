import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export interface socket extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> {
	username?: string
	sessionID?: string
	userID?: string
}
