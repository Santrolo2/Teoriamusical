PRAGMA foreign_keys = ON;

-- =========================================================
-- ESQUEMA BASE
-- Biblioteca de progresiones de acordes por compositor
-- Compatible principalmente con SQLite
-- =========================================================

-- ---------------------------------------------------------
-- 1. PERIODOS HISTORICOS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    start_year INTEGER,
    end_year INTEGER,
    description TEXT
);

-- ---------------------------------------------------------
-- 2. COMPOSITORES
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS composers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL UNIQUE,
    birth_year INTEGER,
    death_year INTEGER,
    nationality TEXT,
    period_id INTEGER,
    notes TEXT,
    FOREIGN KEY (period_id) REFERENCES periods(id)
);

-- ---------------------------------------------------------
-- 3. ESTILOS / LENGUAJES
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS styles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- ---------------------------------------------------------
-- 4. FUNCIONES ARMONICAS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS harmonic_functions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    short_code TEXT NOT NULL UNIQUE,
    description TEXT
);

-- ---------------------------------------------------------
-- 5. TONALIDADES
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tonic TEXT NOT NULL,
    mode TEXT NOT NULL,
    display_name TEXT NOT NULL UNIQUE,
    accidentals INTEGER,
    enharmonic_group TEXT
);

-- ---------------------------------------------------------
-- 6. PROGRESIONES ABSTRACTAS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS progressions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    composer_id INTEGER NOT NULL,
    style_id INTEGER,
    name TEXT NOT NULL,
    canonical_roman TEXT NOT NULL,
    mode TEXT NOT NULL,
    harmonic_language TEXT,
    cadence_type TEXT,
    tension_profile TEXT,
    expressive_character TEXT,
    difficulty_level INTEGER,
    description TEXT,
    usage_context TEXT,
    voice_leading_notes TEXT,
    instrumentation_notes TEXT,
    is_sequence INTEGER DEFAULT 0,
    is_modulatory INTEGER DEFAULT 0,
    source_reference TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (composer_id) REFERENCES composers(id),
    FOREIGN KEY (style_id) REFERENCES styles(id)
);

-- ---------------------------------------------------------
-- 7. GRADOS DENTRO DE CADA PROGRESION
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS progression_degrees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    progression_id INTEGER NOT NULL,
    degree_order INTEGER NOT NULL,
    roman_numeral TEXT NOT NULL,
    chord_quality TEXT,
    inversion TEXT,
    harmonic_function_id INTEGER,
    chord_symbol_relative TEXT,
    expected_resolution TEXT,
    degree_role TEXT,
    expressive_color TEXT,
    stability_level INTEGER,
    voice_leading_notes TEXT,
    comments TEXT,
    FOREIGN KEY (progression_id) REFERENCES progressions(id) ON DELETE CASCADE,
    FOREIGN KEY (harmonic_function_id) REFERENCES harmonic_functions(id),
    UNIQUE (progression_id, degree_order)
);

-- ---------------------------------------------------------
-- 8. REALIZACIONES EN TONALIDADES CONCRETAS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS progression_realizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    progression_id INTEGER NOT NULL,
    key_id INTEGER NOT NULL,
    root_note TEXT,
    chord_sequence_absolute TEXT NOT NULL,
    bass_sequence TEXT,
    midi_export_ref TEXT,
    audio_demo_ref TEXT,
    notation_ref TEXT,
    notes TEXT,
    FOREIGN KEY (progression_id) REFERENCES progressions(id) ON DELETE CASCADE,
    FOREIGN KEY (key_id) REFERENCES keys(id),
    UNIQUE (progression_id, key_id)
);

