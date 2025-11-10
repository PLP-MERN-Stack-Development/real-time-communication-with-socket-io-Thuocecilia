import { Router } from 'express';
import { UserProfile } from '../models/UserProfile.js';

export const usersRouter = Router();

// GET /api/users - list directory
usersRouter.get('/', async (req, res) => {
	const q = (req.query.q || '').toString().trim();
	const query = q.length ? {
		$or: [
			{ displayName: { $regex: q, $options: 'i' } },
			{ email: { $regex: q, $options: 'i' } }
		]
	} : {};
	const users = await UserProfile.find(query).sort({ displayName: 1 }).limit(50).lean();
	res.json(users);
});

// POST /api/users/sync - upsert current user's profile
usersRouter.post('/sync', async (req, res) => {
	const { userId, email, image } = req.auth;
	const displayName = req.body.displayName || email?.split('@')[0] || 'User';
	const imageUrl = req.body.imageUrl || image || '';
	const upsert = await UserProfile.findOneAndUpdate(
		{ clerkId: userId },
		{ $set: { email, displayName, imageUrl } },
		{ upsert: true, new: true }
	);
	res.json(upsert);
});


