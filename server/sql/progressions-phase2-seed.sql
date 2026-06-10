PRAGMA foreign_keys = ON;

-- =========================================================
-- FASE 2 (MVP MEDIO) - Curacion de cobertura y repertorio
-- =========================================================

-- 0) Recalculo de vista de cobertura para evitar sobreconteo por variantes
DROP VIEW IF EXISTS vw_progression_coverage;

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

-- 0.1) Nuevas progresiones de Poulenc para probar biblioteca por compositor
INSERT OR IGNORE INTO progressions
(id, composer_id, style_id, name, canonical_roman, mode, harmonic_language, cadence_type, tension_profile, expressive_character, difficulty_level, description, usage_context, voice_leading_notes, instrumentation_notes, is_sequence, is_modulatory, source_reference)
VALUES
(14, 13, 5, 'Poulenc Plagal Pivot', 'I-IV-ii-V-I', 'major', 'Neoclassical functional', 'Compact authentic cadence', 'Medium', 'Clear, elegant, direct', 2, 'Modelo funcional breve con giro plagal previo al cierre.', 'Frases cortas y enlaces entre secciones.', 'Priorizar continuidad por notas comunes entre IV y ii.', 'Muy util en piano y camara.', 0, 0, 'Modelo inspirado en giros tonales de Poulenc.'),
(15, 13, 5, 'Poulenc Third-Color Return', 'I-bIII-IV-I', 'major', 'Modal-neoclassical', 'Color return cadence', 'Low-medium', 'Ironic, bright, stylized', 3, 'Mezcla modal con retorno directo a tonica.', 'Contraste de color dentro de frase estable.', 'Controlar color de bIII sin perder centro tonal.', 'Adecuado para escritura coral y piano.', 0, 0, 'Modelo inspirado en color neoclasico frances.'),
(16, 13, 5, 'Poulenc Minor Stage Turn', 'i-iv-V-i', 'minor', 'Neoclassical minor', 'Short minor cadence', 'Medium', 'Dramatic, concise', 2, 'Cadencia menor corta con gesto teatral.', 'Cierres de frase y respuestas antiteticas.', 'Mantener bajo claro hacia V-i.', 'Funciona en texturas homofonicas.', 0, 0, 'Modelo inspirado en giro escenico poulenciano.'),
(17, 13, 5, 'Poulenc Lydian Bright Arc', 'I-II-V-I', 'major', 'Lydian-neoclassical color', 'Open bright cadence', 'Medium', 'Brilliant, dry, angular', 4, 'Uso de II mayor como color luminoso antes de dominante.', 'Pasajes de brillo y secciones de contraste.', 'Evitar sobrecarga cromatica en voces internas.', 'Apto para piano y ensamble mixto.', 0, 0, 'Modelo inspirado en color lidio tonal moderno.'),
(18, 13, 5, 'Poulenc Mixed Loop', 'I-vi-bVII-IV-I', 'major', 'Mixed-mode neoclassical', 'Loop with return', 'Medium', 'Urban, incisive, balanced', 3, 'Bucle de mezcla modal con retorno funcional a tonica.', 'Patrones repetitivos con cierre claro.', 'Asegurar soporte del bajo en bVII-IV.', 'Idiomatico para piano ritmico y grupo reducido.', 1, 0, 'Modelo inspirado en bucles modales de caracter neoclasico.');

INSERT OR IGNORE INTO progression_degrees
(progression_id, degree_order, roman_numeral, chord_quality, inversion, harmonic_function_id, chord_symbol_relative, expected_resolution, degree_role, expressive_color, stability_level, voice_leading_notes, comments)
VALUES
(14, 1, 'I', 'major triad', 'root', 1, '1', 'Conduce a IV', 'Ancla tonal', 'Stable', 5, 'Centro tonal claro.', 'Inicio.'),
(14, 2, 'IV', 'major triad', 'root', 2, '4', 'Conduce a ii', 'Predominante amplia', 'Open', 4, 'Notas comunes con ii.', 'Puente plagal.'),
(14, 3, 'ii', 'minor triad', 'root', 2, '2', 'Conduce a V', 'Predominante', 'Preparatory', 3, 'Preparar sensible.', 'Pre-dominante.'),
(14, 4, 'V', 'dominant', 'root', 3, '5', 'Resuelve a I', 'Tension', 'Directed', 2, 'Resolver sensible.', 'Dominante.'),
(14, 5, 'I', 'major triad', 'root', 4, '1', 'Reposo', 'Cierre', 'Conclusive', 5, 'Reposo final.', 'Cadencia.'),

