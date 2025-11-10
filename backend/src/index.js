import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import createError from 'http-errors';
import { Server as SocketIOServer } from 'socket.io';
import { applySocketAuth, registerSocketHandlers } from './socket/index.js';
import { usersRouter } from './routes/users.js';
import { conversationsRouter } from './routes/conversations.js';
import { messagesRouter } from './routes/messages.js';
import { clerkAuthMiddleware } from './middleware/auth.js';
import { getAllowedOrigins } from './utils/origins.js';

dotenv.config();

const app = express();

const allowedOrigins = getAllowedOrigins(process.env.ALLOWED_ORIGINS);
app.use(cors({
	origin: allowedOrigins,
	credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/', (_req, res) => {
	res.send('Meridian Chat API');
});

app.get('/healthz', (_req, res) => {
	res.json({ status: 'ok' });
});

// All API routes require auth
app.use('/api', clerkAuthMiddleware);
app.use('/api/users', usersRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/messages', messagesRouter);

// 404
app.use((_req, _res, next) => next(createError(404, 'Not Found')));

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
	const status = err.status || 500;
	const message = status === 500 ? 'Internal Server Error' : err.message;
	res.status(status).json({ error: message });
});

const server = http.createServer(app);

const io = new SocketIOServer(server, {
	cors: {
		origin: allowedOrigins,
		credentials: true
	}
});

applySocketAuth(io);
registerSocketHandlers(io);

const PORT = Number(process.env.PORT || 5000);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meridian-chat';

async function start() {
	try {
		await mongoose.connect(MONGODB_URI);
		server.listen(PORT, () => {
			console.log(`API listening on http://localhost:${PORT}`);
		});
	} catch (err) {
		console.error('Failed to start server', err);
		process.exit(1);
	}
}

start();


