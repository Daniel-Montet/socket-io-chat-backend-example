interface Store {
	saveMessage(message: message): void
	findMessagesForUser(userID: string): any
}

export interface message {
	content: string,
	from: string,
	to: string
}

export class InMemoryMessageStore implements Store {
	private messages: any[];
	constructor() {
		this.messages = [];
	}

	saveMessage(message: message): void {
		this.messages.push(message)
	}

	findMessagesForUser(userID: string) {
		return this.messages.filter(
			({ from, to }) => from === userID || to === userID
		)
	}
}