(15, 1, 'I', 'major triad', 'root', 1, '1', 'Conduce a bIII', 'Centro tonal', 'Stable', 5, 'Tonica firme.', 'Inicio.'),
(15, 2, 'bIII', 'major triad', 'root', 6, 'b3', 'Conduce a IV', 'Color modal', 'Coloristic', 4, 'No perder referencia tonal.', 'Color.'),
(15, 3, 'IV', 'major triad', 'root', 2, '4', 'Conduce a I', 'Predominante suave', 'Warm', 4, 'Dirigir soprano a tonica.', 'Preparacion.'),
(15, 4, 'I', 'major triad', 'root', 4, '1', 'Reposo', 'Retorno', 'Settled', 5, 'Cierre claro.', 'Retorno.'),

(16, 1, 'i', 'minor triad', 'root', 1, '1', 'Conduce a iv', 'Centro menor', 'Dark stable', 5, 'Anclar modo menor.', 'Inicio.'),
(16, 2, 'iv', 'minor triad', 'root', 2, '4', 'Conduce a V', 'Predominante', 'Brooding', 3, 'Bajo por grados conjuntos.', 'Preparacion.'),
(16, 3, 'V', 'dominant', 'root', 3, '5', 'Resuelve a i', 'Tension principal', 'Acute', 2, 'Sensible y septima bien resueltas.', 'Dominante.'),
(16, 4, 'i', 'minor triad', 'root', 4, '1', 'Reposo', 'Cierre menor', 'Release', 5, 'Cierre estable.', 'Final.'),

(17, 1, 'I', 'major triad', 'root', 1, '1', 'Conduce a II', 'Centro brillante', 'Stable-bright', 5, 'Afirmar tonica.', 'Inicio.'),
(17, 2, 'II', 'major triad', 'root', 7, '2', 'Conduce a V', 'Color lidio', 'Sharp-color', 3, 'Controlar color del segundo grado.', 'Color principal.'),
(17, 3, 'V', 'dominant', 'root', 3, '5', 'Resuelve a I', 'Tension', 'Directed', 2, 'Resolucion clara.', 'Dominante.'),
(17, 4, 'I', 'major triad', 'root', 4, '1', 'Reposo', 'Cierre', 'Conclusive', 5, 'Reposo final.', 'Cadencia.'),

(18, 1, 'I', 'major triad', 'root', 1, '1', 'Conduce a vi', 'Centro', 'Stable', 5, 'Tonica clara.', 'Inicio.'),
(18, 2, 'vi', 'minor triad', 'root', 9, '6', 'Conduce a bVII', 'Prolongacion', 'Soft', 4, 'Conectar por terceras.', 'Expansion.'),
(18, 3, 'bVII', 'major triad', 'root', 6, 'b7', 'Conduce a IV', 'Color modal', 'Open', 3, 'No perder direccion del bajo.', 'Color.'),
(18, 4, 'IV', 'major triad', 'root', 2, '4', 'Conduce a I', 'Predominante', 'Preparatory', 3, 'Preparar retorno.', 'Preparacion.'),
(18, 5, 'I', 'major triad', 'root', 4, '1', 'Reposo', 'Retorno', 'Settled', 5, 'Cierre firme.', 'Final.');

INSERT OR IGNORE INTO progression_tags (progression_id, tag_id) VALUES
(14, 7), (14, 1),
(15, 7), (15, 6),
(16, 7), (16, 10),
(17, 7), (17, 6),
(18, 7), (18, 5);

