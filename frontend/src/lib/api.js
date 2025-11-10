import axios from 'axios';
import { getAuthToken } from './auth.js';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function apiClient() {
	const token = await getAuthToken();
	return axios.create({
		baseURL: `${apiBase}/api`,
		headers: {
			Authorization: `Bearer ${token}`
		},
		withCredentials: true
	});
}

export async function listUsers(q = '') {
	const client = await apiClient();
	const res = await client.get('/users', { params: { q } });
	return res.data;
}

export async function syncProfile(displayName, imageUrl) {
	const client = await apiClient();
	const res = await client.post('/users/sync', { displayName, imageUrl });
	return res.data;
}

export async function listConversations() {
	const client = await apiClient();
	const res = await client.get('/conversations');
	return res.data;
}

export async function ensureConversation(withUserId) {
	const client = await apiClient();
	const res = await client.post('/conversations', { withUserId });
	return res.data;
}

export async function getConversation(conversationId) {
	const client = await apiClient();
	const res = await client.get(`/conversations/${conversationId}`);
	return res.data;
}

export async function listMessages(conversationId) {
	const client = await apiClient();
	const res = await client.get(`/messages/${conversationId}`);
	return res.data;
}

export async function sendMessage(conversationId, text) {
	const client = await apiClient();
	const res = await client.post('/messages', { conversationId, text });
	return res.data;
}


