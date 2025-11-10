import { createClerkClient, verifyToken } from '@clerk/backend';

const clerk = createClerkClient({
	secretKey: process.env.CLERK_SECRET_KEY,
	publishableKey: process.env.CLERK_PUBLISHABLE_KEY
});

export async function clerkAuthMiddleware(req, res, next) {
	try {
		const authHeader = req.headers.authorization || '';
		const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
		if (!token) {
			return res.status(401).json({ error: 'Missing Bearer token' });
		}
		const template = process.env.CLERK_JWT_TEMPLATE || 'integration_fallback';
		const payload = await verifyToken(token, {
			secretKey: process.env.CLERK_SECRET_KEY,
			template
		});
		req.auth = {
			userId: payload.sub,
			sessionId: payload.sid,
			email: payload.email,
			image: payload.image
		};
		req.clerk = clerk;
		next();
	} catch (err) {
		return res.status(401).json({ error: 'Invalid or expired token' });
	}
}


