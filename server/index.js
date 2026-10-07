import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const cookieName = "pathwise_session";
const sessionDuration = 14 * 24 * 60 * 60 * 1000;
const hash = (value) => createHash("sha256").update(value).digest("hex");

export function createServerApp({ dbPath = process.env.PATHWISE_DB_PATH || join(root, "data", "pathwise.sqlite") } = {}) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_state (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      state_json TEXT NOT NULL, updated_at TEXT NOT NULL
    );
  `);

  const send = (res, status, body, headers = {}) => {
    res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", ...headers });
    res.end(JSON.stringify(body));
  };
  const readBody = (req) => new Promise((resolveBody, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > 70_000) { reject(new Error("Request too large")); req.destroy(); }
    });
    req.on("end", () => {
      try { resolveBody(body ? JSON.parse(body) : {}); }
      catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
  const readCookie = (req) => {
    const entry = (req.headers.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(cookieName + "="));
    return entry?.slice(cookieName.length + 1);
  };
  const currentUser = (req) => {
    const token = readCookie(req);
    if (!token) return null;
    return db.prepare("SELECT users.id,users.name,users.email FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires_at>?").get(hash(token), Date.now()) || null;
  };
  const issueSession = (userId) => {
    const token = randomBytes(32).toString("base64url");
    db.prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").run(hash(token), userId, Date.now() + sessionDuration);
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return `${cookieName}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${sessionDuration / 1000}${secure}`;
  };
  const staticFile = (req, res, pathname) => {
    const relative = pathname === "/" ? "index.html" : decodeURIComponent(pathname.slice(1));
    const dist = resolve(root, "dist");
    const requested = resolve(dist, relative);
    if (requested !== dist && !requested.startsWith(dist + sep)) return send(res, 404, { error: "Not found." });
    const file = existsSync(requested) ? requested : join(dist, "index.html");
    if (!existsSync(file)) return send(res, 503, { error: "Build the app with npm run build before starting production mode." });
    const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2" };
    res.writeHead(200, { "content-type": `${types[extname(file)] || "application/octet-stream"}; charset=utf-8`, "x-content-type-options": "nosniff" });
    res.end(readFileSync(file));
  };

  const server = createServer(async (req, res) => {
    const pathname = new URL(req.url || "/", "http://localhost").pathname;
    try {
      if (pathname === "/api/health" && req.method === "GET") return send(res, 200, { ok: true, service: "PATHWISE" });
      if (pathname === "/api/auth/register" && req.method === "POST") {
        const { name, email, password } = await readBody(req);
        const cleanName = typeof name === "string" ? name.trim() : "";
        const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        if (cleanName.length < 2 || cleanName.length > 80 || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(cleanEmail) || typeof password !== "string" || password.length < 12 || password.length > 128) return send(res, 400, { error: "Enter a name, valid email, and password with at least 12 characters." });
        const salt = randomBytes(16).toString("hex");
        const id = randomBytes(16).toString("hex");
        try {
          db.prepare("INSERT INTO users(id,name,email,salt,password_hash,created_at) VALUES(?,?,?,?,?,?)").run(id, cleanName, cleanEmail, salt, scryptSync(password, salt, 64).toString("hex"), new Date().toISOString());
        } catch {
          return send(res, 409, { error: "An account with that email already exists." });
        }
        return send(res, 201, { user: { id, name: cleanName, email: cleanEmail } }, { "set-cookie": issueSession(id) });
      }
      if (pathname === "/api/auth/login" && req.method === "POST") {
        const { email, password } = await readBody(req);
        const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        const user = db.prepare("SELECT id,name,email,salt,password_hash FROM users WHERE email=?").get(cleanEmail);
        const salt = user?.salt || "pathwise-fixed-dummy-salt";
        const actual = scryptSync(typeof password === "string" ? password : "", salt, 64);
        const expected = Buffer.from(user?.password_hash || "00".repeat(64), "hex");
        if (!user || !timingSafeEqual(actual, expected)) return send(res, 401, { error: "Email or password is incorrect." });
        return send(res, 200, { user: { id: user.id, name: user.name, email: user.email } }, { "set-cookie": issueSession(user.id) });
      }
      if (pathname === "/api/auth/me" && req.method === "GET") {
        const user = currentUser(req);
        return user ? send(res, 200, { user }) : send(res, 401, { error: "Not signed in." });
      }
      if (pathname === "/api/auth/logout" && req.method === "POST") {
        const token = readCookie(req);
        if (token) db.prepare("DELETE FROM sessions WHERE token_hash=?").run(hash(token));
        return send(res, 200, { ok: true }, { "set-cookie": `${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0` });
      }
      if (pathname === "/api/state" && ["GET", "PUT"].includes(req.method)) {
        const user = currentUser(req);
        if (!user) return send(res, 401, { error: "Sign in to access account progress." });
        if (req.method === "GET") {
          const saved = db.prepare("SELECT state_json FROM app_state WHERE user_id=?").get(user.id);
          return send(res, 200, saved ? JSON.parse(saved.state_json) : {});
        }
        const state = await readBody(req);
        if (!state || typeof state !== "object" || Array.isArray(state)) return send(res, 400, { error: "Progress must be a JSON object." });
        delete state.checkins;
        const stateJson = JSON.stringify(state);
        if (stateJson.length > 60_000) return send(res, 413, { error: "Saved progress is too large." });
        db.prepare("INSERT INTO app_state(user_id,state_json,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json,updated_at=excluded.updated_at").run(user.id, stateJson, new Date().toISOString());
        return send(res, 200, { ok: true });
      }
      if (pathname.startsWith("/api/")) return send(res, 404, { error: "Not found." });
      return staticFile(req, res, pathname);
    } catch (error) {
      const status = error.message === "Request too large" ? 413 : error.message === "Invalid JSON" ? 400 : 500;
      if (!res.headersSent) send(res, status, { error: status === 500 ? "Something went wrong. Please try again." : error.message });
    }
  });
  server.on("close", () => db.close());
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8787);
  const server = createServerApp();
  server.listen(port, "127.0.0.1", () => console.log(`PATHWISE server listening at http://127.0.0.1:${port}`));
}
