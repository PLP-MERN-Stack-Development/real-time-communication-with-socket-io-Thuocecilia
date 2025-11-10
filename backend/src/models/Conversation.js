import mongoose from 'mongoose';

const UnreadCountsSchema = new mongoose.Schema({}, { strict: false, _id: false });

const ConversationSchema = new mongoose.Schema({
	members: { type: [String], required: true, index: true }, // Clerk IDs
	lastMessageAt: { type: Date, index: true },
	lastMessageText: { type: String },
	lastMessageSenderId: { type: String },
	unreadCounts: { type: Map, of: Number, default: {} } // key: clerkId
}, {
	timestamps: true
});

ConversationSchema.index({ members: 1 });
ConversationSchema.index({ updatedAt: -1 });
ConversationSchema.index({ lastMessageAt: -1 });

export const Conversation = mongoose.model('Conversation', ConversationSchema);


