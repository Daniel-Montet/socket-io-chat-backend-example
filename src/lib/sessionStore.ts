export interface session {
	userID: string
	username: string
	connected: boolean
}

interface SessionStore {
	findSession(id: string): session,
	saveSession(id: string, session: session): any,
	findAllSessions(): session[]
}

export class InMemorySessionStore implements SessionStore {
	private sessions;
	constructor() {
		this.sessions = new Map()
	}

	findSession(id: any) {
		return this.sessions.get(id);
	}

	saveSession(id: any, session: any) {
		return this.sessions.set(id, session);
	}

	findAllSessions(): session[] {
		return [...this.sessions.values()]
	}
}

