import { verifyToken } from '@clerk/backend';
import { bindSocketHandlers } from './handlers.js';

export function applySocketAuth(io) {
	io.use(async (socket, next) => {
		try {
			const token = socket.handshake.auth?.token;
			if (!token) return next(new Error('Missing auth token'));
			const payload = await verifyToken(token, {
				secretKey: process.env.CLERK_SECRET_KEY,
				template: process.env.CLERK_JWT_TEMPLATE || 'integration_fallback',
				clockSkewInSeconds: 10
			});
			socket.data.userId = payload.sub;
			return next();
		} catch (e) {
			return next(new Error('Invalid token'));
		}
	});
}

export function registerSocketHandlers(io) {
	io.on('connection', (socket) => {
		bindSocketHandlers(io, socket);
	});
}


