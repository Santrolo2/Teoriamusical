import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DB_PATH = path.resolve(__dirname, "..", "..", "progressiones.db");
const DB_PATH = process.env.PROGRESSIONS_DB_PATH
  ? path.resolve(process.cwd(), process.env.PROGRESSIONS_DB_PATH)
  : DEFAULT_DB_PATH;

let dbInstance = null;

function openDatabase() {
  if (!existsSync(DB_PATH)) {
    throw new Error(
      `Base SQLite no encontrada en ${DB_PATH}. Ejecuta: npm run db:init`
    );
  }

  const db = new Database(DB_PATH);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");
  return db;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = openDatabase();
  }
  return dbInstance;
}

export function all(sql, params = []) {
  const stmt = getDb().prepare(sql);
  return stmt.all(...params);
}

export function get(sql, params = []) {
  const stmt = getDb().prepare(sql);
  return stmt.get(...params);
}

export function getDbPath() {
  return DB_PATH;
}

