import { Router } from 'express';
import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { emitConversationUpdate, emitNewMessage } from '../socket/events.js';

export const messagesRouter = Router();

// GET /api/messages/:conversationId - history
messagesRouter.get('/:conversationId', async (req, res) => {
	const userId = req.auth.userId;
	const { conversationId } = req.params;
	if (!mongoose.isValidObjectId(conversationId)) {
		return res.status(400).json({ error: 'Invalid conversationId' });
	}
	const convo = await Conversation.findById(conversationId);
	if (!convo || !convo.members.includes(userId)) {
		return res.status(404).json({ error: 'Conversation not found' });
	}
	const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).limit(500).lean();
	res.json(messages);
});

// POST /api/messages - send
messagesRouter.post('/', async (req, res) => {
	const userId = req.auth.userId;
	const { conversationId, text } = req.body;
	if (!mongoose.isValidObjectId(conversationId) || typeof text !== 'string' || !text.trim()) {
		return res.status(400).json({ error: 'conversationId and non-empty text are required' });
	}
	const convo = await Conversation.findById(conversationId);
	if (!convo || !convo.members.includes(userId)) {
		return res.status(403).json({ error: 'Not a member of conversation' });
	}
	const msg = await Message.create({
		conversationId,
		senderId: userId,
		text: text.trim(),
		readBy: [userId],
		status: 'sent'
	});
	// update conversation metadata
	convo.lastMessageAt = msg.createdAt;
	convo.lastMessageText = msg.text;
	convo.lastMessageSenderId = userId;
	for (const member of convo.members) {
		if (member === userId) continue;
		const current = Number(convo.unreadCounts.get(member) || 0);
		convo.unreadCounts.set(member, current + 1);
	}
	await convo.save();

	emitNewMessage(conversationId, {
		...msg.toObject(),
	});
	emitConversationUpdate(convo);

	res.status(201).json(msg);
});


