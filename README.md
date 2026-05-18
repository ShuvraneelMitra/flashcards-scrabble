## Auth setup

Run the React app and the auth API in separate terminals:

```bash
npm run server
npm start
```

The local auth API stores development users in `server/data/auth-db.json`, which is ignored by Git. Email verification codes are printed in the server console unless you replace `issueVerification` in `server/server.js` with a real email provider.

Set these environment variables before production use:

```bash
JWT_SECRET=replace-with-a-long-random-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id
REACT_APP_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

Google sign-in requires the same OAuth client ID on the server and React app.