INSERT OR IGNORE INTO progression_search_aliases (progression_id, alias_name, alias_roman) VALUES
(14, 'Poulenc funcional breve', 'I-IV-ii-V-I'),
(15, 'Poulenc color de tercera', 'I-bIII-IV-I'),
(16, 'Poulenc giro menor', 'i-iv-V-i'),
(17, 'Poulenc lidio', 'I-II-V-I'),
(18, 'Poulenc bucle mixto', 'I-vi-bVII-IV-I');

-- 1) Mas realizaciones por progresion (objetivo: minimo 4 en catalogo principal)
INSERT OR IGNORE INTO progression_realizations
(progression_id, key_id, root_note, chord_sequence_absolute, bass_sequence, notation_ref, audio_demo_ref, notes)
VALUES
(2, 3, 'D', 'D - Bm - Em - A - D', 'D - B - E - A - D', '/assets/notation/progressions/p2_k3.musicxml', '/assets/audio/progressions/p2_k3.mp3', 'Expansion beethoveniana en D mayor.'),
(2, 12, 'F', 'F - Dm - Gm - C - F', 'F - D - G - C - F', '/assets/notation/progressions/p2_k12.musicxml', '/assets/audio/progressions/p2_k12.mp3', 'Expansion beethoveniana en F mayor.'),
(3, 2, 'G', 'G - D/F# - G/D - D7 - G', 'G - F# - D - D - G', '/assets/notation/progressions/p3_k2.musicxml', '/assets/audio/progressions/p3_k2.mp3', 'Cadencia rossiniana en G mayor.'),
(3, 11, 'Bb', 'Bb - F/A - Bb/F - F7 - Bb', 'Bb - A - F - F - Bb', '/assets/notation/progressions/p3_k11.musicxml', '/assets/audio/progressions/p3_k11.mp3', 'Cadencia rossiniana en Bb mayor.'),
(4, 5, 'E', 'E - G#m - A - F#m/A - B - E', 'E - G# - A - A - B - E', '/assets/notation/progressions/p4_k5.musicxml', '/assets/audio/progressions/p4_k5.mp3', 'Arco belcantista en E mayor.'),
(4, 9, 'Ab', 'Ab - Cm - Db - Bbm/Db - Eb - Ab', 'Ab - C - Db - Db - Eb - Ab', '/assets/notation/progressions/p4_k9.musicxml', '/assets/audio/progressions/p4_k9.mp3', 'Arco belcantista en Ab mayor.'),
(6, 13, 'A', 'Am - F - Dm - E - Am', 'A - F - D - E - A', '/assets/notation/progressions/p6_k13.musicxml', '/assets/audio/progressions/p6_k13.mp3', 'Impulso verdiano en A menor.'),
(6, 21, 'C', 'Cm - Ab - Fm - G - Cm', 'C - Ab - F - G - C', '/assets/notation/progressions/p6_k21.musicxml', '/assets/audio/progressions/p6_k21.mp3', 'Impulso verdiano en C menor.'),
(7, 14, 'E', 'Em - Am/C - F/A - B - Em', 'E - C - A - B - E', '/assets/notation/progressions/p7_k14.musicxml', '/assets/audio/progressions/p7_k14.mp3', 'Predominante cromatica en E menor.'),
(7, 22, 'F', 'Fm - Bbm/Db - Gb/Bb - C - Fm', 'F - Db - Bb - C - F', '/assets/notation/progressions/p7_k22.musicxml', '/assets/audio/progressions/p7_k22.mp3', 'Predominante cromatica en F menor.'),
(8, 2, 'G', 'G - Em - C - D - G', 'G - E - C - D - G', '/assets/notation/progressions/p8_k2.musicxml', '/assets/audio/progressions/p8_k2.mp3', 'Frase lirica en G mayor.'),
(8, 4, 'A', 'A - F#m - D - E - A', 'A - F# - D - E - A', '/assets/notation/progressions/p8_k4.musicxml', '/assets/audio/progressions/p8_k4.mp3', 'Frase lirica en A mayor.'),
(9, 14, 'E', 'Em - G - D - Am - Em', 'E - G - D - A - E', '/assets/notation/progressions/p9_k14.musicxml', '/assets/audio/progressions/p9_k14.mp3', 'Color modal en E menor.'),
(9, 23, 'Bb', 'Bbm - Db - Ab - Ebm - Bbm', 'Bb - Db - Ab - Eb - Bb', '/assets/notation/progressions/p9_k23.musicxml', '/assets/audio/progressions/p9_k23.mp3', 'Color modal en Bb menor.'),
(10, 2, 'G', 'G - Bb - C - Eb', 'G - Bb - C - Eb', '/assets/notation/progressions/p10_k2.musicxml', '/assets/audio/progressions/p10_k2.mp3', 'Gesto mixto en G mayor.'),
(10, 3, 'D', 'D - F - G - Bb', 'D - F - G - Bb', '/assets/notation/progressions/p10_k3.musicxml', '/assets/audio/progressions/p10_k3.mp3', 'Gesto mixto en D mayor.'),
(11, 12, 'F', 'F - Am - Dm - Gm - C - F', 'F - A - D - G - C - F', '/assets/notation/progressions/p11_k12.musicxml', '/assets/audio/progressions/p11_k12.mp3', 'Continuum brahmsiano en F mayor.'),
(12, 13, 'A', 'Am - C - Dm - G - E - Am', 'A - C - D - G - E - A', '/assets/notation/progressions/p12_k13.musicxml', '/assets/audio/progressions/p12_k13.mp3', 'Arco narrativo en A menor.'),
(13, 22, 'F', 'Fm - Db - G°/Bb - C7 - Fm', 'F - Db - Bb - C - F', '/assets/notation/progressions/p13_k22.musicxml', '/assets/audio/progressions/p13_k22.mp3', 'Arrastre dominante en F menor.'),
(14, 1, 'C', 'C - F - Dm - G - C', 'C - F - D - G - C', '/assets/notation/progressions/p14_k1.musicxml', '/assets/audio/progressions/p14_k1.mp3', 'Poulenc plagal en C mayor.'),
(14, 10, 'Eb', 'Eb - Ab - Fm - Bb - Eb', 'Eb - Ab - F - Bb - Eb', '/assets/notation/progressions/p14_k10.musicxml', '/assets/audio/progressions/p14_k10.mp3', 'Poulenc plagal en Eb mayor.'),
(15, 1, 'C', 'C - Eb - F - C', 'C - Eb - F - C', '/assets/notation/progressions/p15_k1.musicxml', '/assets/audio/progressions/p15_k1.mp3', 'Color de tercera en C mayor.'),
(15, 2, 'G', 'G - Bb - C - G', 'G - Bb - C - G', '/assets/notation/progressions/p15_k2.musicxml', '/assets/audio/progressions/p15_k2.mp3', 'Color de tercera en G mayor.'),
(16, 19, 'D', 'Dm - Gm - A - Dm', 'D - G - A - D', '/assets/notation/progressions/p16_k19.musicxml', '/assets/audio/progressions/p16_k19.mp3', 'Giro menor en D menor.'),
(16, 21, 'C', 'Cm - Fm - G - Cm', 'C - F - G - C', '/assets/notation/progressions/p16_k21.musicxml', '/assets/audio/progressions/p16_k21.mp3', 'Giro menor en C menor.'),
(17, 1, 'C', 'C - D - G - C', 'C - D - G - C', '/assets/notation/progressions/p17_k1.musicxml', '/assets/audio/progressions/p17_k1.mp3', 'Color lidio en C mayor.'),
(17, 4, 'A', 'A - B - E - A', 'A - B - E - A', '/assets/notation/progressions/p17_k4.musicxml', '/assets/audio/progressions/p17_k4.mp3', 'Color lidio en A mayor.'),
(18, 1, 'C', 'C - Am - Bb - F - C', 'C - A - Bb - F - C', '/assets/notation/progressions/p18_k1.musicxml', '/assets/audio/progressions/p18_k1.mp3', 'Bucle mixto en C mayor.'),
(18, 11, 'Bb', 'Bb - Gm - Ab - Eb - Bb', 'Bb - G - Ab - Eb - Bb', '/assets/notation/progressions/p18_k11.musicxml', '/assets/audio/progressions/p18_k11.mp3', 'Bucle mixto en Bb mayor.');

