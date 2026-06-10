PRAGMA foreign_keys = ON;

-- =========================================================
-- FASE 1 (MVP RAPIDO)
-- Extension pedagógica y de cobertura sin romper API actual
-- =========================================================

-- Pedagogia por progresion (1:1)
CREATE TABLE IF NOT EXISTS progression_pedagogy (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    progression_id INTEGER NOT NULL UNIQUE,
    level INTEGER NOT NULL DEFAULT 1 CHECK(level BETWEEN 1 AND 5),
    objective TEXT NOT NULL,
    hearing_focus TEXT,
    voice_leading_focus TEXT,
    keyboard_focus TEXT,
    unlock_order INTEGER NOT NULL DEFAULT 0,
    is_core INTEGER NOT NULL DEFAULT 1 CHECK(is_core IN (0, 1)),
    estimated_minutes INTEGER NOT NULL DEFAULT 6,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (progression_id) REFERENCES progressions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_progression_pedagogy_level_order
ON progression_pedagogy(level, unlock_order);

-- Errores frecuentes + pistas con gradiente de complejidad
CREATE TABLE IF NOT EXISTS progression_common_errors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    progression_id INTEGER NOT NULL,
    error_code TEXT NOT NULL,
    error_description TEXT NOT NULL,
    hint_subtle TEXT NOT NULL,
    hint_technical TEXT,
    hint_full TEXT,
    priority INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (progression_id) REFERENCES progressions(id) ON DELETE CASCADE,
    UNIQUE (progression_id, error_code)
);

CREATE INDEX IF NOT EXISTS idx_progression_common_errors_progression_priority
ON progression_common_errors(progression_id, priority);

-- Alias para busquedas por patron romano sin tocar canonical_roman
CREATE TABLE IF NOT EXISTS progression_search_aliases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    progression_id INTEGER NOT NULL,
    alias_name TEXT,
    alias_roman TEXT NOT NULL,
    FOREIGN KEY (progression_id) REFERENCES progressions(id) ON DELETE CASCADE,
    UNIQUE (progression_id, alias_roman)
);

CREATE INDEX IF NOT EXISTS idx_progression_search_aliases_roman
ON progression_search_aliases(alias_roman);

-- Variantes por realizacion (evita romper UNIQUE(progression_id, key_id))
CREATE TABLE IF NOT EXISTS realization_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    realization_id INTEGER NOT NULL,
    variant_code TEXT NOT NULL,
    voicing_label TEXT,
    texture TEXT,
    rhythmic_pattern TEXT,
    tempo_bpm INTEGER,
    chord_sequence_absolute TEXT NOT NULL,
    bass_sequence TEXT,
    notation_ref TEXT,
    audio_demo_ref TEXT,
    difficulty_delta INTEGER NOT NULL DEFAULT 0,
    is_default INTEGER NOT NULL DEFAULT 0 CHECK(is_default IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (realization_id) REFERENCES progression_realizations(id) ON DELETE CASCADE,
    UNIQUE (realization_id, variant_code)
);

CREATE INDEX IF NOT EXISTS idx_realization_variants_realization
ON realization_variants(realization_id);

-- Anotaciones analiticas sobre ejemplos en obras
CREATE TABLE IF NOT EXISTS work_example_annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    example_id INTEGER NOT NULL,
    key_id INTEGER,
    roman_in_context TEXT,
    form_function TEXT,
    analysis_note TEXT,
    confidence REAL NOT NULL DEFAULT 0.8 CHECK(confidence BETWEEN 0 AND 1),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (example_id) REFERENCES progression_work_examples(id) ON DELETE CASCADE,
    FOREIGN KEY (key_id) REFERENCES keys(id),
    UNIQUE (example_id, key_id, roman_in_context)
);

CREATE INDEX IF NOT EXISTS idx_work_example_annotations_key
ON work_example_annotations(key_id);

-- Vista de cobertura para diagnostico rapido
CREATE VIEW IF NOT EXISTS vw_progression_coverage AS
SELECT
    p.id AS progression_id,
    p.name,
    p.mode,
    COUNT(DISTINCT r.key_id) AS used_keys,
    (
        SELECT COUNT(*)
        FROM keys k
        WHERE LOWER(k.mode) = LOWER(p.mode)
    ) AS total_keys_in_mode,
    COUNT(DISTINCT CASE WHEN COALESCE(r.audio_demo_ref, '') <> '' THEN r.id END) AS realizations_with_audio,
    COUNT(DISTINCT CASE WHEN COALESCE(r.notation_ref, '') <> '' THEN r.id END) AS realizations_with_notation,
    COUNT(DISTINCT rv.id) AS variant_count
FROM progressions p
LEFT JOIN progression_realizations r ON r.progression_id = p.id
LEFT JOIN realization_variants rv ON rv.realization_id = r.id
GROUP BY p.id;
