import { useAuth, useUser } from '@clerk/clerk-react';

export async function getAuthToken() {
	// This module can be called outside React via import; dynamic import of Clerk hook state is not possible.
	// Instead, the socket module will receive token from a provided function in components.
	// For REST, we fallback to reading from window.clerk if available.
	const w = typeof window !== 'undefined' ? window : {};
	const clerk = w.Clerk || w.__clerk;
	if (clerk?.session) {
		return await clerk.session.getToken({ template: import.meta.env.VITE_CLERK_JWT_TEMPLATE || 'integration_fallback' });
	}
	// If no token available, return empty to avoid crashing; callers should ensure auth context
	return '';
}

export function useAuthHelpers() {
	const { getToken, isSignedIn } = useAuth();
	const { user } = useUser();
	const getJwt = async () => {
		return await getToken({ template: import.meta.env.VITE_CLERK_JWT_TEMPLATE || 'integration_fallback' });
	};
	return { getJwt, isSignedIn, user };
}