-- 2) Variante por defecto para realizaciones nuevas (solo si faltan)
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
FROM progression_realizations r
WHERE NOT EXISTS (
    SELECT 1
    FROM realization_variants rv
    WHERE rv.realization_id = r.id
      AND rv.variant_code = 'block_default'
);

-- 3) Variante adicional de lectura horizontal para nuevas realizaciones Fase 2
INSERT OR IGNORE INTO realization_variants
(realization_id, variant_code, voicing_label, texture, rhythmic_pattern, tempo_bpm, chord_sequence_absolute, bass_sequence, notation_ref, audio_demo_ref, difficulty_delta, is_default)
SELECT
    r.id,
    'legato_line',
    'Linea ligada',
    'melodico-armonica',
    'negras',
    76,
    r.chord_sequence_absolute,
    r.bass_sequence,
    r.notation_ref,
    r.audio_demo_ref,
    1,
    0
FROM progression_realizations r
WHERE (r.progression_id = 2 AND r.key_id IN (3, 12))
   OR (r.progression_id = 3 AND r.key_id IN (2, 11))
   OR (r.progression_id = 4 AND r.key_id IN (5, 9))
   OR (r.progression_id = 6 AND r.key_id IN (13, 21))
   OR (r.progression_id = 7 AND r.key_id IN (14, 22))
   OR (r.progression_id = 8 AND r.key_id IN (2, 4))
   OR (r.progression_id = 9 AND r.key_id IN (14, 23))
   OR (r.progression_id = 10 AND r.key_id IN (2, 3))
   OR (r.progression_id = 11 AND r.key_id IN (12))
   OR (r.progression_id = 12 AND r.key_id IN (13))
   OR (r.progression_id = 13 AND r.key_id IN (22))
   OR (r.progression_id = 14 AND r.key_id IN (1, 10))
   OR (r.progression_id = 15 AND r.key_id IN (1, 2))
   OR (r.progression_id = 16 AND r.key_id IN (19, 21))
   OR (r.progression_id = 17 AND r.key_id IN (1, 4))
   OR (r.progression_id = 18 AND r.key_id IN (1, 11));

