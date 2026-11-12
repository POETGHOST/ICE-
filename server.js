
const express = require("express");
const http = require("http");
const path = require("path");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const { Pool } = require("pg");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const DATABASE_URL = process.env.DATABASE_URL;

if (!JWT_SECRET || !DATABASE_URL) {
  throw new Error("Missing JWT_SECRET or DATABASE_URL environment variables");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false
});

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30
}));

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(30) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id BIGSERIAL PRIMARY KEY,
      sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

function createToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : "";

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Please sign in" });
  }
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "ICE" });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !/^[a-zA-Z0-9_]{3,30}$/.test(username) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 10 ||
      password.length > 128
    ) {
      return res.status(400).json({
        error: "Use a valid username, email and password of at least 10 characters"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email`,
      [username, email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];

    res.status(201).json({
      user,
      token: createToken(user)
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Username or email already exists"
      });
    }
    console.error(error);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [String(email || "").toLowerCase()]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(
      String(password || ""),
      user.password_hash
    ))) {
      return res.status(401).json({
        error: "Incorrect email or password"
      });
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    res.json({
      user: safeUser,
      token: createToken(safeUser)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
});
app.get("/api/users", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username
       FROM users
       WHERE id <> $1
       ORDER BY username ASC
       LIMIT 100`,
      [req.user.id]
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error("User directory error:", error);
    res.status(500).json({ error: "Could not load users" });
  }
});
app.get("/api/me", authenticate, async (req, res) => {
  const result = await pool.query(
    "SELECT id, username, email FROM users WHERE id = $1",
    [req.user.id]
  );

  if (!result.rows[0]) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({ user: result.rows[0] });
});

app.get("/api/messages/:userId", authenticate, async (req, res) => {
  const otherId = Number(req.params.userId);

  if (!Number.isInteger(otherId) || otherId < 1) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const result = await pool.query(
    `SELECT id, sender_id, recipient_id, body, created_at
     FROM messages
     WHERE (sender_id = $1 AND recipient_id = $2)
        OR (sender_id = $2 AND recipient_id = $1)
     ORDER BY created_at ASC
     LIMIT 200`,
    [req.user.id, otherId]
  );

  res.json({ messages: result.rows });
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    socket.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    next(new Error("Authentication required"));
  }
});

io.on("connection", socket => {
  socket.join(`user:${socket.user.id}`);

  socket.on("private message", async data => {
    try {
      const recipientId = Number(data.recipientId);
      const body = String(data.body || "").trim();

      if (
        !Number.isInteger(recipientId) ||
        recipientId < 1 ||
        recipientId === socket.user.id ||
        !body ||
        body.length > 2000
      ) return;

      const recipient = await pool.query(
        "SELECT id FROM users WHERE id = $1",
        [recipientId]
      );

      if (!recipient.rows.length) return;

      const result = await pool.query(
        `INSERT INTO messages (sender_id, recipient_id, body)
         VALUES ($1, $2, $3)
         RETURNING id, sender_id, recipient_id, body, created_at`,
        [socket.user.id, recipientId, body]
      );

      const message = result.rows[0];

      io.to(`user:${recipientId}`)
        .to(`user:${socket.user.id}`)
        .emit("private message", message);
    } catch (error) {
      console.error("Message error:", error);
    }
  });
});

async function start() {
  await initializeDatabase();

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`ICE server listening on port ${PORT}`);
  });
}

start().catch(error => {
  console.error("ICE startup failed:", error);
  process.exit(1);
});
