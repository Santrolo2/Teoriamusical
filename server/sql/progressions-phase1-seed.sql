PRAGMA foreign_keys = ON;

-- =========================================================
-- FASE 1 (MVP RAPIDO) - Seed incremental no destructivo
-- =========================================================

-- 0) Curacion editorial: ampliar repertorio y cobertura tonal
-- 0.1) Progresiones nuevas para compositores sin coverage previa
INSERT OR IGNORE INTO progressions
(id, composer_id, style_id, name, canonical_roman, mode, harmonic_language, cadence_type, tension_profile, expressive_character, difficulty_level, description, usage_context, voice_leading_notes, instrumentation_notes, is_sequence, is_modulatory, source_reference)
VALUES
(11, 9, 3, 'Brahms Dense Continuum', 'I-iii-vi-ii-V-I', 'major', 'Romantic functional', 'Expanded authentic cadence', 'Medium-high', 'Dense, flowing, architectural', 3, 'Cadena funcional con continuidad interna y cierre robusto.', 'Desarrollo de seccion, puente hacia cadencia, expansion de periodo.', 'La conduccion entre voces internas debe priorizar terceras y sextas comunes.', 'Funciona en piano, cuarteto y orquesta con textura media.', 0, 0, 'Modelo inspiracional brahmsiano.'),
(12, 8, 3, 'Schumann Narrative Minor Arc', 'i-III-iv-VII-V-i', 'minor', 'Romantic tonal with modal color', 'Dramatic minor cadence', 'High', 'Narrative, contrastive, introspective', 4, 'Arco menor con contraste de color y retorno dramatico a la tonica.', 'Frases de caracter narrativo y transiciones de tension emocional.', 'Controlar continuidad del bajo para evitar quiebres abruptos entre III y iv.', 'Apto para piano y escritura de camara romantica.', 0, 0, 'Modelo inspiracional schumanniano.'),
(13, 11, 3, 'Rachmaninoff Deep Dominant Pull', 'i-VI-ii°6-V7-i', 'minor', 'Late romantic chromatic-functional', 'Intensified authentic cadence', 'High', 'Dark, expansive, gravitational', 4, 'Modelo menor con fuerte arrastre dominante y color de submediante.', 'Climax fraseologico, preparacion de retorno tematico, cierre dramatizado.', 'La sensible y la septima de dominante deben resolver con precision expresiva.', 'Especialmente idiomatico para piano y tutti orquestal.', 0, 0, 'Modelo inspiracional rachmaninoffiano.');

-- 0.2) Grados para progresiones nuevas
INSERT OR IGNORE INTO progression_degrees
(progression_id, degree_order, roman_numeral, chord_quality, inversion, harmonic_function_id, chord_symbol_relative, expected_resolution, degree_role, expressive_color, stability_level, voice_leading_notes, comments)
VALUES
(11, 1, 'I', 'major triad', 'root', 1, '1', 'Puede prolongarse o ir a iii', 'Ancla tonal inicial', 'Stable-bright', 5, 'Voz superior estable y bajo claro.', 'Inicio estructural.'),
(11, 2, 'iii', 'minor triad', 'root', 9, '3', 'Conduce a vi', 'Prolongacion de tonica', 'Warm-inner', 4, 'Mantener notas comunes con I.', 'Puente terciario.'),
(11, 3, 'vi', 'minor triad', 'root', 9, '6', 'Conduce a ii', 'Expansion de area tonal', 'Soft tension', 4, 'Continuidad del bajo descendente.', 'Expansion central.'),
(11, 4, 'ii', 'minor triad', 'root', 2, '2', 'Conduce a V', 'Predominante funcional', 'Preparatory', 3, 'Preparar sensible indirectamente.', 'Predominante clasica.'),
(11, 5, 'V', 'dominant', 'root', 3, '5', 'Resuelve a I', 'Tension dominante', 'Directed', 2, 'Resolver sensible y septima.', 'Dominante principal.'),
(11, 6, 'I', 'major triad', 'root', 4, '1', 'Reposo', 'Cierre de ciclo', 'Conclusive', 5, 'Reposo final.', 'Cadencia completa.'),

