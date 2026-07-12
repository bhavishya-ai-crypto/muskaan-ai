// ============================================================
// Simple file-based JSON database.
// Good enough for a prototype / small deployment with zero
// native build dependencies (no node-gyp, works everywhere).
//
// ⚠️ For production with multiple concurrent users, swap this
// for Postgres/MySQL + an ORM (Prisma/Sequelize). The function
// signatures below are written so that swap only touches this file.
// ============================================================
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, "data.json");

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { users: [], plans: [], nextUserId: 1, nextPlanId: 1 };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ---------- Users ----------
export function createUser({ name, email, passwordHash }) {
  const db = readDB();
  if (db.users.find(u => u.email === email)) {
    throw new Error("EMAIL_TAKEN");
  }
  const user = { id: db.nextUserId++, name, email, passwordHash, createdAt: new Date().toISOString() };
  db.users.push(user);
  writeDB(db);
  return user;
}

export function findUserByEmail(email) {
  const db = readDB();
  return db.users.find(u => u.email === email) || null;
}

export function findUserById(id) {
  const db = readDB();
  return db.users.find(u => u.id === id) || null;
}

// ---------- Plans ----------
export function savePlan({ userId, length, width, facing, rooms, floors, styleName }) {
  const db = readDB();
  const plan = {
    id: db.nextPlanId++,
    userId,
    length,
    width,
    facing,
    rooms,
    floors: floors || null,
    styleName: styleName || null,
    createdAt: new Date().toISOString()
  };
  db.plans.push(plan);
  writeDB(db);
  return plan;
}

export function getPlansForUser(userId) {
  const db = readDB();
  return db.plans.filter(p => p.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getPlanById(id, userId) {
  const db = readDB();
  return db.plans.find(p => p.id === id && p.userId === userId) || null;
}

export function deletePlan(id, userId) {
  const db = readDB();
  const before = db.plans.length;
  db.plans = db.plans.filter(p => !(p.id === id && p.userId === userId));
  writeDB(db);
  return db.plans.length < before;
}
