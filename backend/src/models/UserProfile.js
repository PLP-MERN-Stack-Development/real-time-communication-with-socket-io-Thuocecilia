import mongoose from 'mongoose';

const UserProfileSchema = new mongoose.Schema({
	clerkId: { type: String, required: true, index: true, unique: true },
	email: { type: String, index: true },
	displayName: { type: String, index: true },
	imageUrl: { type: String }
}, {
	timestamps: true
});

export const UserProfile = mongoose.model('UserProfile', UserProfileSchema);