(12, 1, 'i', 'minor triad', 'root', 1, '1', 'Conduce a III', 'Centro menor inicial', 'Dark-center', 5, 'Estabilidad inicial en menor.', 'Inicio narrativo.'),
(12, 2, 'III', 'major triad', 'root', 6, 'b3', 'Conduce a iv', 'Color modal relativo', 'Contrasting light', 4, 'Cuidar balance timbrico en el cambio de color.', 'Color contrastivo.'),
(12, 3, 'iv', 'minor triad', 'root', 2, '4', 'Conduce a VII', 'Predominante menor', 'Brooding', 3, 'Mantener direccion en el bajo.', 'Preparacion dramatica.'),
(12, 4, 'VII', 'major triad', 'root', 7, 'b7', 'Conduce a V', 'Color modal de empuje', 'Open tension', 3, 'Evitar perder direccion hacia V.', 'Bisagra modal.'),
(12, 5, 'V', 'dominant', 'root', 3, '5', 'Resuelve a i', 'Maxima tension', 'Acute pull', 1, 'Sensible clara hacia tonica.', 'Dominante decisiva.'),
(12, 6, 'i', 'minor triad', 'root', 4, '1', 'Reposo', 'Resolucion final', 'Deep release', 5, 'Cierre menor estable.', 'Fin de arco.'),

(13, 1, 'i', 'minor triad', 'root', 1, '1', 'Conduce a VI', 'Ancla menor', 'Dark-stable', 5, 'Centro inicial firme.', 'Inicio de tension larga.'),
(13, 2, 'VI', 'major triad', 'root', 6, 'b6', 'Conduce a ii°6', 'Color expandido', 'Broad-dark', 4, 'Transicion expresiva por terceras.', 'Color romantico tardio.'),
(13, 3, 'ii°6', 'diminished triad', 'first inversion', 10, '2°/6', 'Conduce a V7', 'Predominante cromatica', 'Nervous', 2, 'Evitar dureza vertical, priorizar conduccion.', 'Puente cromatico.'),
(13, 4, 'V7', 'dominant seventh', 'root', 3, '5/7', 'Resuelve a i', 'Pico de tension', 'Gravitational', 1, 'Resolver septima descendente y sensible ascendente.', 'Dominante plena.'),
(13, 5, 'i', 'minor triad', 'root', 4, '1', 'Reposo', 'Cierre profundo', 'Resolved-dark', 5, 'Reposo con peso expresivo.', 'Cadencia final.');

-- 0.3) Obras y ejemplos para nuevas progresiones
INSERT OR IGNORE INTO works
(id, composer_id, title, catalogue_reference, year_composed, genre, notes)
VALUES
(11, 9, 'Intermezzo in A major', 'Op. 118 No. 2', 1893, 'Piano', 'Referencia de densidad lirica brahmsiana.'),
(12, 8, 'Kinderszenen', 'Op. 15', 1838, 'Piano', 'Referencia de narratividad armonica schumanniana.'),
(13, 11, 'Prelude in C# minor', 'Op. 3 No. 2', 1892, 'Piano', 'Referencia de traccion dominante en romanticismo tardio.');

INSERT OR IGNORE INTO progression_work_examples
(id, progression_id, work_id, section_label, measure_start, measure_end, commentary)
VALUES
(101, 11, 11, 'Transicion de frase', 17, 24, 'Continuidad funcional con densidad de voces internas.'),
(102, 11, 11, 'Retorno cadencial', 41, 48, 'Cierre expandido con fuerte direccion tonal.'),
(103, 12, 12, 'Arco narrativo', 9, 16, 'Contraste modal y retorno dramatico a menor.'),
(104, 12, 12, 'Resolucion final', 29, 36, 'Tension en VII-V antes del reposo en i.'),
(105, 13, 13, 'Climax previo', 21, 28, 'Submediante y predominante cromatica hacia V7.'),
(106, 13, 13, 'Cierre grave', 57, 64, 'Resolucion con peso expresivo en menor.');

