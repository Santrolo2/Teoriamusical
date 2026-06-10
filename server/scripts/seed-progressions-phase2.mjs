import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedPath = process.env.PROGRESSIONS_PHASE2_SEED_PATH
  ? path.resolve(process.cwd(), process.env.PROGRESSIONS_PHASE2_SEED_PATH)
  : path.resolve(__dirname, "..", "sql", "progressions-phase2-seed.sql");

const dbPath = process.env.PROGRESSIONS_DB_PATH
  ? path.resolve(process.cwd(), process.env.PROGRESSIONS_DB_PATH)
  : path.resolve(__dirname, "..", "..", "..", "progressiones.db");

async function main() {
  if (!existsSync(dbPath)) {
    throw new Error(`No existe la base en ${dbPath}. Ejecuta primero: npm run db:init`);
  }

  const sql = await readFile(seedPath, "utf8");
  const db = new DatabaseSync(dbPath);
  try {
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec(sql);

    const resumen = {
      progressions: db.prepare("SELECT COUNT(*) AS n FROM progressions").get().n,
      realizations: db.prepare("SELECT COUNT(*) AS n FROM progression_realizations").get().n,
      examples: db.prepare("SELECT COUNT(*) AS n FROM progression_work_examples").get().n,
      variants: db.prepare("SELECT COUNT(*) AS n FROM realization_variants").get().n,
      annotations: db.prepare("SELECT COUNT(*) AS n FROM work_example_annotations").get().n
    };

    console.log(`Seed Fase 2 aplicado en: ${dbPath}`);
    console.log(JSON.stringify(resumen, null, 2));
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error("Error aplicando seed fase 2:", error.message);
  process.exitCode = 1;
});