-- 4) Limpieza de ejemplos duplicados y guardarrail para futuros seeds
DELETE FROM progression_work_examples
WHERE id NOT IN (
    SELECT MIN(id)
    FROM progression_work_examples
    GROUP BY
        progression_id,
        work_id,
        COALESCE(section_label, ''),
        COALESCE(measure_start, -1),
        COALESCE(measure_end, -1),
        COALESCE(commentary, '')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_progression_work_examples_dedup
ON progression_work_examples (
    progression_id,
    work_id,
    COALESCE(section_label, ''),
    COALESCE(measure_start, -1),
    COALESCE(measure_end, -1),
    COALESCE(commentary, '')
);

-- 5) Obras nuevas para reforzar vinculo compositor-progresion
INSERT OR IGNORE INTO works
(id, composer_id, title, catalogue_reference, year_composed, genre, notes)
VALUES
(14, 1, 'Symphony No. 40 in G minor', 'K. 550', 1788, 'Symphony', 'Cadencias clasicas y continuidad formal.'),
(15, 2, 'Symphony No. 5 in C minor', 'Op. 67', 1808, 'Symphony', 'Expansion funcional con fuerte direccionalidad.'),
(16, 3, 'Guillaume Tell Overture', 'Finale', 1829, 'Opera Overture', 'Gesto cadencial brillante y teatral.'),
(17, 4, 'I Puritani', 'Atto I', 1835, 'Opera', 'Frases largas con soporte armonico lirico.'),
(18, 5, 'L''elisir d''amore', 'Atto II', 1832, 'Opera', 'Tension menor en contexto belcantista.'),
(19, 6, 'Rigoletto', 'Atto III', 1851, 'Opera', 'Direccion dramatica y cierre tonal contundente.'),
(20, 7, 'Prelude in C minor', 'Op. 28 No. 20', 1839, 'Piano', 'Color cromatico y conduccion intensa.'),
(21, 10, 'Symphony No. 6 in B minor', 'Op. 74', 1893, 'Symphony', 'Progresiones liricas con amplitud expresiva.'),
(22, 12, 'Clair de lune', 'Suite bergamasque', 1905, 'Piano', 'Color modal y ambiguedad funcional controlada.'),
(23, 13, 'Gloria', 'FP 177', 1959, 'Choral-Orchestral', 'Mezcla modal y gesto neoclasico.'),
(24, 9, 'Symphony No. 3 in F major', 'Op. 90', 1883, 'Symphony', 'Continuidad interna y densidad brahmsiana.'),
(25, 8, 'Carnaval', 'Op. 9', 1835, 'Piano', 'Narrativa armonica en miniaturas.'),
(26, 11, 'Piano Concerto No. 2 in C minor', 'Op. 18', 1901, 'Concerto', 'Arrastre dominante y climax romantico tardio.'),
(27, 13, 'Concert champetre', 'FP 49', 1928, 'Concerto', 'Gestos neoclasicos con claridad ritmica.'),
(28, 13, 'Aubade', 'FP 51', 1929, 'Ballet', 'Contrastes breves y articulacion armonica seca.'),
(29, 13, 'Sonata para clarinete y piano', 'FP 184', 1962, 'Chamber', 'Diseno de frases cortas y color modal contenido.');