-- 0.4) Tags y alias para nuevas progresiones
INSERT OR IGNORE INTO progression_tags (progression_id, tag_id) VALUES
(11, 8),
(11, 3),
(12, 8),
(12, 4),
(13, 8),
(13, 4);

INSERT OR IGNORE INTO progression_search_aliases (progression_id, alias_name, alias_roman) VALUES
(11, 'Expansion romantica mayor', 'I-iii-vi-ii-V-I'),
(12, 'Arco narrativo menor', 'i-III-iv-VII-V-i'),
(13, 'Tension dominante tardia', 'i-VI-ii°6-V7-i');

-- 0.5) Cobertura tonal ampliada (major/minor)
INSERT OR IGNORE INTO progression_realizations
(progression_id, key_id, root_note, chord_sequence_absolute, bass_sequence, notation_ref, audio_demo_ref, notes)
VALUES
-- Major coverage via progression 1
(1, 2, 'G', 'G - C - D - G', 'G - C - D - G', '/assets/notation/progressions/p1_k2.musicxml', '/assets/audio/progressions/p1_k2.mp3', 'Cadencia clasica en G mayor.'),
(1, 4, 'A', 'A - D - E - A', 'A - D - E - A', '/assets/notation/progressions/p1_k4.musicxml', '/assets/audio/progressions/p1_k4.mp3', 'Cadencia clasica en A mayor.'),
(1, 5, 'E', 'E - A - B - E', 'E - A - B - E', '/assets/notation/progressions/p1_k5.musicxml', '/assets/audio/progressions/p1_k5.mp3', 'Cadencia clasica en E mayor.'),
(1, 6, 'B', 'B - E - F# - B', 'B - E - F# - B', '/assets/notation/progressions/p1_k6.musicxml', '/assets/audio/progressions/p1_k6.mp3', 'Cadencia clasica en B mayor.'),
(1, 7, 'F#', 'F# - B - C# - F#', 'F# - B - C# - F#', '/assets/notation/progressions/p1_k7.musicxml', '/assets/audio/progressions/p1_k7.mp3', 'Cadencia clasica en F# mayor.'),
(1, 8, 'Db', 'Db - Gb - Ab - Db', 'Db - Gb - Ab - Db', '/assets/notation/progressions/p1_k8.musicxml', '/assets/audio/progressions/p1_k8.mp3', 'Cadencia clasica en Db mayor.'),
(1, 9, 'Ab', 'Ab - Db - Eb - Ab', 'Ab - Db - Eb - Ab', '/assets/notation/progressions/p1_k9.musicxml', '/assets/audio/progressions/p1_k9.mp3', 'Cadencia clasica en Ab mayor.'),
(1, 11, 'Bb', 'Bb - Eb - F - Bb', 'Bb - Eb - F - Bb', '/assets/notation/progressions/p1_k11.musicxml', '/assets/audio/progressions/p1_k11.mp3', 'Cadencia clasica en Bb mayor.'),

-- Minor coverage via progression 5
(5, 13, 'A', 'Am - Dm - E - Am', 'A - D - E - A', '/assets/notation/progressions/p5_k13.musicxml', '/assets/audio/progressions/p5_k13.mp3', 'Cadencia menor en A menor.'),
(5, 14, 'E', 'Em - Am - B - Em', 'E - A - B - E', '/assets/notation/progressions/p5_k14.musicxml', '/assets/audio/progressions/p5_k14.mp3', 'Cadencia menor en E menor.'),
(5, 15, 'B', 'Bm - Em - F# - Bm', 'B - E - F# - B', '/assets/notation/progressions/p5_k15.musicxml', '/assets/audio/progressions/p5_k15.mp3', 'Cadencia menor en B menor.'),
(5, 16, 'F#', 'F#m - Bm - C# - F#m', 'F# - B - C# - F#', '/assets/notation/progressions/p5_k16.musicxml', '/assets/audio/progressions/p5_k16.mp3', 'Cadencia menor en F# menor.'),
(5, 17, 'C#', 'C#m - F#m - G# - C#m', 'C# - F# - G# - C#', '/assets/notation/progressions/p5_k17.musicxml', '/assets/audio/progressions/p5_k17.mp3', 'Cadencia menor en C# menor.'),
(5, 18, 'G#', 'G#m - C#m - D# - G#m', 'G# - C# - D# - G#', '/assets/notation/progressions/p5_k18.musicxml', '/assets/audio/progressions/p5_k18.mp3', 'Cadencia menor en G# menor.'),
(5, 22, 'F', 'Fm - Bbm - C - Fm', 'F - Bb - C - F', '/assets/notation/progressions/p5_k22.musicxml', '/assets/audio/progressions/p5_k22.mp3', 'Cadencia menor en F menor.'),
(5, 23, 'Bb', 'Bbm - Ebm - F - Bbm', 'Bb - Eb - F - Bb', '/assets/notation/progressions/p5_k23.musicxml', '/assets/audio/progressions/p5_k23.mp3', 'Cadencia menor en Bb menor.'),
(5, 24, 'Eb', 'Ebm - Abm - Bb - Ebm', 'Eb - Ab - Bb - Eb', '/assets/notation/progressions/p5_k24.musicxml', '/assets/audio/progressions/p5_k24.mp3', 'Cadencia menor en Eb menor.'),

