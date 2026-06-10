import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = process.env.PROGRESSIONS_SCHEMA_PATH
  ? path.resolve(process.cwd(), process.env.PROGRESSIONS_SCHEMA_PATH)
  : path.resolve(__dirname, "..", "..", "..", "schema_progressions.sql");

const dbPath = process.env.PROGRESSIONS_DB_PATH
  ? path.resolve(process.cwd(), process.env.PROGRESSIONS_DB_PATH)
  : path.resolve(__dirname, "..", "..", "..", "progressiones.db");

async function main() {
  const rawSql = await readFile(schemaPath, "utf8");
  const progressionsColumns = [
    "id",
    "composer_id",
    "style_id",
    "name",
    "canonical_roman",
    "mode",
    "harmonic_language",
    "cadence_type",
    "tension_profile",
    "expressive_character",
    "difficulty_level",
    "description",
    "usage_context",
    "voice_leading_notes",
    "instrumentation_notes",
    "is_sequence",
    "is_modulatory",
    "source_reference"
  ].join(", ");

  const sql = rawSql.replace(
    /INSERT\s+OR\s+IGNORE\s+INTO\s+progressions\s+VALUES/gi,
    `INSERT OR IGNORE INTO progressions (${progressionsColumns}) VALUES`
  );

  await rm(dbPath, { force: true }).catch(() => {});
  const db = new DatabaseSync(dbPath);

  try {
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec(sql);

    const composerCount = db.prepare("SELECT COUNT(*) AS n FROM composers").get().n;
    const progressionCount = db.prepare("SELECT COUNT(*) AS n FROM progressions").get().n;
    const degreeCount = db.prepare("SELECT COUNT(*) AS n FROM progression_degrees").get().n;

    console.log(`DB creada: ${dbPath}`);
    console.log(`Compositores: ${composerCount}`);
    console.log(`Progresiones: ${progressionCount}`);
    console.log(`Grados: ${degreeCount}`);
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error("Error inicializando progressiones.db:", error.message);
  process.exitCode = 1;
});
