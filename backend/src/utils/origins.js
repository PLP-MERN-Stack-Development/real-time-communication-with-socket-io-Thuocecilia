export function getAllowedOrigins(originsEnv) {
	if (originsEnv && originsEnv.trim().length > 0) {
		return originsEnv.split(',').map(o => o.trim());
	}
	return ['http://localhost:5173', 'http://127.0.0.1:5173'];
}