-- Realizaciones para nuevas progresiones
(11, 1, 'C', 'C - Em - Am - Dm - G - C', 'C - E - A - D - G - C', '/assets/notation/progressions/p11_k1.musicxml', '/assets/audio/progressions/p11_k1.mp3', 'Version base en C mayor.'),
(11, 3, 'D', 'D - F#m - Bm - Em - A - D', 'D - F# - B - E - A - D', '/assets/notation/progressions/p11_k3.musicxml', '/assets/audio/progressions/p11_k3.mp3', 'Version en D mayor.'),
(11, 10, 'Eb', 'Eb - Gm - Cm - Fm - Bb - Eb', 'Eb - G - C - F - Bb - Eb', '/assets/notation/progressions/p11_k10.musicxml', '/assets/audio/progressions/p11_k10.mp3', 'Version en Eb mayor.'),
(12, 19, 'D', 'Dm - F - Gm - C - A - Dm', 'D - F - G - C - A - D', '/assets/notation/progressions/p12_k19.musicxml', '/assets/audio/progressions/p12_k19.mp3', 'Arco narrativo en D menor.'),
(12, 20, 'G', 'Gm - Bb - Cm - F - D - Gm', 'G - Bb - C - F - D - G', '/assets/notation/progressions/p12_k20.musicxml', '/assets/audio/progressions/p12_k20.mp3', 'Arco narrativo en G menor.'),
(12, 21, 'C', 'Cm - Eb - Fm - Bb - G - Cm', 'C - Eb - F - Bb - G - C', '/assets/notation/progressions/p12_k21.musicxml', '/assets/audio/progressions/p12_k21.mp3', 'Arco narrativo en C menor.'),
(13, 14, 'E', 'Em - C - F#°/A - B7 - Em', 'E - C - A - B - E', '/assets/notation/progressions/p13_k14.musicxml', '/assets/audio/progressions/p13_k14.mp3', 'Tension dominante en E menor.'),
(13, 16, 'F#', 'F#m - D - G#°/B - C#7 - F#m', 'F# - D - B - C# - F#', '/assets/notation/progressions/p13_k16.musicxml', '/assets/audio/progressions/p13_k16.mp3', 'Tension dominante en F# menor.'),
(13, 19, 'D', 'Dm - Bb - E°/G - A7 - Dm', 'D - Bb - G - A - D', '/assets/notation/progressions/p13_k19.musicxml', '/assets/audio/progressions/p13_k19.mp3', 'Tension dominante en D menor.');

-- 1) Completar refs minimas de notacion/audio para habilitar UI
UPDATE progression_realizations
SET
    notation_ref = CASE
        WHEN COALESCE(notation_ref, '') = '' THEN '/assets/notation/progressions/p' || progression_id || '_k' || key_id || '.musicxml'
        ELSE notation_ref
    END,
    audio_demo_ref = CASE
        WHEN COALESCE(audio_demo_ref, '') = '' THEN '/assets/audio/progressions/p' || progression_id || '_k' || key_id || '.mp3'
        ELSE audio_demo_ref
    END
