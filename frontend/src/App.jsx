import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ensureConversation, listConversations, listMessages, listUsers, sendMessage, syncProfile } from './lib/api.js'
import { useAuthHelpers } from './lib/auth.js'
import { createAuthedSocket } from './lib/socket.js'

export default function App() {
	return (
		<div className="h-screen w-screen">
			<SignedOut>
				<div className="h-full flex items-center justify-center">
					<div className="p-8 bg-neutral-800 rounded-xl shadow-lg text-center space-y-4">
						<h1 className="text-2xl font-semibold">Meridian Chat</h1>
						<p className="text-neutral-300">Sign in to start chatting</p>
						<SignInButton mode="modal" />
					</div>
				</div>
			</SignedOut>
			<SignedIn>
				<ChatShell />
			</SignedIn>
		</div>
	)
}

function ChatShell() {
	const { getJwt, user } = useAuthHelpers()
	const socket = useMemo(() => createAuthedSocket(() => getJwt()), [getJwt])
	const [users, setUsers] = useState([])
	const [conversations, setConversations] = useState([])
	const [activeConversation, setActiveConversation] = useState(null)
	const [messages, setMessages] = useState([])
	const [input, setInput] = useState('')
	const endRef = useRef(null)

	useEffect(() => {
		// seed/sync profile on load
		syncProfile(user?.fullName || user?.primaryEmailAddress?.emailAddress || 'User', user?.imageUrl || '').catch(() => {})
	}, [user])

	useEffect(() => {
		listUsers().then(setUsers).catch(() => {})
		listConversations().then(setConversations).catch(() => {})
	}, [])

	useEffect(() => {
		if (!activeConversation?._id) return
		listMessages(activeConversation._id).then(setMessages)
	}, [activeConversation?._id])

	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages.length])

	useEffect(() => {
		socket.connect()
		socket.on('connect', () => {
			if (activeConversation?._id) {
				socket.emit('conversation:join', activeConversation._id)
			}
		})
		socket.on('message:new', (message) => {
			if (message.conversationId === activeConversation?._id) {
				setMessages((prev) => [...prev, message])
			}
			// refresh convo list metadata
			listConversations().then(setConversations).catch(() => {})
		})
		socket.on('conversation:update', (convo) => {
			setConversations((prev) => {
				const map = new Map(prev.map(c => [String(c._id), c]))
				map.set(String(convo._id), convo)
				return Array.from(map.values()).sort((a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt))
			})
		})
		return () => {
			socket.disconnect()
			socket.removeAllListeners()
		}
	}, [socket, activeConversation?._id])

	const startConversation = async (withUserId) => {
		const convo = await ensureConversation(withUserId)
		setActiveConversation(convo)
		socket.emit('conversation:join', convo._id)
		const msgs = await listMessages(convo._id)
		setMessages(msgs)
	}

	const onSend = async () => {
		const text = input.trim()
		if (!text || !activeConversation) return
		setInput('')
		try {
			await sendMessage(activeConversation._id, text)
		} catch {
			// ignore and let socket sync handle optimistic fallback if needed
		}
	}

	return (
		<div className="h-full grid grid-cols-[320px_1fr]">
			<aside className="border-r border-neutral-800 h-full flex flex-col">
				<div className="px-4 py-3 flex items-center justify-between border-b border-neutral-800">
					<h2 className="font-semibold">Meridian Chat</h2>
					<UserButton />
				</div>
				<div className="p-3">
					<h3 className="text-sm text-neutral-400 mb-2">Users</h3>
					<div className="space-y-1 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
						{users.filter(u => u.clerkId !== user?.id).map(u => (
							<button key={u.clerkId} onClick={() => startConversation(u.clerkId)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-800">
								<div className="font-medium">{u.displayName || u.email}</div>
								<div className="text-xs text-neutral-400">{u.email}</div>
							</button>
						))}
					</div>
				</div>
				<div className="px-3 mt-4">
					<h3 className="text-sm text-neutral-400 mb-2">Conversations</h3>
					<div className="space-y-1 overflow-y-auto pr-1 scrollbar-thin">
						{conversations.map(c => (
							<button key={c._id} onClick={() => setActiveConversation(c)} className={`w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-800 ${activeConversation?._id === c._id ? 'bg-neutral-800' : ''}`}>
								<div className="flex items-center justify-between">
									<div className="font-medium">Chat</div>
									{(c.unreadCounts?.[user?.id] || 0) > 0 && <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full">{c.unreadCounts[user.id]}</span>}
								</div>
								<div className="text-xs text-neutral-400 truncate">{c.lastMessageText || 'No messages yet'}</div>
							</button>
						))}
					</div>
				</div>
			</aside>
			<main className="h-full flex flex-col">
				<div className="px-4 py-3 border-b border-neutral-800">
					<div className="font-semibold">{activeConversation ? 'Conversation' : 'Select a conversation'}</div>
				</div>
				<div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
					{!activeConversation && (
						<div className="h-full flex items-center justify-center text-neutral-400">Pick a user or conversation to start</div>
					)}
					{activeConversation && messages.map(m => (
						<div key={m._id} className={`flex ${m.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
							<div className={`max-w-[70%] px-3 py-2 rounded-lg ${m.senderId === user?.id ? 'bg-blue-600 text-white' : 'bg-neutral-800'}`}>
								<div className="whitespace-pre-wrap break-words">{m.text}</div>
								<div className="text-[10px] opacity-70 mt-1">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
							</div>
						</div>
					))}
					<div ref={endRef} />
				</div>
				<div className="p-3 border-t border-neutral-800 flex gap-2">
					<input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' ? onSend() : null} placeholder="Type a message" className="flex-1 bg-neutral-800 rounded-lg px-3 py-2 outline-none" />
					<button onClick={onSend} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500">Send</button>
				</div>
			</main>
		</div>
	)
}


