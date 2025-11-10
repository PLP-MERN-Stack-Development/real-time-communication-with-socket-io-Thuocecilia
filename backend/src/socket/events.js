import { roomName } from './handlers.js';

export function emitNewMessage(conversationId, message, ioRef) {
	const io = ioRef || globalIo();
	io.to(roomName(conversationId)).emit('message:new', message);
}

export function emitConversationUpdate(conversation, ioRef) {
	const io = ioRef || globalIo();
	// Emit to all members as they may be on conversation list view
	for (const member of conversation.members) {
		io.to(userRoom(member)).emit('conversation:update', conversation);
	}
}

export function userRoom(userId) {
	return `user:${userId}`;
}

function globalIo() {
	// Fallback no-op for tests; in runtime we pass io explicitly
	return {
		to() { return { emit() {} }; }
	};
}