WHERE COALESCE(notation_ref, '') = '' OR COALESCE(audio_demo_ref, '') = '';

-- 2) Pedagogia base para todas las progresiones actuales
INSERT OR IGNORE INTO progression_pedagogy
(progression_id, level, objective, hearing_focus, voice_leading_focus, keyboard_focus, unlock_order, is_core, estimated_minutes)
SELECT
    p.id,
    CASE
        WHEN p.difficulty_level IS NULL THEN 2
        WHEN p.difficulty_level < 1 THEN 1
        WHEN p.difficulty_level > 5 THEN 5
        ELSE p.difficulty_level
    END AS level,
    'Identificar y aplicar la progresion ' || p.canonical_roman || ' en contexto ' || p.mode,
    'Escuchar tension y reposo por funcion tonal.',
    'Seguir conduccion de terceras y septimas hacia resolucion.',
    'Practicar en bloques y arpegio lento.',
    p.id,
    1,
    8
FROM progressions p;

-- 3) Errores frecuentes con tres niveles de pista
INSERT OR IGNORE INTO progression_common_errors
(progression_id, error_code, error_description, hint_subtle, hint_technical, hint_full, priority)
SELECT
    p.id,
    'root_misread',
    'Confusion de fundamental por inversion o bajo.',
    'Observa primero la linea del bajo antes de etiquetar.',
    'Determina funcion T/PD/D por bajo y acorde de llegada.',
    'Primero inversion, luego funcion y al final etiqueta romana completa.',
    1
FROM progressions p;

INSERT OR IGNORE INTO progression_common_errors
(progression_id, error_code, error_description, hint_subtle, hint_technical, hint_full, priority)
SELECT
    p.id,
    'dominant_resolution',
    'No se reconoce la resolucion dominante.',
    'Ubica donde aparece el reposo despues de la tension.',
    'Detecta V o V7 y verifica su resolucion a I o i.',
    'Si no hay reposo esperado, revisa si hay cadencia evitada o secuencia.',
    2
FROM progressions p;

-- 4) Alias de busqueda utiles
INSERT OR IGNORE INTO progression_search_aliases (progression_id, alias_name, alias_roman)
SELECT id, 'Cadencia autentica basica', 'I-IV-V-I'
FROM progressions
WHERE canonical_roman = 'I-IV-V-I';

INSERT OR IGNORE INTO progression_search_aliases (progression_id, alias_name, alias_roman)
SELECT id, 'Loop lirico romantico', 'I-vi-IV-V-I'
FROM progressions
WHERE canonical_roman = 'I-vi-IV-V-I';

INSERT OR IGNORE INTO progression_search_aliases (progression_id, alias_name, alias_roman)
SELECT id, 'Napolitana menor', 'i-iv6-N6-V-i'
FROM progressions
WHERE canonical_roman = 'i-iv6-N6-V-i';

