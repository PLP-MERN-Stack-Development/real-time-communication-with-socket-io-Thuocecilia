import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
	conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
	senderId: { type: String, required: true, index: true }, // Clerk ID
	text: { type: String, required: true },
	readBy: { type: [String], default: [] }, // Clerk IDs
	status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent', index: true }
}, {
	timestamps: true
});

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.model('Message', MessageSchema);