-- 6) Un ejemplo adicional por progresion (sube de 2 a 3)
INSERT OR IGNORE INTO progression_work_examples
(id, progression_id, work_id, section_label, measure_start, measure_end, commentary)
VALUES
(107, 1, 14, 'Periodo cadencial', 12, 18, 'I-IV-V-I con cierre formal claro en escritura clasica.'),
(108, 2, 15, 'Expansion motival', 28, 36, 'I-vi-ii-V-I sostenida por impulso ritmico y secuencial.'),
(109, 3, 16, 'Gesto de cierre', 44, 50, 'Patron I-V6-I6/4-V7-I con energia teatral.'),
(110, 4, 17, 'Frase cantabile', 21, 29, 'Arco lirico con predominante suave y llegada cadencial.'),
(111, 5, 18, 'Tension escenica', 38, 46, 'Cadencia menor con empuje de dominante.'),
(112, 6, 19, 'Climax dramatico', 60, 68, 'i-VI-iv-V-i con direccion de bajo bien marcada.'),
(113, 7, 20, 'Predominante cromatica', 8, 14, 'N6 y dominante como foco de color y resolucion.'),
(114, 8, 21, 'Linea amplia', 17, 24, 'I-vi-IV-V-I en frase lirica de gran respiracion.'),
(115, 9, 22, 'Color modal', 33, 40, 'i-III-VII-iv-i como ciclo de color no estrictamente funcional.'),
(116, 10, 23, 'Giro mixto', 11, 16, 'I-bIII-IV-bVI como gesto modal extendido.'),
(117, 11, 24, 'Continuidad interna', 72, 80, 'Cadena funcional larga con conduccion de voces internas.'),
(118, 12, 25, 'Arco narrativo', 26, 34, 'Contraste de color en menor con retorno estructural.'),
(119, 13, 26, 'Preparacion de retorno', 90, 99, 'iio6-V7-i como nucleo de traccion tonal.');

