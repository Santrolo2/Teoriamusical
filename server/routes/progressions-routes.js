import { Router } from "express";
import { all, get } from "../db/progressions-db.js";

const router = Router();

let featureCache = null;

function toInt(value) {
  const n = Number.parseInt(String(value), 10);
  return Number.isNaN(n) ? null : n;
}

function readQuery(req, names = []) {
  for (const name of names) {
    if (req.query[name] != null && String(req.query[name]).trim() !== "") {
      return String(req.query[name]).trim();
    }
  }
  return "";
}

function parseBooleanFlag(value) {
  if (!value) return null;
  const txt = String(value).trim().toLowerCase();
  if (["1", "true", "si", "yes"].includes(txt)) return 1;
  if (["0", "false", "no"].includes(txt)) return 0;
  return null;
}

function detectFeatures() {
  if (featureCache) return featureCache;
  const rows = all(
    `
    SELECT type, name
    FROM sqlite_master
    WHERE name IN (
      'progression_pedagogy',
      'progression_common_errors',
      'progression_search_aliases',
      'realization_variants',
      'work_example_annotations',
      'vw_progression_coverage'
    )
    `
  );

  const tableSet = new Set(
    rows.filter((r) => r.type === "table").map((r) => r.name)
  );
  const viewSet = new Set(
    rows.filter((r) => r.type === "view").map((r) => r.name)
  );

  featureCache = {
    pedagogy: tableSet.has("progression_pedagogy"),
    commonErrors: tableSet.has("progression_common_errors"),
    aliases: tableSet.has("progression_search_aliases"),
    variants: tableSet.has("realization_variants"),
    workAnnotations: tableSet.has("work_example_annotations"),
    coverageView: viewSet.has("vw_progression_coverage")
  };
  return featureCache;
}

function buildProgressionsFilters(req) {
  const flags = detectFeatures();
  const composer = readQuery(req, ["compositor", "composer"]);
  const tonalidad = readQuery(req, ["tonalidad", "key"]);
  const modo = readQuery(req, ["modo", "mode"]);
  const romanPattern = readQuery(req, ["roman_pattern", "roman", "patron_romano", "patron", "pattern"]);
  const level = readQuery(req, ["nivel", "level"]);
  const coreOnly = parseBooleanFlag(readQuery(req, ["core_only", "is_core"]));
  const hasAudio = parseBooleanFlag(readQuery(req, ["has_audio", "audio"]));
  const hasNotation = parseBooleanFlag(readQuery(req, ["has_notation", "notation"]));
  const hasExamples = parseBooleanFlag(readQuery(req, ["has_examples", "examples"]));

  const where = [];
  const params = [];

  if (composer) {
    const composerId = toInt(composer);
    if (composerId != null) {
      where.push("p.composer_id = ?");
      params.push(composerId);
    } else {
      where.push("LOWER(c.full_name) LIKE LOWER(?)");
      params.push(`%${composer}%`);
    }
  }

  if (tonalidad) {
    const keyId = toInt(tonalidad);
    if (keyId != null) {
      where.push("k.id = ?");
      params.push(keyId);
    } else {
      where.push("(LOWER(k.display_name) = LOWER(?) OR LOWER(k.tonic) = LOWER(?))");
      params.push(tonalidad, tonalidad);
    }
  }

  if (modo) {
    where.push("(LOWER(p.mode) = LOWER(?) OR LOWER(k.mode) = LOWER(?))");
    params.push(modo, modo);
  }

  if (romanPattern) {
    where.push(
      "(LOWER(p.canonical_roman) LIKE LOWER(?)" +
      (flags.aliases ? " OR EXISTS (SELECT 1 FROM progression_search_aliases psa WHERE psa.progression_id = p.id AND LOWER(psa.alias_roman) LIKE LOWER(?))" : "") +
      ")"
    );
    params.push(`%${romanPattern}%`);
    if (flags.aliases) params.push(`%${romanPattern}%`);
  }

  if (level) {
    const n = toInt(level);
    if (n != null) {
      if (flags.pedagogy) {
        where.push("COALESCE(pp.level, p.difficulty_level, 1) = ?");
      } else {
        where.push("COALESCE(p.difficulty_level, 1) = ?");
      }
      params.push(n);
    }
  }

  if (flags.pedagogy && coreOnly != null) {
    where.push(coreOnly ? "COALESCE(pp.is_core, 0) = 1" : "COALESCE(pp.is_core, 0) = 0");
  }

  if (hasAudio != null) {
    where.push(
      hasAudio
        ? "EXISTS (SELECT 1 FROM progression_realizations r2 WHERE r2.progression_id = p.id AND COALESCE(r2.audio_demo_ref, '') <> '')"
        : "NOT EXISTS (SELECT 1 FROM progression_realizations r2 WHERE r2.progression_id = p.id AND COALESCE(r2.audio_demo_ref, '') <> '')"
    );
  }

  if (hasNotation != null) {
    where.push(
      hasNotation
        ? "EXISTS (SELECT 1 FROM progression_realizations r3 WHERE r3.progression_id = p.id AND COALESCE(r3.notation_ref, '') <> '')"
        : "NOT EXISTS (SELECT 1 FROM progression_realizations r3 WHERE r3.progression_id = p.id AND COALESCE(r3.notation_ref, '') <> '')"
    );
  }

  if (hasExamples != null) {
    where.push(
      hasExamples
        ? "EXISTS (SELECT 1 FROM progression_work_examples e2 WHERE e2.progression_id = p.id)"
        : "NOT EXISTS (SELECT 1 FROM progression_work_examples e2 WHERE e2.progression_id = p.id)"
    );
  }

  return { where, params, flags };
}

