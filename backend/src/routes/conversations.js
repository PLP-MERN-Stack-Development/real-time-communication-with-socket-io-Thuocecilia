import { Router } from 'express';
import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';

export const conversationsRouter = Router();

// GET /api/conversations - list for current user
conversationsRouter.get('/', async (req, res) => {
	const userId = req.auth.userId;
	const conversations = await Conversation.find({ members: userId })
		.sort({ lastMessageAt: -1, updatedAt: -1 })
		.limit(100)
		.lean();
	res.json(conversations);
});

// POST /api/conversations - ensure 1:1 exists
conversationsRouter.post('/', async (req, res) => {
	const userId = req.auth.userId;
	const { withUserId } = req.body;
	if (!withUserId || typeof withUserId !== 'string' || withUserId === userId) {
		return res.status(400).json({ error: 'withUserId is required and must be a different user' });
	}
	const members = [userId, withUserId].sort();
	let convo = await Conversation.findOne({ members: { $all: members, $size: 2 } });
	if (!convo) {
		convo = await Conversation.create({ members, unreadCounts: { [withUserId]: 0, [userId]: 0 } });
	}
	res.json(convo);
});

// GET /api/conversations/:conversationId - detail
conversationsRouter.get('/:conversationId', async (req, res) => {
	const userId = req.auth.userId;
	const { conversationId } = req.params;
	if (!mongoose.isValidObjectId(conversationId)) {
		return res.status(400).json({ error: 'Invalid conversationId' });
	}
	const convo = await Conversation.findById(conversationId).lean();
	if (!convo || !convo.members.includes(userId)) {
		return res.status(404).json({ error: 'Conversation not found' });
	}
	res.json(convo);
});


