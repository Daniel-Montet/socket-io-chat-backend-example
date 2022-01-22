"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryMessageStore = void 0;
class InMemoryMessageStore {
    constructor() {
        this.messages = [];
    }
    saveMessage(message) {
        this.messages.push(message);
    }
    findMessagesForUser(userID) {
        return this.messages.filter(({ from, to }) => from === userID || to === userID);
    }
}
exports.InMemoryMessageStore = InMemoryMessageStore;
//# sourceMappingURL=messageStore.js.map