router.get("/composers", (req, res) => {
  try {
    const data = all(
      `
      SELECT
        c.id,
        c.full_name,
        c.birth_year,
        c.death_year,
        c.nationality,
        p.name AS period_name,
        COUNT(DISTINCT pr.id) AS progression_count
      FROM composers c
      LEFT JOIN periods p ON p.id = c.period_id
      LEFT JOIN progressions pr ON pr.composer_id = c.id
      GROUP BY c.id
      ORDER BY c.full_name ASC
      `
    );
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get("/keys", (req, res) => {
  try {
    const modo = readQuery(req, ["modo", "mode"]);
    const data = modo
      ? all(
          `
          SELECT id, tonic, mode, display_name, accidentals, enharmonic_group
          FROM keys
          WHERE LOWER(mode) = LOWER(?)
          ORDER BY display_name ASC
          `,
          [modo]
        )
      : all(
          `
          SELECT id, tonic, mode, display_name, accidentals, enharmonic_group
          FROM keys
          ORDER BY display_name ASC
          `
        );
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get("/progressions", (req, res) => {
  try {
    const { where, params, flags } = buildProgressionsFilters(req);
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const joinPedagogy = flags.pedagogy ? "LEFT JOIN progression_pedagogy pp ON pp.progression_id = p.id" : "";
    const joinCoverage = flags.coverageView ? "LEFT JOIN vw_progression_coverage cv ON cv.progression_id = p.id" : "";

    const data = all(
      `
      SELECT
        p.id,
        p.name,
        p.canonical_roman,
        p.mode,
        p.difficulty_level,
        p.cadence_type,
        p.tension_profile,
        p.expressive_character,
        p.description,
        p.usage_context,
        c.id AS composer_id,
        c.full_name AS composer_name,
        s.name AS style_name,
        COUNT(DISTINCT r.id) AS realization_count,
        GROUP_CONCAT(DISTINCT k.display_name) AS realization_keys,
        (SELECT COUNT(*) FROM progression_work_examples ex WHERE ex.progression_id = p.id) AS example_count,
        SUM(CASE WHEN COALESCE(r.audio_demo_ref, '') <> '' THEN 1 ELSE 0 END) AS realizations_with_audio,
        SUM(CASE WHEN COALESCE(r.notation_ref, '') <> '' THEN 1 ELSE 0 END) AS realizations_with_notation,
        CASE WHEN SUM(CASE WHEN COALESCE(r.audio_demo_ref, '') <> '' THEN 1 ELSE 0 END) > 0 THEN 1 ELSE 0 END AS has_audio,
        CASE WHEN SUM(CASE WHEN COALESCE(r.notation_ref, '') <> '' THEN 1 ELSE 0 END) > 0 THEN 1 ELSE 0 END AS has_notation,
        ${flags.pedagogy ? "MAX(COALESCE(pp.level, p.difficulty_level, 1))" : "MAX(COALESCE(p.difficulty_level, 1))"} AS learning_level,
        ${flags.pedagogy ? "MAX(COALESCE(pp.is_core, 0))" : "0"} AS is_core,
        ${flags.pedagogy ? "MAX(COALESCE(pp.objective, ''))" : "''"} AS pedagogy_objective,
        ${flags.pedagogy ? "MAX(COALESCE(pp.hearing_focus, ''))" : "''"} AS hearing_focus,
        ${flags.pedagogy ? "MAX(COALESCE(pp.voice_leading_focus, ''))" : "''"} AS voice_leading_focus,
        ${flags.coverageView ? "MAX(COALESCE(cv.used_keys, 0))" : "COUNT(DISTINCT k.id)"} AS used_keys,
        ${flags.coverageView ? "MAX(COALESCE(cv.total_keys_in_mode, 0))" : "0"} AS total_keys_in_mode,
        ${flags.coverageView ? "MAX(COALESCE(cv.variant_count, 0))" : "0"} AS variant_count
      FROM progressions p
      JOIN composers c ON c.id = p.composer_id
      LEFT JOIN styles s ON s.id = p.style_id
      LEFT JOIN progression_realizations r ON r.progression_id = p.id
      LEFT JOIN keys k ON k.id = r.key_id
      ${joinPedagogy}
      ${joinCoverage}
      ${whereSql}
      GROUP BY p.id
      ORDER BY c.full_name ASC, p.name ASC
      `,
      params
    );

    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get("/progressions/:id", (req, res) => {
  try {
    const flags = detectFeatures();
    const id = toInt(req.params.id);
    if (id == null) {
      return res.status(400).json({ ok: false, error: "ID invalido." });
    }

    const item = get(
      `
      SELECT
        p.*,
        c.full_name AS composer_name,
        c.nationality AS composer_nationality,
        pe.name AS period_name,
        s.name AS style_name
      FROM progressions p
      JOIN composers c ON c.id = p.composer_id
      LEFT JOIN periods pe ON pe.id = c.period_id
      LEFT JOIN styles s ON s.id = p.style_id
      WHERE p.id = ?
      `,
      [id]
    );

    if (!item) {
      return res.status(404).json({ ok: false, error: "Progresion no encontrada." });
    }

    const works = all(
      `
      SELECT
        w.id,
        w.title,
        w.catalogue_reference,
        w.year_composed,
        w.genre,
        e.section_label,
        e.measure_start,
        e.measure_end,
        e.commentary
      FROM progression_work_examples e
      JOIN works w ON w.id = e.work_id
      WHERE e.progression_id = ?
      ORDER BY COALESCE(w.year_composed, 9999), w.title ASC
      `,
      [id]
    );

    const tags = all(
      `
      SELECT t.id, t.name
      FROM progression_tags pt
      JOIN tags t ON t.id = pt.tag_id
      WHERE pt.progression_id = ?
      ORDER BY t.name ASC
      `,
      [id]
    );

    const pedagogy = flags.pedagogy
      ? get(
          `
          SELECT
            progression_id,
            level,
            objective,
            hearing_focus,
            voice_leading_focus,
            keyboard_focus,
            unlock_order,
            is_core,
            estimated_minutes
          FROM progression_pedagogy
          WHERE progression_id = ?
          `,
          [id]
        ) || null
      : null;

    const commonErrors = flags.commonErrors
      ? all(
          `
          SELECT
            id,
            progression_id,
            error_code,
            error_description,
            hint_subtle,
            hint_technical,
            hint_full,
            priority
          FROM progression_common_errors
          WHERE progression_id = ?
          ORDER BY priority ASC, id ASC
          `,
          [id]
        )
      : [];

    const coverage = flags.coverageView
      ? get(
          `
          SELECT
            progression_id,
            used_keys,
            total_keys_in_mode,
            realizations_with_audio,
            realizations_with_notation,
            variant_count
          FROM vw_progression_coverage
          WHERE progression_id = ?
          `,
          [id]
        ) || null
      : null;

    res.json({
      ok: true,
      data: {
        ...item,
        works,
        tags,
        pedagogy,
        common_errors: commonErrors,
        coverage
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get("/progressions/:id/degrees", (req, res) => {
  try {
    const id = toInt(req.params.id);
    if (id == null) {
      return res.status(400).json({ ok: false, error: "ID invalido." });
    }

    const data = all(
      `
      SELECT
        d.id,
        d.progression_id,
        d.degree_order,
        d.roman_numeral,
        d.chord_quality,
        d.inversion,
        d.chord_symbol_relative,
        d.expected_resolution,
        d.degree_role,
        d.expressive_color,
        d.stability_level,
        f.name AS harmonic_function_name,
        f.short_code AS harmonic_function_code
      FROM progression_degrees d
      LEFT JOIN harmonic_functions f ON f.id = d.harmonic_function_id
      WHERE d.progression_id = ?
      ORDER BY d.degree_order ASC
      `,
      [id]
    );

    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get("/progressions/:id/realizations", (req, res) => {
  try {
    const flags = detectFeatures();
    const id = toInt(req.params.id);
    if (id == null) {
      return res.status(400).json({ ok: false, error: "ID invalido." });
    }

    const tonalidad = readQuery(req, ["tonalidad", "key"]);
    const modo = readQuery(req, ["modo", "mode"]);
    const where = ["r.progression_id = ?"];
    const params = [id];

    if (tonalidad) {
      const keyId = toInt(tonalidad);
      if (keyId != null) {
        where.push("k.id = ?");
        params.push(keyId);
      } else {
        where.push("(LOWER(k.display_name) = LOWER(?) OR LOWER(k.tonic) = LOWER(?))");
        params.push(tonalidad, tonalidad);
      }
    }

    if (modo) {
      where.push("LOWER(k.mode) = LOWER(?)");
      params.push(modo);
    }

    const variantCountSql = flags.variants
      ? `(SELECT COUNT(*) FROM realization_variants rv WHERE rv.realization_id = r.id)`
      : "0";
    const defaultVariantSql = flags.variants
      ? `(SELECT rv.variant_code FROM realization_variants rv WHERE rv.realization_id = r.id AND rv.is_default = 1 ORDER BY rv.id ASC LIMIT 1)`
      : "NULL";

    const data = all(
      `
      SELECT
        r.id,
        r.progression_id,
        r.key_id,
        k.display_name AS key_name,
        k.tonic AS key_tonic,
        k.mode AS key_mode,
        r.root_note,
        r.chord_sequence_absolute,
        r.bass_sequence,
        r.midi_export_ref,
        r.audio_demo_ref,
        r.notation_ref,
        r.notes,
        CASE WHEN COALESCE(r.audio_demo_ref, '') <> '' THEN 1 ELSE 0 END AS has_audio,
        CASE WHEN COALESCE(r.notation_ref, '') <> '' THEN 1 ELSE 0 END AS has_notation,
        ${variantCountSql} AS variant_count,
        ${defaultVariantSql} AS default_variant_code
      FROM progression_realizations r
      JOIN keys k ON k.id = r.key_id
      WHERE ${where.join(" AND ")}
      ORDER BY k.display_name ASC
      `,
      params
    );

    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get("/progressions/:id/pedagogy", (req, res) => {
  try {
    const flags = detectFeatures();
    const id = toInt(req.params.id);
    if (id == null) {
      return res.status(400).json({ ok: false, error: "ID invalido." });
    }
    if (!flags.pedagogy) {
      return res.json({ ok: true, data: null });
    }

    const data = get(
      `
      SELECT
        progression_id,
        level,
        objective,
        hearing_focus,
        voice_leading_focus,
        keyboard_focus,
        unlock_order,
        is_core,
        estimated_minutes
      FROM progression_pedagogy
      WHERE progression_id = ?
      `,
      [id]
    ) || null;

    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get("/progressions/:id/errors", (req, res) => {
  try {
    const flags = detectFeatures();
    const id = toInt(req.params.id);
    if (id == null) {
      return res.status(400).json({ ok: false, error: "ID invalido." });
    }
    if (!flags.commonErrors) {
      return res.json({ ok: true, data: [] });
    }

    const data = all(
      `
      SELECT
        id,
        progression_id,
        error_code,
        error_description,
        hint_subtle,
        hint_technical,
        hint_full,
        priority
      FROM progression_common_errors
      WHERE progression_id = ?
      ORDER BY priority ASC, id ASC
      `,
      [id]
    );

    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get("/realizations/:id/variants", (req, res) => {
  try {
    const flags = detectFeatures();
    const id = toInt(req.params.id);
    if (id == null) {
      return res.status(400).json({ ok: false, error: "ID invalido." });
    }
    if (!flags.variants) {
      return res.json({ ok: true, data: [] });
    }

    const data = all(
      `
      SELECT
        id,
        realization_id,
        variant_code,
        voicing_label,
        texture,
        rhythmic_pattern,
        tempo_bpm,
        chord_sequence_absolute,
        bass_sequence,
        notation_ref,
        audio_demo_ref,
        difficulty_delta,
        is_default
      FROM realization_variants
      WHERE realization_id = ?
      ORDER BY is_default DESC, id ASC
      `,
      [id]
    );

    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get("/progressions/:id/study-pack", (req, res) => {
  try {
    const flags = detectFeatures();
    const id = toInt(req.params.id);
    if (id == null) {
      return res.status(400).json({ ok: false, error: "ID invalido." });
    }

    const progression = get(
      `
      SELECT
        p.*,
        c.full_name AS composer_name,
        c.nationality AS composer_nationality,
        pe.name AS period_name,
        s.name AS style_name
      FROM progressions p
      JOIN composers c ON c.id = p.composer_id
      LEFT JOIN periods pe ON pe.id = c.period_id
      LEFT JOIN styles s ON s.id = p.style_id
      WHERE p.id = ?
      `,
      [id]
    );

    if (!progression) {
      return res.status(404).json({ ok: false, error: "Progresion no encontrada." });
    }

    const pedagogy = flags.pedagogy
      ? get(
          `
          SELECT
            progression_id,
            level,
            objective,
            hearing_focus,
            voice_leading_focus,
            keyboard_focus,
            unlock_order,
            is_core,
            estimated_minutes
          FROM progression_pedagogy
          WHERE progression_id = ?
          `,
          [id]
        ) || null
      : null;

    const commonErrors = flags.commonErrors
      ? all(
          `
          SELECT
            id,
            progression_id,
            error_code,
            error_description,
            hint_subtle,
            hint_technical,
            hint_full,
            priority
          FROM progression_common_errors
          WHERE progression_id = ?
          ORDER BY priority ASC, id ASC
          `,
          [id]
        )
      : [];

    const degrees = all(
      `
      SELECT
        d.id,
        d.progression_id,
        d.degree_order,
        d.roman_numeral,
        d.chord_quality,
        d.inversion,
        d.chord_symbol_relative,
        d.expected_resolution,
        d.degree_role,
        d.expressive_color,
        d.stability_level,
        f.name AS harmonic_function_name,
        f.short_code AS harmonic_function_code
      FROM progression_degrees d
      LEFT JOIN harmonic_functions f ON f.id = d.harmonic_function_id
      WHERE d.progression_id = ?
      ORDER BY d.degree_order ASC
      `,
      [id]
    );

    const realizations = all(
      `
      SELECT
        r.id,
        r.progression_id,
        r.key_id,
        k.display_name AS key_name,
        k.tonic AS key_tonic,
        k.mode AS key_mode,
        r.root_note,
        r.chord_sequence_absolute,
        r.bass_sequence,
        r.midi_export_ref,
        r.audio_demo_ref,
        r.notation_ref,
        r.notes,
        CASE WHEN COALESCE(r.audio_demo_ref, '') <> '' THEN 1 ELSE 0 END AS has_audio,
        CASE WHEN COALESCE(r.notation_ref, '') <> '' THEN 1 ELSE 0 END AS has_notation,
        ${flags.variants ? "(SELECT COUNT(*) FROM realization_variants rv WHERE rv.realization_id = r.id)" : "0"} AS variant_count
      FROM progression_realizations r
      JOIN keys k ON k.id = r.key_id
      WHERE r.progression_id = ?
      ORDER BY k.display_name ASC
      `,
      [id]
    );

    const variants = flags.variants
      ? all(
          `
          SELECT
            rv.id,
            rv.realization_id,
            rv.variant_code,
            rv.voicing_label,
            rv.texture,
            rv.rhythmic_pattern,
            rv.tempo_bpm,
            rv.chord_sequence_absolute,
            rv.bass_sequence,
            rv.notation_ref,
            rv.audio_demo_ref,
            rv.difficulty_delta,
            rv.is_default
          FROM realization_variants rv
          JOIN progression_realizations r ON r.id = rv.realization_id
          WHERE r.progression_id = ?
          ORDER BY rv.realization_id ASC, rv.is_default DESC, rv.id ASC
          `,
          [id]
        )
      : [];

    const works = all(
      `
      SELECT
        w.id,
        w.title,
        w.catalogue_reference,
        w.year_composed,
        w.genre,
        e.section_label,
        e.measure_start,
        e.measure_end,
        e.commentary
      FROM progression_work_examples e
      JOIN works w ON w.id = e.work_id
      WHERE e.progression_id = ?
      ORDER BY COALESCE(w.year_composed, 9999), w.title ASC
      `,
      [id]
    );

    const coverage = flags.coverageView
      ? get(
          `
          SELECT
            progression_id,
            used_keys,
            total_keys_in_mode,
            realizations_with_audio,
            realizations_with_notation,
            variant_count
          FROM vw_progression_coverage
          WHERE progression_id = ?
          `,
          [id]
        ) || null
      : null;

    res.json({
      ok: true,
      data: {
        progression,
        pedagogy,
        common_errors: commonErrors,
        degrees,
        realizations,
        variants,
        works,
        coverage
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get("/coverage/summary", (req, res) => {
  try {
    const flags = detectFeatures();
    if (!flags.coverageView) {
      return res.json({
        ok: true,
        data: {
          progressions: all("SELECT COUNT(*) AS n FROM progressions")[0]?.n || 0,
          phase1_enabled: false
        }
      });
    }

    const data = get(
      `
      SELECT
        COUNT(*) AS progression_count,
        SUM(CASE WHEN total_keys_in_mode > 0 THEN 1 ELSE 0 END) AS with_mode_keyspace,
        ROUND(AVG(CASE WHEN total_keys_in_mode > 0 THEN (CAST(used_keys AS REAL) / total_keys_in_mode) ELSE 0 END), 4) AS avg_key_coverage_ratio,
        SUM(realizations_with_audio) AS realizations_with_audio,
        SUM(realizations_with_notation) AS realizations_with_notation,
        SUM(variant_count) AS total_variants
      FROM vw_progression_coverage
      `
    ) || {};

    res.json({
      ok: true,
      data: {
        ...data,
        phase1_enabled: true
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
