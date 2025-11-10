import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function createAuthedSocket(getToken) {
	const socket = io(socketUrl, {
		autoConnect: false,
		transports: ['websocket'],
		auth: async (cb) => {
			try {
				const token = await getToken();
				cb({ token });
			} catch {
				cb({ token: '' });
			}
		}
	});
	return socket;
}