-- ---------------------------------------------------------
-- 9. ETIQUETAS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS progression_tags (
    progression_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (progression_id, tag_id),
    FOREIGN KEY (progression_id) REFERENCES progressions(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- 10. OBRAS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS works (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    composer_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    catalogue_reference TEXT,
    year_composed INTEGER,
    genre TEXT,
    notes TEXT,
    FOREIGN KEY (composer_id) REFERENCES composers(id)
);

CREATE TABLE IF NOT EXISTS progression_work_examples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    progression_id INTEGER NOT NULL,
    work_id INTEGER NOT NULL,
    section_label TEXT,
    measure_start INTEGER,
    measure_end INTEGER,
    commentary TEXT,
    FOREIGN KEY (progression_id) REFERENCES progressions(id) ON DELETE CASCADE,
    FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE
);

-- =========================================================
-- DATOS SEMILLA
-- =========================================================

-- ---------------------------------------------------------
-- PERIODOS
-- ---------------------------------------------------------
INSERT OR IGNORE INTO periods (id, name, start_year, end_year, description) VALUES
(1, 'Barroco', 1600, 1750, 'Lenguaje tonal en consolidación, secuencias, bajo continuo, cadencias claras.'),
(2, 'Clasicismo', 1750, 1820, 'Claridad formal, equilibrio, funciones tonales definidas.'),
(3, 'Bel canto / Primer Romanticismo', 1800, 1850, 'Predominio melódico, teatralidad, cadencias enfáticas.'),
(4, 'Romanticismo', 1820, 1910, 'Expansión cromática, mayor tensión expresiva, modulaciones amplias.'),
(5, 'Modernismo / Siglo XX temprano', 1890, 1945, 'Modalidad ampliada, color armónico, ambigüedad funcional.');

-- ---------------------------------------------------------
-- ESTILOS
-- ---------------------------------------------------------
INSERT OR IGNORE INTO styles (id, name, description) VALUES
(1, 'Tonal funcional', 'Predominio de tónica, predominante y dominante.'),
(2, 'Bel canto', 'Cadencias teatrales, apoyaturas, expansión dominante, brillo vocal.'),
(3, 'Romántico cromático', 'Cromatismo funcional y color expresivo intenso.'),
(4, 'Impresionista / colorista', 'Función tonal relajada, color, acordes por sonoridad.'),
(5, 'Neoclásico / modal extendido', 'Referencia tonal con mezcla modal y giros más secos.');

-- ---------------------------------------------------------
-- FUNCIONES ARMONICAS
-- ---------------------------------------------------------
INSERT OR IGNORE INTO harmonic_functions (id, name, short_code, description) VALUES
(1, 'Tonic', 'T', 'Centro de reposo y afirmación tonal.'),
(2, 'Predominant', 'PD', 'Prepara el campo para la dominante.'),
(3, 'Dominant', 'D', 'Genera tensión orientada a resolución.'),
(4, 'Cadential', 'CAD', 'Elemento asociado al cierre formal o semicierre.'),
(5, 'Secondary Dominant', 'SD', 'Dominante aplicada a otro grado.'),
(6, 'Modal Mixture', 'MM', 'Acorde tomado del modo paralelo o mezcla modal.'),
(7, 'Coloristic', 'C', 'Uso prioritario del color sobre la función fuerte.'),
(8, 'Sequential', 'SEQ', 'Elemento dentro de una secuencia armónica repetitiva.'),
(9, 'Prolongational', 'PRO', 'Expansión de una función ya establecida.'),
(10, 'Chromatic Predominant', 'CPD', 'Predominante cromática, frecuente antes de la dominante.');

-- ---------------------------------------------------------
-- COMPOSITORES
-- ---------------------------------------------------------
INSERT OR IGNORE INTO composers (id, full_name, birth_year, death_year, nationality, period_id, notes) VALUES
(1, 'Wolfgang Amadeus Mozart', 1756, 1791, 'Austriaco', 2, 'Modelo de equilibrio clásico con gran claridad funcional.'),
(2, 'Ludwig van Beethoven', 1770, 1827, 'Alemán', 2, 'Puente entre Clasicismo y Romanticismo; intensificación de procesos armónicos.'),
(3, 'Gioachino Rossini', 1792, 1868, 'Italiano', 3, 'Bel canto, brillo, fórmulas cadenciales teatrales y energía rítmica.'),
(4, 'Vincenzo Bellini', 1801, 1835, 'Italiano', 3, 'Línea vocal amplia, armonía de sostén, lirismo sostenido.'),
(5, 'Gaetano Donizetti', 1797, 1848, 'Italiano', 3, 'Bel canto flexible con fuerza dramática y cadencial.'),
(6, 'Giuseppe Verdi', 1813, 1901, 'Italiano', 4, 'Dramatización tonal, claridad teatral, tensión direccional fuerte.'),
(7, 'Frédéric Chopin', 1810, 1849, 'Polaco', 4, 'Romanticismo pianístico con cromatismo refinado.'),
(8, 'Robert Schumann', 1810, 1856, 'Alemán', 4, 'Lirismo armónico y ambigüedades locales dentro de la tonalidad.'),
(9, 'Johannes Brahms', 1833, 1897, 'Alemán', 4, 'Densidad contrapuntística y expansión funcional interna.'),
(10, 'Pyotr Ilyich Tchaikovsky', 1840, 1893, 'Ruso', 4, 'Amplia melodía, color romántico y progresiones emocionales directas.'),
(11, 'Sergei Rachmaninoff', 1873, 1943, 'Ruso', 4, 'Romanticismo tardío, cromatismo amplio, densidad pianística y orquestal.'),
(12, 'Claude Debussy', 1862, 1918, 'Francés', 5, 'Color armónico, modalidad, planing, función tonal relajada.'),
(13, 'Francis Poulenc', 1899, 1963, 'Francés', 5, 'Mezcla de claridad tonal, ironía, giros modales y neoclasicismo flexible.');

-- ---------------------------------------------------------
-- TONALIDADES
-- ---------------------------------------------------------
INSERT OR IGNORE INTO keys (id, tonic, mode, display_name, accidentals, enharmonic_group) VALUES
(1, 'C', 'major', 'C major', 0, 'C'),
(2, 'G', 'major', 'G major', 1, 'G'),
(3, 'D', 'major', 'D major', 2, 'D'),
(4, 'A', 'major', 'A major', 3, 'A'),
(5, 'E', 'major', 'E major', 4, 'E'),
(6, 'B', 'major', 'B major', 5, 'B/Cb'),
(7, 'F#', 'major', 'F# major', 6, 'F#/Gb'),
(8, 'Db', 'major', 'Db major', -5, 'C#/Db'),
(9, 'Ab', 'major', 'Ab major', -4, 'Ab'),
(10, 'Eb', 'major', 'Eb major', -3, 'Eb'),
(11, 'Bb', 'major', 'Bb major', -2, 'Bb'),
(12, 'F', 'major', 'F major', -1, 'F'),
(13, 'A', 'minor', 'A minor', 0, 'A'),
(14, 'E', 'minor', 'E minor', 1, 'E'),
(15, 'B', 'minor', 'B minor', 2, 'B'),
(16, 'F#', 'minor', 'F# minor', 3, 'F#'),
(17, 'C#', 'minor', 'C# minor', 4, 'C#/Db'),
(18, 'G#', 'minor', 'G# minor', 5, 'G#/Ab'),
(19, 'D', 'minor', 'D minor', -1, 'D'),
(20, 'G', 'minor', 'G minor', -2, 'G'),
(21, 'C', 'minor', 'C minor', -3, 'C'),
(22, 'F', 'minor', 'F minor', -4, 'F'),
(23, 'Bb', 'minor', 'Bb minor', -5, 'A#/Bb'),
(24, 'Eb', 'minor', 'Eb minor', -6, 'D#/Eb');

-- ---------------------------------------------------------
-- TAGS
-- ---------------------------------------------------------
INSERT OR IGNORE INTO tags (id, name) VALUES
(1, 'cadential'),
(2, 'bel canto'),
(3, 'lyrical'),
(4, 'chromatic'),
(5, 'sequence'),
(6, 'impressionist'),
(7, 'neoclassical'),
(8, 'romantic'),
(9, 'classical'),
(10, 'operatic');

-- =========================================================
-- PROGRESIONES DE EJEMPLO
-- =========================================================

-- 1 Mozart
INSERT OR IGNORE INTO progressions
(id, composer_id, style_id, name, canonical_roman, mode, harmonic_language, cadence_type, tension_profile, expressive_character, difficulty_level, description, usage_context, voice_leading_notes, instrumentation_notes, is_sequence, is_modulatory, source_reference)
VALUES
(1, 1, 1, 'Cadential Classical Prototype', 'I-IV-V-I', 'major', 'Functional tonal', 'Authentic cadence', 'Low to medium', 'Clear, balanced, conclusive', 1,
 'Progresión básica clásica de afirmación tonal y cierre claro.',
 'Cierres de frase, periodos regulares, temas principales.',
 'La sensible y el cuarto grado deben resolver con claridad hacia la tónica.',
 'Válida para teclado, orquesta y acompañamiento vocal.', 0, 0, 'Modelo estilístico clásico general.');

-- 2 Beethoven
INSERT OR IGNORE INTO progressions
VALUES
(2, 2, 1, 'Beethovenian Expansion', 'I-vi-ii-V-I', 'major', 'Functional tonal', 'Expanded authentic cadence', 'Medium', 'Directional, accumulative', 2,
 'Ampliación del cierre tonal mediante interpolación de acordes funcionales.',
 'Desarrollo de frase, preparación de cierre, expansión temática.',
 'Importa la continuidad entre bajo y voces internas.',
 'Muy útil en piano y escritura de conjunto.', 0, 0, 'Modelo tonal clásico-romántico.');

-- 3 Rossini
INSERT OR IGNORE INTO progressions
VALUES
(3, 3, 2, 'Rossinian Bright Cadence', 'I-V6-I6/4-V7-I', 'major', 'Bel canto tonal', 'Cadential formula', 'Medium to high near cadence', 'Brilliant, theatrical, propulsive', 2,
 'Fórmula cadencial brillante muy útil en escritura belcantista.',
 'Finales de frase vocal, acentos teatrales, entradas conclusivas.',
 'El I6/4 debe sentirse como apoyo cadencial de la dominante, no como tónica estable.',
 'Funciona muy bien con textura de acompañamiento ligera y activa.', 0, 0, 'Estilo belcantista general asociado a Rossini.');

-- 4 Bellini
INSERT OR IGNORE INTO progressions
VALUES
(4, 4, 2, 'Bellinian Lyrical Arc', 'I-iii-IV-ii6-V-I', 'major', 'Bel canto lyrical', 'Authentic cadence', 'Medium', 'Long-breathed, cantabile', 3,
 'Progresión de expansión lírica que sostiene una línea vocal amplia.',
 'Melodía cantabile, frases amplias, preparación expresiva.',
 'Las inversiones intermedias ayudan a la suavidad del bajo.',
 'Adecuada para canto con acompañamiento armónico no agresivo.', 0, 0, 'Modelo de lirismo belcantista.');

-- 5 Donizetti
INSERT OR IGNORE INTO progressions
VALUES
(5, 5, 2, 'Donizettian Minor Tension', 'i-iv-V-i', 'minor', 'Bel canto tonal', 'Authentic cadence in minor', 'Medium', 'Direct, dramatic, compact', 1,
 'Esquema menor conciso y teatral, muy útil para tensión directa.',
 'Recitativo acompañado, cabaletta menor, gesto dramático breve.',
 'La dominante suele intensificarse con sensible clara.',
 'Sirve tanto en piano como en orquesta teatral.', 0, 0, 'Modelo general menor belcantista.');

-- 6 Verdi
INSERT OR IGNORE INTO progressions
VALUES
(6, 6, 3, 'Verdian Dramatic Drive', 'i-VI-iv-V-i', 'minor', 'Romantic operatic', 'Dramatic authentic cadence', 'High', 'Noble, dark, theatrical', 3,
 'Secuencia dramática con peso en contraste entre color sombrío y resolución.',
 'Escena intensa, frase de conflicto, impulso dramático.',
 'El VI debe colorear sin debilitar la dirección global hacia la dominante.',
 'Muy operística en densidad media o plena.', 0, 0, 'Modelo de gesto dramático verdiano.');

-- 7 Chopin
INSERT OR IGNORE INTO progressions
VALUES
(7, 7, 3, 'Chopin Chromatic Predominant', 'i-iv6-N6-V-i', 'minor', 'Romantic chromatic', 'Chromatic authentic cadence', 'High', 'Refined, tense, expressive', 4,
 'Uso de napolitana como predominante cromática de gran carga expresiva.',
 'Nocturnos, mazurcas lentas, pasajes de alta sensibilidad armónica.',
 'La napolitana debe conducir con nitidez a la dominante.',
 'Especialmente idiomática en piano.', 0, 0, 'Modelo romántico cromático pianístico.');

-- 8 Tchaikovsky
INSERT OR IGNORE INTO progressions
VALUES
(8, 10, 3, 'Tchaikovskian Broad Lyric', 'I-vi-IV-V-I', 'major', 'Romantic tonal', 'Expanded authentic cadence', 'Medium', 'Warm, expansive, melodic', 2,
 'Progresión de gran cantabilidad y claridad emocional.',
 'Tema amplio, melodía sentimental, frase orquestal abierta.',
 'La relación vi-IV aporta expansión antes del cierre.',
 'Muy adaptable a orquesta y piano.', 0, 0, 'Modelo romántico lírico.');

-- 9 Debussy
INSERT OR IGNORE INTO progressions
VALUES
(9, 12, 4, 'Debussy Modal Color Loop', 'i-bVII-bVI-bVII', 'minor', 'Modal coloristic', 'Open / non-teleological', 'Low to medium', 'Suspended, atmospheric, coloristic', 3,
 'Ciclo modal-colorista con función tonal relajada y prioridad de sonoridad.',
 'Paisaje armónico, ostinato, preparación ambiental.',
 'No exigir resolución tradicional fuerte; importa el color y el plan sonoro.',
 'Muy útil con voicings abiertos y timbres suaves.', 1, 0, 'Modelo modal-colorista asociado al lenguaje debussyano.');

-- 10 Poulenc
INSERT OR IGNORE INTO progressions
VALUES
(10, 13, 5, 'Poulenc Mixed-Mode Gesture', 'I-bIII-IV-bVI', 'major', 'Neoclassical / modal mixture', 'Open color cadence', 'Medium', 'Dry, bright, ironic, noble', 4,
 'Gesto de mezcla modal y color armónico con lógica menos académica y más expresiva.',
 'Pasajes de carácter ambiguo, ironía, nobleza contenida.',
 'La mezcla modal debe sentirse orgánica y no como accidente aislado.',
 'Muy apta para piano, coro y textura de cámara.', 0, 0, 'Modelo mixto inspirado en giros poulencianos.');

-- =========================================================
-- GRADOS POR PROGRESION
-- =========================================================

-- Progresion 1: I-IV-V-I
INSERT OR IGNORE INTO progression_degrees
(progression_id, degree_order, roman_numeral, chord_quality, inversion, harmonic_function_id, chord_symbol_relative, expected_resolution, degree_role, expressive_color, stability_level, voice_leading_notes, comments)
VALUES
(1, 1, 'I', 'major triad', 'root', 1, '1', 'Puede prolongarse o ir a IV', 'Afirmación tonal inicial', 'Stable, bright', 5, 'Duplicaciones estables; centro tonal claro.', 'Punto de partida normativo.'),
(1, 2, 'IV', 'major triad', 'root', 2, '4', 'Tiende a V o a área cadencial', 'Predominante básica', 'Open, preparatory', 3, 'Movimiento conjunto útil hacia dominante.', 'Predominante clásica clara.'),
(1, 3, 'V', 'major triad / dominant', 'root', 3, '5', 'Resuelve a I', 'Pico de tensión funcional', 'Tense, directed', 2, 'La sensible debe resolver a tónica.', 'Dominante estructural.'),
(1, 4, 'I', 'major triad', 'root', 4, '1', 'Reposo final', 'Cierre y resolución', 'Conclusive', 5, 'Reposo pleno tras tensión.', 'Cierre auténtico simple.');

-- Progresion 2: I-vi-ii-V-I
INSERT OR IGNORE INTO progression_degrees VALUES
(NULL, 2, 1, 'I', 'major triad', 'root', 1, '1', 'Puede expandirse a vi', 'Inicio estable', 'Stable', 5, 'Conecta con bajo descendente o tercial.', 'Tónica inicial.'),
(NULL, 2, 2, 'vi', 'minor triad', 'root', 9, '6', 'Conduce a ii', 'Prolongación de tónica', 'Soft, inward', 4, 'Comparte notas con I y suaviza la transición.', 'Sustituto o expansión de tónica.'),
(NULL, 2, 3, 'ii', 'minor triad', 'root', 2, '2', 'Conduce a V', 'Predominante clara', 'Preparatory', 3, 'El cuarto grado interno prepara bien la dominante.', 'Muy típica en cierres expandidos.'),
(NULL, 2, 4, 'V', 'major triad / dominant', 'root', 3, '5', 'Resuelve a I', 'Dominante estructural', 'Directed tension', 2, 'Sensible con resolución obligada.', 'Centro de tensión.'),
(NULL, 2, 5, 'I', 'major triad', 'root', 4, '1', 'Reposo', 'Resolución final', 'Conclusive', 5, 'Reposo final.', 'Cierre completo.');

-- Progresion 3: I-V6-I6/4-V7-I
INSERT OR IGNORE INTO progression_degrees VALUES
(NULL, 3, 1, 'I', 'major triad', 'root', 1, '1', 'Va a dominante o expansión cadencial', 'Tónica inicial', 'Bright', 5, 'Centro afirmado.', 'Inicio claro.'),
(NULL, 3, 2, 'V6', 'major triad', 'first inversion', 3, '5/3', 'Empuja al I6/4 cadencial o refuerza la zona dominante', 'Dominante en impulso', 'Energetic', 2, 'El bajo en tercera suaviza pero mantiene dirección.', 'Muy útil en impulso teatral.'),
(NULL, 3, 3, 'I6/4', 'cadential six-four', 'second inversion', 4, '1/5', 'Resuelve a V7', 'Apoyo cadencial', 'Suspended tension', 2, 'Debe oírse como función dominante expandida.', 'No debe analizarse como simple tónica estable.'),
(NULL, 3, 4, 'V7', 'dominant seventh', 'root', 3, '5/7', 'Resuelve a I', 'Máxima preparación de cierre', 'Brilliant tension', 1, 'Resolver séptima descendente y sensible ascendente.', 'Dominante plena.'),
(NULL, 3, 5, 'I', 'major triad', 'root', 4, '1', 'Reposo', 'Cierre brillante', 'Resolute', 5, 'Afirmación final.', 'Cadencia belcantista.');

-- Progresion 4: I-iii-IV-ii6-V-I
INSERT OR IGNORE INTO progression_degrees VALUES
(NULL, 4, 1, 'I', 'major triad', 'root', 1, '1', 'Expande a iii', 'Inicio cantabile', 'Warm', 5, 'Base tonal.', 'Punto inicial.'),
(NULL, 4, 2, 'iii', 'minor triad', 'root', 9, '3', 'Conduce a IV', 'Expansión suave', 'Tender', 4, 'Comparte material con I y V.', 'Color suave de enlace.'),
(NULL, 4, 3, 'IV', 'major triad', 'root', 2, '4', 'Conduce a ii6', 'Predominante amplia', 'Lyrical preparation', 3, 'Amplitud en la línea.', 'Soporte para línea vocal.'),
(NULL, 4, 4, 'ii6', 'minor triad', 'first inversion', 2, '2/6', 'Conduce a V', 'Predominante refinada', 'Supple', 3, 'Bajo muy cantable.', 'Inversión muy útil para legato armónico.'),
(NULL, 4, 5, 'V', 'major triad / dominant', 'root', 3, '5', 'Resuelve a I', 'Tensión final', 'Directed', 2, 'Preparar cierre.', 'Dominante funcional.'),
(NULL, 4, 6, 'I', 'major triad', 'root', 4, '1', 'Reposo', 'Cierre lírico', 'Resolved', 5, 'Reposo final.', 'Conclusión.');

-- Progresion 5: i-iv-V-i
INSERT OR IGNORE INTO progression_degrees VALUES
(NULL, 5, 1, 'i', 'minor triad', 'root', 1, '1', 'Puede ir a iv', 'Inicio oscuro', 'Dark stability', 5, 'Centro menor claro.', 'Tónica menor.'),
(NULL, 5, 2, 'iv', 'minor triad', 'root', 2, '4', 'Conduce a V', 'Predominante menor', 'Somber preparation', 3, 'Color menor preparatorio.', 'Muy directa.'),
(NULL, 5, 3, 'V', 'major triad / dominant', 'root', 3, '5', 'Resuelve a i', 'Tensión dominante', 'Sharp dramatic pull', 2, 'Sensible elevada importante.', 'Dominante mayor en menor tonal.'),
(NULL, 5, 4, 'i', 'minor triad', 'root', 4, '1', 'Reposo', 'Resolución oscura', 'Dark resolution', 5, 'Cierre menor estable.', 'Cadencia menor básica.');

-- Progresion 6: i-VI-iv-V-i
INSERT OR IGNORE INTO progression_degrees VALUES
(NULL, 6, 1, 'i', 'minor triad', 'root', 1, '1', 'Expande a VI', 'Dark tonic', 'Noble dark', 5, 'Centro menor.', 'Inicio dramático.'),
(NULL, 6, 2, 'VI', 'major triad', 'root', 6, 'b6', 'Conduce a iv o área predominante', 'Color contrastante', 'Broad, tragic color', 4, 'Aporta expansión y cambio de luz.', 'Color muy operístico.'),
(NULL, 6, 3, 'iv', 'minor triad', 'root', 2, '4', 'Conduce a V', 'Predominante', 'Weighty', 3, 'Puente hacia dominante.', 'Reúne la tensión.'),
(NULL, 6, 4, 'V', 'major triad / dominant', 'root', 3, '5', 'Resuelve a i', 'Dominante dramática', 'Intense', 2, 'Tensión máxima previa al cierre.', 'Impulso teatral.'),
(NULL, 6, 5, 'i', 'minor triad', 'root', 4, '1', 'Reposo', 'Resolución grave', 'Resolved darkness', 5, 'Cierre en menor.', 'Conclusión.');

-- Progresion 7: i-iv6-N6-V-i
INSERT OR IGNORE INTO progression_degrees VALUES
(NULL, 7, 1, 'i', 'minor triad', 'root', 1, '1', 'Conduce a iv6', 'Minor tonic', 'Intimate', 5, 'Centro inicial.', 'Inicio estable.'),
(NULL, 7, 2, 'iv6', 'minor triad', 'first inversion', 2, '4/6', 'Conduce a N6', 'Predominante flexible', 'Subtle', 3, 'Bajo suave y elegante.', 'Prepara el cromatismo.'),
(NULL, 7, 3, 'N6', 'major triad', 'first inversion', 10, 'bII6', 'Conduce a V', 'Predominante cromática', 'Highly expressive', 2, 'Color intenso; evitar pérdida de dirección.', 'Napolitana típica.'),
(NULL, 7, 4, 'V', 'major triad / dominant', 'root', 3, '5', 'Resuelve a i', 'Dominante', 'Taut', 1, 'Sensible intensa.', 'Máxima tensión.'),
(NULL, 7, 5, 'i', 'minor triad', 'root', 4, '1', 'Reposo', 'Minor resolution', 'Deep resolution', 5, 'Cierre.', 'Conclusión.');

-- Progresion 8: I-vi-IV-V-I
INSERT OR IGNORE INTO progression_degrees VALUES
(NULL, 8, 1, 'I', 'major triad', 'root', 1, '1', 'Conduce a vi', 'Stable opening', 'Warm', 5, 'Centro claro.', 'Tónica inicial.'),
(NULL, 8, 2, 'vi', 'minor triad', 'root', 9, '6', 'Conduce a IV', 'Prolongación tonal', 'Tender melancholy', 4, 'Relación emocional con I.', 'Color expansivo.'),
(NULL, 8, 3, 'IV', 'major triad', 'root', 2, '4', 'Conduce a V', 'Predominante amplia', 'Open', 3, 'Abre el espacio previo al cierre.', 'Transición amplia.'),
(NULL, 8, 4, 'V', 'major triad / dominant', 'root', 3, '5', 'Resuelve a I', 'Dominante', 'Directed', 2, 'Tensión clara.', 'Preparación final.'),
(NULL, 8, 5, 'I', 'major triad', 'root', 4, '1', 'Reposo', 'Full resolution', 'Broad resolution', 5, 'Descanso final.', 'Cierre.');

-- Progresion 9: i-bVII-bVI-bVII
INSERT OR IGNORE INTO progression_degrees VALUES
(NULL, 9, 1, 'i', 'minor triad', 'root', 1, '1', 'Puede permanecer o desplazarse modalmente', 'Centro modal relativo', 'Dark suspended', 4, 'La estabilidad es relativa, no totalmente funcional.', 'Tónica modal.'),
(NULL, 9, 2, 'bVII', 'major triad', 'root', 7, 'b7', 'Puede ir a bVI o volver a i', 'Color modal', 'Open horizon', 3, 'Pensar más en color que en resolución fuerte.', 'Giro modal frecuente.'),
(NULL, 9, 3, 'bVI', 'major triad', 'root', 7, 'b6', 'Puede regresar a bVII', 'Color profundo', 'Veiled', 3, 'Plan sonoro antes que dirección tonal rígida.', 'Colorista.'),
(NULL, 9, 4, 'bVII', 'major triad', 'root', 7, 'b7', 'Puede reiniciar ciclo', 'Reapertura', 'Suspended return', 3, 'Efecto circular.', 'No cadencial.');

-- Progresion 10: I-bIII-IV-bVI
INSERT OR IGNORE INTO progression_degrees VALUES
(NULL, 10, 1, 'I', 'major triad', 'root', 1, '1', 'Se desplaza por mezcla modal', 'Stable but exposed', 'Clear but ironic', 5, 'Centro de referencia tonal.', 'Inicio tonal.'),
(NULL, 10, 2, 'bIII', 'major triad', 'root', 6, 'b3', 'Conduce a IV o color intermedio', 'Mezcla modal / color', 'Brightly altered', 3, 'Debe oírse como desviación expresiva consciente.', 'Color modal importante.'),
(NULL, 10, 3, 'IV', 'major triad', 'root', 2, '4', 'Puede ir a bVI o a dominante omitida', 'Predominante abierta', 'Firm but nontraditional', 3, 'Función parcialmente tradicional.', 'Bisagra.'),
(NULL, 10, 4, 'bVI', 'major triad', 'root', 6, 'b6', 'Queda abierto o retorna por nueva lógica', 'Color terminal', 'Noble, displaced', 2, 'Final abierto con mezcla modal.', 'Cierre no clásico.');

-- =========================================================
-- REALIZACIONES CONCRETAS
-- =========================================================

INSERT OR IGNORE INTO progression_realizations
(id, progression_id, key_id, root_note, chord_sequence_absolute, bass_sequence, midi_export_ref, audio_demo_ref, notation_ref, notes)
VALUES
(1, 1, 1, 'C', 'C - F - G - C', 'C - F - G - C', NULL, NULL, NULL, 'Realización básica en Do mayor.'),
(2, 1, 10, 'Eb', 'Eb - Ab - Bb - Eb', 'Eb - Ab - Bb - Eb', NULL, NULL, NULL, 'Realización en Mi bemol mayor.'),
(3, 2, 1, 'C', 'C - Am - Dm - G - C', 'C - A - D - G - C', NULL, NULL, NULL, 'Cierre expandido clásico.'),
(4, 3, 1, 'C', 'C - G/B - C/G - G7 - C', 'C - B - G - G - C', NULL, NULL, NULL, 'Cadencia rossiniana simplificada en Do mayor.'),
(5, 4, 12, 'F', 'F - Am - Bb - Gm/Bb - C - F', 'F - A - Bb - Bb - C - F', NULL, NULL, NULL, 'Versión lírica en Fa mayor.'),
(6, 5, 19, 'D', 'Dm - Gm - A - Dm', 'D - G - A - D', NULL, NULL, NULL, 'Modelo menor teatral.'),
(7, 6, 20, 'G', 'Gm - Eb - Cm - D - Gm', 'G - Eb - C - D - G', NULL, NULL, NULL, 'Gesto dramático en Sol menor.'),
(8, 7, 19, 'D', 'Dm - Gm/Bb - Eb/G - A - Dm', 'D - Bb - G - A - D', NULL, NULL, NULL, 'Uso de napolitana reinterpretada en Re menor.'),
(9, 8, 10, 'Eb', 'Eb - Cm - Ab - Bb - Eb', 'Eb - C - Ab - Bb - Eb', NULL, NULL, NULL, 'Lirismo amplio en Mi bemol mayor.'),
(10, 9, 21, 'C', 'Cm - Bb - Ab - Bb', 'C - Bb - Ab - Bb', NULL, NULL, NULL, 'Bucle modal-colorista.'),
(11, 10, 1, 'C', 'C - Eb - F - Ab', 'C - Eb - F - Ab', NULL, NULL, NULL, 'Gesto de mezcla modal en Do.');

-- =========================================================
-- ETIQUETAS DE PROGRESIONES
-- =========================================================

INSERT OR IGNORE INTO progression_tags (progression_id, tag_id) VALUES
(1, 9),
(1, 1),
(2, 9),
(3, 2),
(3, 10),
(3, 1),
(4, 2),
(4, 3),
(5, 2),
(5, 10),
(6, 8),
(6, 10),
(7, 4),
(7, 8),
(8, 8),
(8, 3),
(9, 6),
(10, 7);

-- =========================================================
-- OBRAS DE EJEMPLO
-- =========================================================

INSERT OR IGNORE INTO works
(id, composer_id, title, catalogue_reference, year_composed, genre, notes)
VALUES
(1, 1, 'Le nozze di Figaro', 'K. 492', 1786, 'Opera', 'Referencia clásica general.'),
(2, 2, 'Piano Sonata No. 8', 'Op. 13', 1798, 'Piano Sonata', 'Referencia para expansión y dirección clásica.'),
(3, 3, 'Il barbiere di Siviglia', NULL, 1816, 'Opera', 'Referencia de lenguaje rossiniano.'),
(4, 4, 'Norma', NULL, 1831, 'Opera', 'Referencia belcantista lírica.'),
(5, 5, 'Lucia di Lammermoor', NULL, 1835, 'Opera', 'Referencia dramática belcantista.'),
(6, 6, 'La traviata', NULL, 1853, 'Opera', 'Referencia de dramatización tonal.'),
(7, 7, 'Nocturnes', NULL, NULL, 'Piano', 'Referencia para cromatismo expresivo.'),
(8, 10, 'Eugene Onegin', NULL, 1879, 'Opera', 'Referencia lírica romántica.'),
(9, 12, 'Préludes', NULL, NULL, 'Piano', 'Referencia colorista.'),
(10, 13, 'Mélodies', NULL, NULL, 'Song / Vocal', 'Referencia para mezcla modal y lenguaje flexible.');

INSERT OR IGNORE INTO progression_work_examples
(progression_id, work_id, section_label, measure_start, measure_end, commentary)
VALUES
(1, 1, 'Cadential closing type', NULL, NULL, 'Ejemplo de cierre clásico general.'),
(2, 2, 'Expanded cadence type', NULL, NULL, 'Expansión funcional frecuente en Beethoven.'),
(3, 3, 'Rossinian cadence type', NULL, NULL, 'Cadencia teatral brillante de tipo rossiniano.'),
(4, 4, 'Cantabile phrase support', NULL, NULL, 'Soporte para línea vocal amplia.'),
(5, 5, 'Minor dramatic turn', NULL, NULL, 'Modelo menor breve y directo.'),
(6, 6, 'Dramatic operatic gesture', NULL, NULL, 'Impulso verdiano de alta direccionalidad.'),
(7, 7, 'Chromatic predominant usage', NULL, NULL, 'Uso expresivo de napolitana.'),
(8, 8, 'Broad lyric theme support', NULL, NULL, 'Modelo de expansión melódica romántica.'),
(9, 9, 'Modal color cycle', NULL, NULL, 'Ciclo colorista no teleológico.'),
(10, 10, 'Mixed-mode harmonic gesture', NULL, NULL, 'Mezcla modal característica.');

-- =========================================================
-- INDICES UTILES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_progressions_composer ON progressions(composer_id);
CREATE INDEX IF NOT EXISTS idx_progressions_mode ON progressions(mode);
CREATE INDEX IF NOT EXISTS idx_progressions_canonical_roman ON progressions(canonical_roman);
CREATE INDEX IF NOT EXISTS idx_progression_degrees_progression ON progression_degrees(progression_id);
CREATE INDEX IF NOT EXISTS idx_progression_realizations_progression ON progression_realizations(progression_id);
CREATE INDEX IF NOT EXISTS idx_progression_realizations_key ON progression_realizations(key_id);

-- =========================================================
-- CONSULTAS UTILES
-- =========================================================

-- 1. Ver todas las progresiones con compositor
-- SELECT p.id, c.full_name AS composer, p.name, p.canonical_roman, p.mode
-- FROM progressions p
-- JOIN composers c ON c.id = p.composer_id
-- ORDER BY c.full_name, p.name;

-- 2. Buscar progresiones de Rossini
-- SELECT p.id, p.name, p.canonical_roman
-- FROM progressions p
-- JOIN composers c ON c.id = p.composer_id
-- WHERE c.full_name = 'Gioachino Rossini';

-- 3. Ver grados de una progresion
-- SELECT
--     pd.degree_order,
--     pd.roman_numeral,
--     hf.name AS harmonic_function,
--     pd.degree_role,
--     pd.expected_resolution,
--     pd.comments
-- FROM progression_degrees pd
-- LEFT JOIN harmonic_functions hf ON hf.id = pd.harmonic_function_id
-- WHERE pd.progression_id = 3
-- ORDER BY pd.degree_order;

-- 4. Ver realizaciones concretas de una progresion
-- SELECT
--     pr.id,
--     k.display_name,
--     pr.chord_sequence_absolute
-- FROM progression_realizations pr
-- JOIN keys k ON k.id = pr.key_id
-- WHERE pr.progression_id = 3;

-- 5. Buscar progresiones por patron romano exacto
-- SELECT p.id, p.name, c.full_name
-- FROM progressions p
-- JOIN composers c ON c.id = p.composer_id
-- WHERE p.canonical_roman = 'I-IV-V-I';

-- 6. Buscar progresiones que usen N6
-- SELECT DISTINCT p.id, p.name, c.full_name
-- FROM progressions p
-- JOIN composers c ON c.id = p.composer_id
-- JOIN progression_degrees pd ON pd.progression_id = p.id
-- WHERE pd.roman_numeral = 'N6';