-- 6.1) Segundo bloque de ejemplos para completar progresiones 1-10
INSERT OR IGNORE INTO progression_work_examples
(id, progression_id, work_id, section_label, measure_start, measure_end, commentary)
VALUES
(120, 1, 14, 'Reexposicion cadencial', 52, 58, 'Cadencia autentica con cierre simetrico de periodo.'),
(121, 2, 15, 'Puente funcional', 74, 82, 'Expansion I-vi-ii-V-I en zona de desarrollo.'),
(122, 3, 16, 'Cierre de escena', 88, 94, 'Giro rossiniano con dominante reforzada.'),
(123, 4, 17, 'Respiracion melodica', 47, 55, 'Soporte armonico para frase cantabile extensa.'),
(124, 5, 18, 'Retorno menor', 64, 72, 'Recuperacion de tonica menor tras dominante.'),
(125, 6, 19, 'Cadencia de acto', 103, 110, 'Impulso dramatico en cierre de seccion vocal.'),
(126, 7, 20, 'Color de napolitana', 21, 27, 'Predominante cromatica previa a resolucion tonal.'),
(127, 8, 21, 'Expasion lirica', 66, 72, 'Progresion amplia con bajo direccional estable.'),
(128, 9, 22, 'Plan sonoro modal', 54, 61, 'Secuencia de color con funcion relajada.'),
(129, 10, 23, 'Gesto neoclasico', 35, 41, 'Mezcla modal para contraste formal breve.'),
(130, 14, 27, 'Cierre funcional breve', 18, 24, 'I-IV-ii-V-I con articulacion neoclasica.'),
(131, 15, 27, 'Contraste modal', 41, 48, 'I-bIII-IV-I como color de tercera.'),
(132, 16, 28, 'Respuesta menor', 22, 29, 'i-iv-V-i en frase teatral corta.'),
(133, 17, 29, 'Brillo lidio', 15, 20, 'I-II-V-I como gesto de luminosidad.'),
(134, 18, 29, 'Bucle mixto', 33, 40, 'I-vi-bVII-IV-I con retorno claro.');

-- 7) Anotaciones analiticas para ejemplos nuevos
INSERT OR IGNORE INTO work_example_annotations
(example_id, key_id, roman_in_context, form_function, analysis_note, confidence)
SELECT
    e.id,
    r.key_id,
    p.canonical_roman,
    'expansion_cadencial',
    'Ejemplo curado para reforzar reconocimiento auditivo y visual de la progresion.',
    0.84
FROM progression_work_examples e
JOIN progressions p ON p.id = e.progression_id
LEFT JOIN progression_realizations r ON r.progression_id = p.id
WHERE e.id BETWEEN 107 AND 134
  AND r.id = (
      SELECT MIN(r2.id)
      FROM progression_realizations r2
      WHERE r2.progression_id = p.id
  );

-- 8) Pedagogia y errores base para progresiones nuevas (si faltan)
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

-- 9) Error frecuente adicional para progresiones avanzadas
INSERT OR IGNORE INTO progression_common_errors
(progression_id, error_code, error_description, hint_subtle, hint_technical, hint_full, priority)
SELECT
    pp.progression_id,
    'chromatic_spelling',
    'Se confunden alteraciones de color con errores de funcion.',
    'Escucha si el acorde colorea o realmente cambia la direccion tonal.',
    'Distingue prestamo modal, acorde cromatico funcional y dominante aplicada por resolucion.',
    'Si el acorde tiene alteraciones, verifica primero su resolucion y luego su etiqueta en el contexto de la tonalidad activa.',
    3
FROM progression_pedagogy pp
WHERE pp.level >= 4;

-- 10) Ajuste de minutos estimados por nivel (solo en caso de valores bajos)
UPDATE progression_pedagogy
SET estimated_minutes = CASE
    WHEN level >= 4 THEN MAX(estimated_minutes, 12)
    WHEN level = 3 THEN MAX(estimated_minutes, 10)
    ELSE MAX(estimated_minutes, 8)
END;
