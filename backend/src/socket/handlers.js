import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { emitConversationUpdate, emitNewMessage, userRoom } from './events.js';

export function bindSocketHandlers(io, socket) {
	const userId = socket.data.userId;
	// join user personal room for cross-conversation updates
	if (userId) {
		socket.join(userRoom(userId));
	}

	socket.on('conversation:join', async (conversationId) => {
		socket.join(roomName(conversationId));
	});

	socket.on('conversation:leave', async (conversationId) => {
		socket.leave(roomName(conversationId));
	});

	socket.on('message:new', async (payload, cb) => {
		try {
			const { conversationId, text } = payload || {};
			if (!conversationId || typeof text !== 'string' || !text.trim()) {
				throw new Error('Invalid payload');
			}
			const convo = await Conversation.findById(conversationId);
			if (!convo || !convo.members.includes(userId)) throw new Error('Unauthorized');
			const msg = await Message.create({
				conversationId,
				senderId: userId,
				text: text.trim(),
				readBy: [userId],
				status: 'sent'
			});
			convo.lastMessageAt = msg.createdAt;
			convo.lastMessageText = msg.text;
			convo.lastMessageSenderId = userId;
			for (const member of convo.members) {
				if (member === userId) continue;
				const current = Number(convo.unreadCounts.get(member) || 0);
				convo.unreadCounts.set(member, current + 1);
			}
			await convo.save();

			emitNewMessage(conversationId, msg.toObject(), io);
			emitConversationUpdate(convo, io);
			cb && cb({ ok: true, messageId: String(msg._id) });
		} catch (e) {
			cb && cb({ ok: false, error: e.message });
		}
	});
}

export function roomName(conversationId) {
	return `conversation:${conversationId}`;
}