-- 5) Expandir cobertura de tonalidades (major/minor)
INSERT OR IGNORE INTO progression_realizations
(progression_id, key_id, root_note, chord_sequence_absolute, bass_sequence, notation_ref, audio_demo_ref, notes)
VALUES
(1, 3, 'D', 'D - G - A - D', 'D - G - A - D', '/assets/notation/progressions/p1_k3.musicxml', '/assets/audio/progressions/p1_k3.mp3', 'Cadencia clasica en D mayor.'),
(1, 12, 'F', 'F - Bb - C - F', 'F - Bb - C - F', '/assets/notation/progressions/p1_k12.musicxml', '/assets/audio/progressions/p1_k12.mp3', 'Cadencia clasica en F mayor.'),
(2, 10, 'Eb', 'Eb - Cm - Fm - Bb - Eb', 'Eb - C - F - Bb - Eb', '/assets/notation/progressions/p2_k10.musicxml', '/assets/audio/progressions/p2_k10.mp3', 'Expansion tonal en Eb mayor.'),
(3, 3, 'D', 'D - A/C# - D/A - A7 - D', 'D - C# - A - A - D', '/assets/notation/progressions/p3_k3.musicxml', '/assets/audio/progressions/p3_k3.mp3', 'Cadencia rossiniana en D mayor.'),
(6, 19, 'D', 'Dm - Bb - Gm - A - Dm', 'D - Bb - G - A - D', '/assets/notation/progressions/p6_k19.musicxml', '/assets/audio/progressions/p6_k19.mp3', 'Impulso dramatico en D menor.'),
(7, 20, 'G', 'Gm - Cm/Eb - Ab/C - D - Gm', 'G - Eb - C - D - G', '/assets/notation/progressions/p7_k20.musicxml', '/assets/audio/progressions/p7_k20.mp3', 'Napolitana y dominante en G menor.'),
(8, 1, 'C', 'C - Am - F - G - C', 'C - A - F - G - C', '/assets/notation/progressions/p8_k1.musicxml', '/assets/audio/progressions/p8_k1.mp3', 'Version lirica en C mayor.'),
(10, 10, 'Eb', 'Eb - Gb - Ab - Cb', 'Eb - Gb - Ab - Cb', '/assets/notation/progressions/p10_k10.musicxml', '/assets/audio/progressions/p10_k10.mp3', 'Mezcla modal en Eb mayor.'),
(4, 1, 'C', 'C - Em - F - G - C', 'C - E - F - G - C', '/assets/notation/progressions/p4_k1.musicxml', '/assets/audio/progressions/p4_k1.mp3', 'Arco lirico belcantista en C mayor.'),
(9, 20, 'G', 'Gm - Bb - Eb - F - Gm', 'G - Bb - Eb - F - G', '/assets/notation/progressions/p9_k20.musicxml', '/assets/audio/progressions/p9_k20.mp3', 'Color modal de Debussy en G menor.');

-- 6) Variante por defecto para toda realizacion existente
INSERT OR IGNORE INTO realization_variants
(realization_id, variant_code, voicing_label, texture, rhythmic_pattern, tempo_bpm, chord_sequence_absolute, bass_sequence, notation_ref, audio_demo_ref, is_default)
SELECT
    r.id,
    'block_default',
    'Bloques cerrados',
    'homofonica',
    'blancas',
    72,
    r.chord_sequence_absolute,
    r.bass_sequence,
    r.notation_ref,
    r.audio_demo_ref,
    1
FROM progression_realizations r;

-- 8) Variantes adicionales para practica (algunas realizaciones clave)
INSERT OR IGNORE INTO realization_variants
(realization_id, variant_code, voicing_label, texture, rhythmic_pattern, tempo_bpm, chord_sequence_absolute, bass_sequence, notation_ref, audio_demo_ref, difficulty_delta, is_default)
SELECT
    r.id,
    'arpeggio_flow',
    'Arpegio fluido',
    'arpegiada',
    'corcheas',
    84,
    r.chord_sequence_absolute,
    r.bass_sequence,
    r.notation_ref,
    r.audio_demo_ref,
    1,
    0
FROM progression_realizations r
WHERE (r.progression_id = 1 AND r.key_id IN (1, 3, 10))
   OR (r.progression_id = 5 AND r.key_id IN (13, 19, 24))
   OR (r.progression_id = 11 AND r.key_id IN (1, 10))
   OR (r.progression_id = 4 AND r.key_id IN (1))
   OR (r.progression_id = 9 AND r.key_id IN (20));

-- 7) Anotacion basica para ejemplos ya cargados
INSERT OR IGNORE INTO work_example_annotations
(example_id, key_id, roman_in_context, form_function, analysis_note, confidence)
SELECT
    e.id,
    r.key_id,
    p.canonical_roman,
    'frase_cadencial',
    'Ejemplo alineado con patron principal de la progresion.',
    0.8
FROM progression_work_examples e
JOIN progressions p ON p.id = e.progression_id
LEFT JOIN progression_realizations r ON r.progression_id = p.id
WHERE r.id = (
    SELECT MIN(r2.id)
    FROM progression_realizations r2
    WHERE r2.progression_id = p.id
);
