import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationPath = process.env.PROGRESSIONS_PHASE1_MIGRATION_PATH
  ? path.resolve(process.cwd(), process.env.PROGRESSIONS_PHASE1_MIGRATION_PATH)
  : path.resolve(__dirname, "..", "sql", "progressions-phase1-migration.sql");

const dbPath = process.env.PROGRESSIONS_DB_PATH
  ? path.resolve(process.cwd(), process.env.PROGRESSIONS_DB_PATH)
  : path.resolve(__dirname, "..", "..", "progressiones.db");

async function main() {
  if (!existsSync(dbPath)) {
    throw new Error(`No existe la base en ${dbPath}. Ejecuta primero: npm run db:init`);
  }

  const sql = await readFile(migrationPath, "utf8");
  const db = new Database(dbPath);
  try {
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec(sql);

    const created = db.prepare(
      `
      SELECT name
      FROM sqlite_master
      WHERE type IN ('table', 'view')
        AND name IN (
          'progression_pedagogy',
          'progression_common_errors',
          'progression_search_aliases',
          'realization_variants',
          'work_example_annotations',
          'vw_progression_coverage'
        )
      ORDER BY name
      `
    ).all();

    console.log(`Migracion Fase 1 aplicada en: ${dbPath}`);
    console.log(`Objetos disponibles: ${created.map((x) => x.name).join(", ")}`);
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error("Error aplicando migracion fase 1:", error.message);
  process.exitCode = 1;
});
