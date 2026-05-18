const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");

const PORT = Number(process.env.AUTH_PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-change-me";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "auth-db.json");
const CODE_TTL_MS = 10 * 60 * 1000;

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }, null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function base64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function signJwt(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const body = { ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12 };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(body))}`;
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

function verifyJwt(token) {
  const [encodedHeader, encodedPayload, signature] = String(token || "").split(".");
  if (!encodedHeader || !encodedPayload || !signature) return null;
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const expected = crypto.createHmac("sha256", JWT_SECRET).update(unsigned).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function checkPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const candidate = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

function hashCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    provider: user.provider || "password",
  };
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => resolve(body ? JSON.parse(body) : {}));
    req.on("error", reject);
  });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function validateSignup({ fullName, username, email, password }) {
  if (!String(fullName || "").trim()) return "Full name is required.";
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(String(username || ""))) return "Username must be 3-24 letters, numbers, or underscores.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""))) return "Enter a valid email address.";
  if (String(password || "").length < 8) return "Password must be at least 8 characters.";
  return "";
}

function issueVerification(user) {
  const code = String(crypto.randomInt(100000, 999999));
  user.verificationCodeHash = hashCode(code);
  user.verificationCodeExpiresAt = Date.now() + CODE_TTL_MS;
  console.log(`Verification code for ${user.email}: ${code}`);
}

function authPayload(user) {
  return {
    token: signJwt({ sub: user.id, email: user.email }),
    user: publicUser(user),
  };
}

async function verifyGoogleToken(idToken) {
  if (!GOOGLE_CLIENT_ID) throw new Error("Google sign-in is not configured on the server.");
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!response.ok) throw new Error("Google token verification failed.");
  const profile = await response.json();
  if (profile.aud !== GOOGLE_CLIENT_ID) throw new Error("Google token audience mismatch.");
  if (!profile.email_verified) throw new Error("Google account email is not verified.");
  return profile;
}

async function handleApi(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 200, {});
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === "POST" && url.pathname === "/api/auth/signup") {
      const body = await readBody(req);
      const error = validateSignup(body);
      if (error) return sendJson(res, 400, { error });

      const db = readDb();
      const email = normalizeEmail(body.email);
      const username = normalizeUsername(body.username);
      if (db.users.some((user) => user.email === email)) return sendJson(res, 409, { error: "Email is already registered." });
      if (db.users.some((user) => user.username === username)) return sendJson(res, 409, { error: "Username is already taken." });

      const user = {
        id: crypto.randomUUID(),
        fullName: String(body.fullName).trim(),
        username,
        email,
        passwordHash: hashPassword(body.password),
        emailVerified: false,
        provider: "password",
        createdAt: new Date().toISOString(),
      };
      issueVerification(user);
      db.users.push(user);
      writeDb(db);
      return sendJson(res, 201, { ...authPayload(user), message: "Verification code sent. In development it is printed in the server console." });
    }

    if (req.method === "POST" && url.pathname === "/api/auth/verify-email") {
      const { email, code } = await readBody(req);
      const db = readDb();
      const user = db.users.find((item) => item.email === normalizeEmail(email));
      if (!user) return sendJson(res, 404, { error: "No account found for that email." });
      if (user.emailVerified) return sendJson(res, 200, authPayload(user));
      if (!user.verificationCodeHash || Date.now() > user.verificationCodeExpiresAt) return sendJson(res, 400, { error: "Verification code expired. Request a new code." });
      if (user.verificationCodeHash !== hashCode(code)) return sendJson(res, 400, { error: "Invalid verification code." });
      user.emailVerified = true;
      delete user.verificationCodeHash;
      delete user.verificationCodeExpiresAt;
      writeDb(db);
      return sendJson(res, 200, authPayload(user));
    }

    if (req.method === "POST" && url.pathname === "/api/auth/resend-code") {
      const { email } = await readBody(req);
      const db = readDb();
      const user = db.users.find((item) => item.email === normalizeEmail(email));
      if (!user) return sendJson(res, 404, { error: "No account found for that email." });
      issueVerification(user);
      writeDb(db);
      return sendJson(res, 200, { message: "Verification code sent. In development it is printed in the server console." });
    }

    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      const { emailOrUsername, password } = await readBody(req);
      const login = normalizeEmail(emailOrUsername);
      const db = readDb();
      const user = db.users.find((item) => item.email === login || item.username === normalizeUsername(emailOrUsername));
      if (!user || user.provider !== "password" || !checkPassword(password, user.passwordHash)) {
        return sendJson(res, 401, { error: "Invalid credentials." });
      }
      return sendJson(res, 200, authPayload(user));
    }

    if (req.method === "POST" && url.pathname === "/api/auth/google") {
      const { credential } = await readBody(req);
      const profile = await verifyGoogleToken(credential);
      const db = readDb();
      const email = normalizeEmail(profile.email);
      let user = db.users.find((item) => item.email === email);
      if (!user) {
        const baseUsername = normalizeUsername((profile.email || "").split("@")[0]).replace(/[^a-z0-9_]/g, "").slice(0, 18) || "google_user";
        let username = baseUsername;
        let suffix = 1;
        while (db.users.some((item) => item.username === username)) {
          username = `${baseUsername}${suffix}`;
          suffix += 1;
        }
        user = {
          id: crypto.randomUUID(),
          fullName: profile.name || email,
          username,
          email,
          emailVerified: true,
          provider: "google",
          createdAt: new Date().toISOString(),
        };
        db.users.push(user);
      } else {
        user.emailVerified = true;
      }
      writeDb(db);
      return sendJson(res, 200, authPayload(user));
    }

    if (req.method === "GET" && url.pathname === "/api/auth/me") {
      const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      const payload = verifyJwt(token);
      if (!payload) return sendJson(res, 401, { error: "Invalid or expired token." });
      const db = readDb();
      const user = db.users.find((item) => item.id === payload.sub);
      if (!user) return sendJson(res, 401, { error: "User not found." });
      return sendJson(res, 200, { user: publicUser(user) });
    }

    if (
      (req.method === "DELETE" && url.pathname === "/api/auth/account") ||
      (req.method === "POST" && url.pathname === "/api/auth/delete-account")
    ) {
      const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      const payload = verifyJwt(token);
      if (!payload) return sendJson(res, 401, { error: "Invalid or expired token." });

      const db = readDb();
      const user = db.users.find((item) => item.id === payload.sub);
      if (!user) return sendJson(res, 404, { error: "User not found." });

      db.users = db.users.filter((item) => item.id !== payload.sub);
      writeDb(db);
      return sendJson(res, 200, { message: "Account deleted." });
    }

    return sendJson(res, 404, { error: "Not found." });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || "Server error." });
  }
}

http.createServer(handleApi).listen(PORT, () => {
  console.log(`Auth API listening on http://localhost:${PORT}`);
  if (JWT_SECRET === "dev-only-change-me") {
    console.log("Set JWT_SECRET before using this outside local development.");
  }
});
