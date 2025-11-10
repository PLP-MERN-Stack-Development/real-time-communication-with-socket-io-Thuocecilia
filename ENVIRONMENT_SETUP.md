# Environment Setup

## Backend (`backend/.env`)

Create a file `backend/.env` with:

```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/meridian-chat
CLERK_SECRET_KEY=sk_test_your_key
CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_JWT_TEMPLATE=integration_fallback
ALLOWED_ORIGINS=http://localhost:5173
```

If `ALLOWED_ORIGINS` is not set, the server allows `http://localhost:5173` and `http://127.0.0.1:5173`.

## Frontend (`frontend/.env`)

Create a file `frontend/.env` with:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key
VITE_CLERK_JWT_TEMPLATE=integration_fallback
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

Ensure your Clerk JWT template includes `sub`, `sid`, `email`, and `image` claims.


