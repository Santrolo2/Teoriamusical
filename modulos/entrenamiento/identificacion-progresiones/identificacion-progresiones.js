/**
 * identificacion-progresiones.js
 * Flujo didactico en dos etapas:
 * 1) Identificar familia funcional
 * 2) Identificar progresion exacta
 */
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const FORMACIONES = {
        piano: {
            nombre: "Piano (Grand Staff)",
            tipo: "piano",
            render: "grandstaff"
        },
        voces: {
            nombre: "Voces (SATB)",
            tipo: "choir",
            render: "score",
            staves: [
                { id: "S", clef: "treble", range: [60, 84], inst: "soprano" },
                { id: "A", clef: "treble", range: [53, 77], inst: "soprano" },
                { id: "T", clef: "treble", range: [48, 72], inst: "choir", displayOctaveOffset: 1 },
                { id: "B", clef: "bass", range: [40, 64], inst: "choir" }
            ]
        },
        cuarteto: {
            nombre: "Cuarteto de Cuerdas",
            tipo: "strings",
            render: "score",
            staves: [
                { id: "v1", clef: "treble", range: [55, 96], inst: "violin" },
                { id: "v2", clef: "treble", range: [55, 84], inst: "violin" },
                { id: "vla", clef: "alto", range: [48, 79], inst: "viola" },
                { id: "vlc", clef: "bass", range: [36, 64], inst: "cello" }
            ]
        }
    };

    const state = {
        modo: "manual",
        flujoPaso: "intencion", // intencion -> config -> practica
        seccion: "identificacion",
        formacion: "piano",
        manual: {
            tonalidad: "C",
            tonalidadId: null,
            modoEscala: "major",
            raizObjetivo: "C",
            nivel: 1,
            familia: "todas",
            fuente: "catalogo",
            longitud: 4,
            color: "diatonico"
        },
        diccionario: {
            compositor: "todos",
            composerId: null,
            romanPattern: "",
            levelFilter: "",
            hasAudio: false,
            hasNotation: false,
            coreOnly: false,
            hasExamples: false,
            resultados: [],
            entradaActiva: null,
            cargando: false,
            ultimoError: "",
            seleccionRoman: ""
        },
        api: {
            disponible: false,
            error: "",
            composers: [],
            keys: [],
            keysByMode: {
                major: [],
                minor: []
            }
        },
        builder: {
            tokens: ["I", "IV", "V", "I"],
            sugerencias: [],
            mensaje: ""
        },
        ejercicioActual: null,
        etapaActual: "familia",
        opcionesFamilia: [],
        opcionesProgresion: [],
        stats: {
            total: 0,
            correctas: 0
        },
        ultimaEvaluacion: null,
        revealActivo: false,
        audioActivo: false
    };

    const els = {
        landingScreen: document.getElementById("landingScreen"),
        mainInterface: document.getElementById("mainInterface"),
        backToLandingBtn: document.getElementById("backToLandingBtn"),
        playBtn: document.getElementById("playBtn"),
        hintBtn: document.getElementById("hintBtn"),
        nextBtn: document.getElementById("nextBtn"),
        skipBtn: document.getElementById("skipBtn"),
        feedback: document.getElementById("feedback"),
        hintBox: document.getElementById("hintBox"),
        optionsContainer: document.getElementById("optionsContainer"),
        modeToggle: document.getElementById("modeToggle"),
        modeLabel: document.getElementById("modeLabel"),
        modeHint: document.getElementById("modeHint"),
        modeControlsHost: document.getElementById("modeControlsHost"),
        uxCardGenerador: document.getElementById("uxCardGenerador"),
        uxCardIdentificar: document.getElementById("uxCardIdentificar"),
        uxStatusTitle: document.getElementById("uxStatusTitle"),
        uxStatusAction: document.getElementById("uxStatusAction"),
        uxStatusScope: document.getElementById("uxStatusScope"),
        uxStatusAudio: document.getElementById("uxStatusAudio"),
        chordName: document.getElementById("chordName"),
        chordType: document.getElementById("chordType"),
        optionsTitle: document.getElementById("optionsTitle"),
        exerciseContext: document.getElementById("exerciseContext"),
        composerContext: document.getElementById("composerContext"),
        analysisPanel: document.getElementById("analysisPanel"),
        didacticRoutePanel: document.getElementById("didacticRoutePanel"),
        degreesPanel: document.getElementById("degreesPanel"),
        sessionModeBadge: document.getElementById("sessionModeBadge"),
        statsSummary: document.getElementById("statsSummary"),
        progressFill: document.getElementById("progressFill"),
        maestroBtn: document.getElementById("maestroBtn"),
        maestroPanel: document.getElementById("maestroPanel"),
        maestroContent: document.getElementById("maestroContent"),
        maestroLoading: document.getElementById("maestroLoading"),
        maestroError: document.getElementById("maestroError"),
        maestroClose: document.getElementById("maestroClose"),
        maestroPregunta: document.getElementById("maestroPregunta"),
        maestroAskBtn: document.getElementById("maestroAskBtn"),
        pianoVol: document.getElementById("pianoVol"),
        choirVol: document.getElementById("choirVol"),
        stringsVol: document.getElementById("stringsVol")
    };

    function elegir(lista) {
        return lista[Math.floor(Math.random() * lista.length)];
    }

    function abrirModulo(seccionObjetivo) {
        state.seccion = seccionObjetivo === "generador" ? "generador" : "identificacion";
        if (state.seccion === "generador") {
            state.diccionario.compositor = "todos";
            state.diccionario.composerId = null;
        }
        state.flujoPaso = "config";
        if (els.landingScreen) els.landingScreen.classList.add("hidden");
        if (els.mainInterface) els.mainInterface.classList.remove("hidden");
        state.diccionario.entradaActiva = null;
        renderAnalisisPanel(null);
        renderGradosPanel(null);
        renderObrasPanel(null);
        renderRutaDidactica(null);
        renderControlesModo();
        if (!state.api.disponible) {
            void cargarCatalogoApiInicial().then(() => {
                if (state.flujoPaso === "config") {
                    renderControlesModo();
                }
            });
        }
    }

    function volverAOpciones() {
        state.flujoPaso = "intencion";
        if (els.mainInterface) els.mainInterface.classList.add("hidden");
        if (els.landingScreen) els.landingScreen.classList.remove("hidden");
        state.diccionario.entradaActiva = null;
    }

    const OBRAS_POR_COMPOSITOR = {
        "johann-sebastian-bach": ["Coral BWV 147", "Preludio en Do mayor BWV 846", "Invención No. 1 BWV 772"],
        "wolfgang-amadeus-mozart": ["Sonata K. 545", "Sinfonía No. 40", "Requiem KV 626"],
        "ludwig-van-beethoven": ["Sonata Patética Op. 13", "Sonata Claro de Luna Op. 27 No. 2", "Sinfonía No. 5"],
        "franz-schubert": ["Ave Maria D. 839", "Impromptu Op. 90 No. 2", "Serenade D. 957"],
        "frederic-chopin": ["Nocturno Op. 9 No. 2", "Preludio Op. 28 No. 4", "Vals Op. 64 No. 2"],
        "claude-debussy": ["Clair de Lune", "Arabesque No. 1", "La fille aux cheveux de lin"],
        "maurice-ravel": ["Pavane pour une infante defunte", "Jeux d'eau", "Le tombeau de Couperin"],
        "giuseppe-verdi": ["La Traviata", "Rigoletto", "Aida"],
        "johann-pachelbel": ["Canon en Re", "Magnificat Fugues", "Chaconne en Fa menor"]
    };

    const API_BASE_URL = (() => {
        if (typeof window !== "undefined" && window.MAESTRO_IA_URL) {
            return String(window.MAESTRO_IA_URL).replace(/\/$/, "");
        }
        if (typeof window !== "undefined" && window.LLMMaestro?.getBaseUrl) {
            return String(window.LLMMaestro.getBaseUrl()).replace(/\/$/, "");
        }
        return "http://localhost:3001";
    })();

    function slugDesdeNombre(nombre = "") {
        return String(nombre)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    async function fetchApi(path, params = null) {
        const url = new URL(`${API_BASE_URL}${path}`);
        if (params && typeof params === "object") {
            Object.entries(params).forEach(([k, v]) => {
                if (v == null || v === "") return;
                url.searchParams.set(k, String(v));
            });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        try {
            const res = await fetch(url.toString(), {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || json?.ok === false) {
                throw new Error(json?.error || json?.mensaje || `Error ${res.status}`);
            }
            return json?.data ?? json;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    function sincronizarTonalidadConModo() {
        const mode = state.manual.modoEscala === "minor" ? "minor" : "major";
        const lista = state.api.keysByMode[mode] || [];
        if (!lista.length) return;

        const actual = lista.find((k) => k.id === state.manual.tonalidadId) || null;
        if (actual) {
            state.manual.tonalidad = actual.tonic;
            return;
        }

        const primera = lista[0];
        state.manual.tonalidadId = primera.id;
        state.manual.tonalidad = primera.tonic;
    }

    async function cargarCatalogoApiInicial() {
        try {
            const [composers, keys] = await Promise.all([
                fetchApi("/api/composers"),
                fetchApi("/api/keys")
            ]);

            state.api.disponible = true;
            state.api.error = "";
            state.api.composers = Array.isArray(composers) ? composers : [];
            state.api.keys = Array.isArray(keys) ? keys : [];
            state.api.keysByMode.major = state.api.keys.filter((k) => k.mode === "major");
            state.api.keysByMode.minor = state.api.keys.filter((k) => k.mode === "minor");

            if (!state.manual.tonalidadId) {
                sincronizarTonalidadConModo();
            }
            return true;
        } catch (error) {
            state.api.disponible = false;
            state.api.error = error?.message || "No se pudo cargar el catalogo SQLite.";
            return false;
        }
    }

    function normalizarRomanComparacion(roman = "") {
        return String(roman)
            .replace(/♭/g, "b")
            .replace(/♯/g, "#")
            .replace(/°/g, "o")
            .replace(/Â°/g, "o")
            .replace(/–|—/g, "-")
            .replace(/\s+/g, "")
            .toLowerCase();
    }

    function formatearNombreCompositor(slug = "") {
        if (!slug) return "";
        if (String(slug).includes(" ")) {
            return String(slug).trim();
        }
        return String(slug)
            .split("-")
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join(" ");
    }

    function compositoresParaProgresion(roman = "") {
        const canon = normalizarRomanComparacion(roman);
        const mapa = window.PROGRESIONES_DATA?.compositores || {};
        const encontrados = [];
        Object.entries(mapa).forEach(([comp, lista]) => {
            if (!Array.isArray(lista)) return;
            const match = lista.some((r) => normalizarRomanComparacion(r) === canon);
            if (match) encontrados.push(comp);
        });
        return encontrados.slice(0, 4);
    }

    function renderCompositoresRelacionados(roman = "") {
        if (!els.composerContext) return;
        const comps = compositoresParaProgresion(roman);
        if (!comps.length) {
            els.composerContext.innerHTML = "No hay coincidencia exacta en la base histórica para esta progresión, pero puedes usarla como patrón moderno.";
            return;
        }
        els.composerContext.innerHTML = comps.map((slug) => {
            const obras = OBRAS_POR_COMPOSITOR[slug] || ["Obra representativa del periodo", "Suite o sonata con uso funcional similar"];
            return `
                <div class="composer-card">
                    <strong>${formatearNombreCompositor(slug)}</strong>
                    <div class="composer-works">${obras.slice(0, 3).join(" · ")}</div>
                </div>
            `;
        }).join("");
    }

    function sentidoDeProgresion(roman = "") {
        const r = normalizarRomanComparacion(roman);
        if (r.includes("v/v") || r.includes("bii6") || r.includes("viio/v")) {
            return "Tensión dirigida y preparación cadencial.";
        }
        if (r.includes("ii-v-i")) {
            return "Cadencia funcional clara (predominante-dominante-tónica).";
        }
        if (r.includes("i-vi-ii-v") || r.includes("iii-vi-ii-v")) {
            return "Movimiento cíclico por quintas.";
        }
        if (r.includes("i-v-vi-iv") || r.includes("vi-iv-i-v")) {
            return "Patrón estable de canción y continuidad melódica.";
        }
        return "Estabilidad tonal con dirección de tensión y resolución.";
    }

    function normalizarNotaClase(nota = "") {
        const s = String(nota).trim().replace(/♭/g, "b").replace(/♯/g, "#");
        const m = s.match(/^([A-Ga-g])(bb|b|##|#)?/);
        if (!m) return "";
        return `${m[1].toUpperCase()}${m[2] || ""}`;
    }

    function convertirProgresionATonalidad(roman = "", tonalidad = "C", modoEscala = "major") {
        try {
            const mode = modoEscala === "minor" ? "minor" : "major";
            const acordes = window.ARMONIA?.resolverProgresion?.(
                normalizarRomanParaMotor(roman),
                tonalidad,
                mode
            ) || [];
            if (!acordes.length) {
                return { chordSequence: "", bassSequence: "", ok: false };
            }
            const chordSequence = acordes.map((a) => a.nombre || a.raiz || "").filter(Boolean).join(" - ");
            const bassSequence = acordes
                .map((a) => String(a.bajo || "").replace(/\d+/g, ""))
                .filter(Boolean)
                .join(" - ");
            return { chordSequence, bassSequence, ok: Boolean(chordSequence) };
        } catch (_) {
            return { chordSequence: "", bassSequence: "", ok: false };
        }
    }

    function compositoresDeRoman(roman = "") {
        const canon = normalizarRomanComparacion(roman);
        const mapa = window.PROGRESIONES_DATA?.compositores || {};
        const found = [];
        Object.entries(mapa).forEach(([slug, lista]) => {
            if (!Array.isArray(lista)) return;
            if (lista.some((r) => normalizarRomanComparacion(r) === canon)) found.push(slug);
        });
        return found;
    }

    function construirDiccionarioFallbackLocal() {
        const mapa = window.PROGRESIONES_DATA?.compositores || {};
        const base = window.PROGRESIONES_DATA?.basicas || [];
        const set = new Set();
        const entries = [];

        base.forEach((b) => {
            const roman = b.searchId || b.nombre || "";
            const key = normalizarRomanComparacion(roman);
            if (!key || set.has(key)) return;
            set.add(key);
            entries.push(roman);
        });

        if (state.diccionario.compositor === "todos") {
            Object.values(mapa).forEach((lista) => {
                if (!Array.isArray(lista)) return;
                lista.forEach((roman) => {
                    const key = normalizarRomanComparacion(roman);
                    if (!key || set.has(key)) return;
                    set.add(key);
                    entries.push(roman);
                });
            });
        } else {
            (mapa[state.diccionario.compositor] || []).forEach((roman) => {
                const key = normalizarRomanComparacion(roman);
                if (!key || set.has(key)) return;
                set.add(key);
                entries.push(roman);
            });
        }

        const mapeadas = entries.slice(0, 120).map((roman, index) => {
            const comps = compositoresDeRoman(roman);
            const compositores = state.diccionario.compositor === "todos"
                ? comps.slice(0, 3)
                : [state.diccionario.compositor];
            const conversion = convertirProgresionATonalidad(
                roman,
                state.manual.tonalidad,
                state.manual.modoEscala
            );
            return {
                id: `local_${index}_${normalizarRomanComparacion(roman)}`,
                roman,
                name: roman,
                mode: state.manual.modoEscala,
                difficulty_level: state.manual.nivel,
                description: "",
                cadence_type: "",
                tension_profile: "",
                expressive_character: "",
                usage_context: "",
                composer_name: compositores.map(formatearNombreCompositor).join(" · "),
                compositores,
                obras: compositores.flatMap((slug) => (OBRAS_POR_COMPOSITOR[slug] || [])).slice(0, 4),
                sentido: sentidoDeProgresion(roman),
                works: [],
                degrees: [],
                realizations: [],
                learning_level: state.manual.nivel,
                has_audio: 0,
                has_notation: 0,
                is_core: 0,
                variant_count: 0,
                converted_chords: conversion.chordSequence,
                converted_bass: conversion.bassSequence,
                conversion_ok: Number(conversion.ok),
                source: "local"
            };
        });
        state.diccionario.resultados = mapeadas.slice(0, 60);
    }

    async function construirDiccionario() {
        state.diccionario.cargando = true;
        state.diccionario.ultimoError = "";
        state.diccionario.entradaActiva = null;
        try {
            if (!state.api.disponible) {
                throw new Error(state.api.error || "API SQLite no disponible.");
            }

            const filtros = {
                composer: state.diccionario.composerId || "",
                roman_pattern: state.diccionario.romanPattern || "",
                level: state.diccionario.levelFilter || "",
                has_audio: state.diccionario.hasAudio ? 1 : "",
                has_notation: state.diccionario.hasNotation ? 1 : "",
                core_only: state.diccionario.coreOnly ? 1 : "",
                has_examples: state.diccionario.hasExamples ? 1 : ""
            };
            const rows = await fetchApi("/api/progressions", filtros);
            const lista = Array.isArray(rows) ? rows : [];

            const mapeadas = lista.map((row) => {
                    const conversion = convertirProgresionATonalidad(
                        row.canonical_roman,
                        state.manual.tonalidad,
                        state.manual.modoEscala
                    );
                    return {
                    ...row,
                    roman: row.canonical_roman,
                    source: "api",
                    compositores: [slugDesdeNombre(row.composer_name)],
                    sentido: row.expressive_character || sentidoDeProgresion(row.canonical_roman),
                    obras: [],
                    works: [],
                    degrees: [],
                    realizations: [],
                    learning_level: row.learning_level ?? row.difficulty_level ?? state.manual.nivel,
                    has_audio: Number(row.has_audio || 0),
                    has_notation: Number(row.has_notation || 0),
                    is_core: Number(row.is_core || 0),
                    variant_count: Number(row.variant_count || 0),
                    used_keys: Number(row.used_keys || 0),
                    total_keys_in_mode: Number(row.total_keys_in_mode || 0),
                    pedagogy_objective: row.pedagogy_objective || "",
                    hearing_focus: row.hearing_focus || "",
                    voice_leading_focus: row.voice_leading_focus || "",
                    converted_chords: conversion.chordSequence,
                    converted_bass: conversion.bassSequence,
                    conversion_ok: Number(conversion.ok)
                };
            });
            state.diccionario.resultados = mapeadas;

            if (!state.diccionario.resultados.length) {
                state.diccionario.ultimoError = "No hay coincidencias con esos filtros.";
            }
        } catch (_) {
            construirDiccionarioFallbackLocal();
            if (!state.diccionario.resultados.length) {
                state.diccionario.ultimoError = "Sin resultados disponibles.";
            }
        } finally {
            state.diccionario.cargando = false;
        }
    }

    function cargarEntradaDiccionarioLegacy(entry) {
        try {
            state.ejercicioActual = GeneradorProgresiones.construirDesdeRoman({
                tonalidad: state.manual.tonalidad,
                roman: entry.roman,
                familia: "mixta",
                nivel: state.manual.nivel,
                fuente: "diccionario",
                nombre: entry.roman
            });
            state.revealActivo = true;
            state.diccionario.seleccionRoman = entry.roman;
            renderPartitura();
            renderInfo();
            renderOpciones();
            if (els.composerContext) {
                const compTxt = entry.compositores.map(formatearNombreCompositor).join(" · ") || "Referencia general";
                const obrasTxt = entry.obras.join(" · ") || "Sin obras específicas cargadas";
                els.composerContext.innerHTML = `
                    <div class="composer-card">
                        <strong>${compTxt}</strong>
                        <div class="composer-works">${obrasTxt}</div>
                        <div class="composer-works">${entry.sentido}</div>
                    </div>
                `;
            }
        } catch (e) {
            if (els.feedback) {
                els.feedback.textContent = `No se pudo cargar la progresión: ${e.message || "revisa filtros."}`;
                els.feedback.className = "feedback show incorrect";
            }
        }
    }

    function avanzarDiccionarioLegacy(aleatorio = false) {
        if (!state.diccionario.resultados.length) return;
        const lista = state.diccionario.resultados;
        const actual = lista.findIndex((e) => e.roman === state.diccionario.seleccionRoman);
        let idx = 0;
        if (aleatorio) {
            idx = Math.floor(Math.random() * lista.length);
            if (lista.length > 1 && idx === actual) idx = (idx + 1) % lista.length;
        } else {
            idx = actual < 0 ? 0 : (actual + 1) % lista.length;
        }
        cargarEntradaDiccionarioLegacy(lista[idx]);
    }

    function crearBoton(value, label, activo, extraClass = "") {
        const btn = document.createElement("button");
        btn.className = `${extraClass} ${activo ? "active" : ""}`.trim();
        btn.textContent = label;
        btn.dataset.value = String(value);
        return btn;
    }

    function nombreFamilia(familiaId) {
        const mapa = {
            todas: "Todas",
            cadencia: "Cadencia",
            "predominante-dominante": "Predominante-Dominante",
            ciclo: "Ciclo",
            pop: "Pop",
            mixta: "Mixta"
        };
        return mapa[familiaId] || familiaId;
    }

    function tokensDisponiblesNivel(nivel = 1) {
        const map = window.GeneradorProgresiones?.TOKENS_POR_NIVEL || { 1: ["I", "ii", "iii", "IV", "V", "vi", "vii°"] };
        return map[Math.max(1, Math.min(3, Number(nivel) || 1))] || map[1];
    }

    function romanDesdeBuilder() {
        const limpios = (state.builder.tokens || []).map((t) => String(t).trim()).filter(Boolean);
        return limpios.join(" - ");
    }

    function actualizarSugerenciasBuilder() {
        if (!window.GeneradorProgresiones?.generarEspacioProgresiones) return;
        const familia = state.manual.familia === "todas" ? "mixta" : state.manual.familia;
        state.builder.sugerencias = window.GeneradorProgresiones.generarEspacioProgresiones({
            nivel: state.manual.nivel,
            longitud: state.manual.longitud,
            familia,
            max: 8
        });
    }

    function normalizarRomanParaMotor(roman = "") {
        return String(roman)
            .replace(/N6/gi, "bII6")
            .replace(/([ivIV]+)6\/4/g, "$164")
            .replace(/♭/g, "b")
            .replace(/♯/g, "#")
            .replace(/–|—/g, "-")
            .replace(/\s*-\s*/g, " - ")
            .trim();
    }

    function renderAnalisisPanel(entry = null) {
        if (!els.analysisPanel) return;
        if (!entry) {
            els.analysisPanel.className = "panel-empty";
            els.analysisPanel.textContent = "Selecciona una progresion para ver su analisis.";
            return;
        }

        const detalle = entry.detail || entry;
        const pedagogy = detalle.pedagogy || null;
        const level = pedagogy?.level ?? detalle.learning_level ?? detalle.difficulty_level ?? "N/D";
        const objective = pedagogy?.objective || detalle.pedagogy_objective || "No especificado";
        const hearing = pedagogy?.hearing_focus || detalle.hearing_focus || "No especificado";
        const voiceLeading = pedagogy?.voice_leading_focus || detalle.voice_leading_focus || "No especificado";
        const coverageTxt = (Number(detalle.total_keys_in_mode || 0) > 0)
            ? `${detalle.used_keys || 0}/${detalle.total_keys_in_mode}`
            : "N/D";
        const mediaTxt = [
            Number(detalle.has_audio || 0) ? "Audio" : "Sin audio",
            Number(detalle.has_notation || 0) ? "Partitura" : "Sin partitura"
        ].join(" · ");
        const conversion = entry.converted_chords
            || state.ejercicioActual?.conversionAbsoluta
            || convertirProgresionATonalidad(
                entry.roman || detalle.canonical_roman || "",
                state.manual.tonalidad,
                entry.mode || detalle.mode || state.manual.modoEscala
            ).chordSequence
            || "No disponible";
        const conversionBass = entry.converted_bass
            || state.ejercicioActual?.conversionBajo
            || convertirProgresionATonalidad(
                entry.roman || detalle.canonical_roman || "",
                state.manual.tonalidad,
                entry.mode || detalle.mode || state.manual.modoEscala
            ).bassSequence
            || "No disponible";
        const bloques = [
            { label: "Patron romano", value: entry.roman || detalle.canonical_roman || "N/D" },
            { label: `Conversion en ${state.manual.tonalidad} ${state.manual.modoEscala === "minor" ? "minor" : "major"}`, value: conversion },
            { label: "Bajo convertido", value: conversionBass },
            { label: "Nivel", value: level },
            { label: "Cobertura tonal", value: coverageTxt },
            { label: "Recursos", value: mediaTxt },
            { label: "Cadencia", value: detalle.cadence_type || "No especificada" },
            { label: "Tension", value: detalle.tension_profile || "No especificada" },
            { label: "Caracter", value: detalle.expressive_character || entry.sentido || "No especificado" },
            { label: "Uso", value: detalle.usage_context || "No especificado" },
            { label: "Objetivo", value: objective },
            { label: "Foco auditivo", value: hearing },
            { label: "Foco voces", value: voiceLeading },
            { label: "Descripcion", value: detalle.description || "No especificada" }
        ];

        els.analysisPanel.className = "analysis-panel";
        els.analysisPanel.innerHTML = bloques.map((b) => (
            `<div class="analysis-item"><strong>${b.label}:</strong> ${b.value}</div>`
        )).join("");
    }

    function renderGradosPanel(entry = null) {
        if (!els.degreesPanel) return;
        const grados = Array.isArray(entry?.degrees) ? entry.degrees : [];
        if (!grados.length) {
            els.degreesPanel.className = "panel-empty";
            els.degreesPanel.textContent = "No hay grados cargados para esta progresion.";
            return;
        }

        els.degreesPanel.className = "degree-list";
        els.degreesPanel.innerHTML = grados.map((g) => `
            <div class="degree-item">
                <strong>${g.degree_order}. ${g.roman_numeral}</strong>
                <div class="degree-meta">${g.harmonic_function_name || "Funcion"} (${g.harmonic_function_code || "N/D"})</div>
                <div class="degree-meta">${g.degree_role || "Rol no definido"}</div>
            </div>
        `).join("");
    }

    function renderObrasPanel(entry = null) {
        if (!els.composerContext) return;
        if (!entry) {
            els.composerContext.textContent = "Selecciona una progresion para ver compositor y obras.";
            return;
        }

        const compNombre = entry.composer_name
            || (entry.compositores || []).map(formatearNombreCompositor).join(" · ")
            || "Referencia general";

        const works = Array.isArray(entry.works) ? entry.works : [];
        const obrasLista = works.length
            ? works.slice(0, 4).map((w) => {
                const cat = w.catalogue_reference ? ` (${w.catalogue_reference})` : "";
                const sec = w.section_label ? ` · ${w.section_label}` : "";
                return `${w.title}${cat}${sec}`;
            })
            : (entry.obras?.length ? entry.obras : ["Sin obras especificas para este filtro."]);

        const errorComun = Array.isArray(entry.common_errors) && entry.common_errors.length
            ? entry.common_errors[0]?.hint_subtle
            : "";

        els.composerContext.innerHTML = `
            <div class="composer-card">
                <strong>${compNombre}</strong>
                <div class="composer-works">${obrasLista.join(" · ")}</div>
                <div class="composer-works">${entry.sentido || sentidoDeProgresion(entry.roman || "")}</div>
                ${errorComun ? `<div class="composer-works">Pista: ${errorComun}</div>` : ""}
            </div>
        `;
    }

    function nivelDeEntrada(entry = null) {
        return Number(
            entry?.pedagogy?.level
            ?? entry?.learning_level
            ?? entry?.difficulty_level
            ?? 1
        ) || 1;
    }

    function resumenRutaEntrada(entry = null) {
        if (!entry) return "<strong>Sin seleccion</strong>";
        const roman = entry.roman || entry.canonical_roman || entry.name || "N/D";
        const comp = entry.composer_name
            || (entry.compositores?.length ? entry.compositores.map(formatearNombreCompositor).join(" · ") : "Referencia");
        return `<strong>${roman}</strong><br><small>${comp} · N${nivelDeEntrada(entry)}</small>`;
    }

    function renderRutaDidactica(entry = null) {
        if (!els.didacticRoutePanel) return;

        const desbloqueo = obtenerDesbloqueoIdentificacion();
        if (state.seccion !== "generador") {
            const perfil = window.PerfilUsuario?.obtenerEstadisticas?.() || {};
            const progresoPatron = perfil.progresoProgresiones?.patron || {};
            const precision = Number(progresoPatron.precision || 0);
            const intentos = Number(progresoPatron.total || 0);
            const nivelManual = Number(state.manual.nivel || 1);

            let siguienteObjetivo = "Ruta completa desbloqueada.";
            if (desbloqueo.nivelMaximo <= 1) {
                siguienteObjetivo = "Desbloquea N2 con 75% de precision y 12 intentos.";
            } else if (desbloqueo.nivelMaximo === 2) {
                siguienteObjetivo = "Desbloquea N3 con 82% de precision y 30 intentos.";
            }

            const levelsHtml = [1, 2, 3, 4, 5].map((n) => {
                const active = n === nivelManual ? "active" : "";
                const locked = n > desbloqueo.nivelMaximo ? "locked" : "";
                return `<div class="route-level ${active} ${locked}">N${n}</div>`;
            }).join("");

            els.didacticRoutePanel.className = "route-panel";
            els.didacticRoutePanel.innerHTML = `
                <div class="route-head">Ruta activa para identificacion</div>
                <div class="route-levels">${levelsHtml}</div>
                <div class="route-step"><strong>Familias activas:</strong> ${desbloqueo.familias.map(nombreFamilia).join(" · ")}</div>
                <div class="route-step"><strong>Progreso:</strong> ${precision}% · ${intentos} intentos</div>
                <div class="route-step"><strong>Siguiente meta:</strong> ${siguienteObjetivo}</div>
            `;
            return;
        }

        const lista = Array.isArray(state.diccionario.resultados) ? state.diccionario.resultados : [];
        if (!lista.length) {
            els.didacticRoutePanel.className = "panel-empty";
            els.didacticRoutePanel.textContent = "Aplica filtros y abre una progresion para construir la ruta.";
            return;
        }

        const activa = entry || state.diccionario.entradaActiva || lista[0];
        const nivelActivo = nivelDeEntrada(activa);
        const ordenadas = [...lista].sort((a, b) => {
            const nivelDiff = nivelDeEntrada(a) - nivelDeEntrada(b);
            if (nivelDiff !== 0) return nivelDiff;
            const coreDiff = Number(b.is_core || 0) - Number(a.is_core || 0);
            if (coreDiff !== 0) return coreDiff;
            const varDiff = Number(b.variant_count || 0) - Number(a.variant_count || 0);
            if (varDiff !== 0) return varDiff;
            return String(a.roman || "").localeCompare(String(b.roman || ""));
        });

        const previo = [...ordenadas].reverse().find((e) => nivelDeEntrada(e) < nivelActivo) || null;
        const paralelo = ordenadas.find((e) => String(e.id) !== String(activa.id) && nivelDeEntrada(e) === nivelActivo) || null;
        const siguiente = ordenadas.find((e) => nivelDeEntrada(e) > nivelActivo) || null;
        const levelsHtml = [1, 2, 3, 4, 5].map((n) => {
            const active = n === nivelActivo ? "active" : "";
            const locked = n > desbloqueo.nivelMaximo ? "locked" : "";
            return `<div class="route-level ${active} ${locked}">N${n}</div>`;
        }).join("");
        const obrasCount = Array.isArray(activa.works) ? activa.works.length : Number(activa.example_count || 0);
        const varCount = Number(activa.variant_count || 0);

        els.didacticRoutePanel.className = "route-panel";
        els.didacticRoutePanel.innerHTML = `
            <div class="route-head">Ruta sugerida para diccionario</div>
            <div class="route-levels">${levelsHtml}</div>
            <div class="route-step"><strong>Ahora:</strong><br>${resumenRutaEntrada(activa)}</div>
            <div class="route-step"><strong>Antes:</strong><br>${previo ? resumenRutaEntrada(previo) : "<small>No hay nivel previo con estos filtros.</small>"}</div>
            <div class="route-step"><strong>Refuerzo:</strong><br>${paralelo ? resumenRutaEntrada(paralelo) : "<small>No hay variante paralela en este nivel.</small>"}</div>
            <div class="route-step"><strong>Luego:</strong><br>${siguiente ? resumenRutaEntrada(siguiente) : "<small>No hay nivel superior en este filtro.</small>"}</div>
            <div class="route-step"><strong>Cobertura activa:</strong> ${obrasCount} obras · ${varCount} variantes</div>
        `;
    }

    function construirEjercicioDesdeEntrada(entry) {
        const romanOriginal = entry.roman || "";
        const romanMotor = normalizarRomanParaMotor(romanOriginal);
        const modo = state.manual.modoEscala || entry.mode || "major";
        const realization = entry.selectedRealization || entry.realizations?.[0] || null;
        const tonalidad = state.manual.tonalidad || realization?.key_tonic || "C";
        const conversion = convertirProgresionATonalidad(romanOriginal, tonalidad, modo);

        let acordes = [];
        try {
            acordes = window.ARMONIA?.resolverProgresion?.(romanMotor, tonalidad, modo) || [];
        } catch (_) {
            acordes = [];
        }
        if (!acordes.length) {
            acordes = GeneradorProgresiones.construirDesdeRoman({
                tonalidad,
                roman: romanMotor,
                familia: "mixta",
                nivel: Number(entry.difficulty_level || state.manual.nivel || 1),
                fuente: "diccionario",
                nombre: entry.name || romanOriginal
            }).acordes;
        }

        const bajoLinea = acordes.map((a) => String(a.bajo || "").replace(/\d+/g, ""));

        return {
            id: `dic_${entry.id || normalizarRomanComparacion(romanOriginal)}`,
            nombre: entry.name || romanOriginal,
            tonalidad,
            acordes,
            respuestaCorrecta: `dic_${entry.id || normalizarRomanComparacion(romanOriginal)}`,
            progStr: romanOriginal,
            familia: "mixta",
            nivel: Number(entry.difficulty_level || state.manual.nivel || 1),
            fuente: "diccionario_sql",
            color: "mixto",
            raizObjetivo: "",
            bajoLinea,
            analisis: Array.isArray(entry.degrees)
                ? entry.degrees.map((g) => ({ grado: g.roman_numeral, funcion: g.harmonic_function_code || "N/D" }))
                : [],
            objetivoPedagogico: entry.description || sentidoDeProgresion(romanOriginal),
            conversionAbsoluta: conversion.chordSequence || "",
            conversionBajo: conversion.bassSequence || ""
        };
    }

    async function hidratarEntradaDiccionario(entry) {
        if (!entry || entry.source !== "api") return entry;
        if (entry.__loaded) return entry;

        const [detail, degrees] = await Promise.all([
            fetchApi(`/api/progressions/${entry.id}`),
            fetchApi(`/api/progressions/${entry.id}/degrees`)
        ]);

        let realizations = await fetchApi(`/api/progressions/${entry.id}/realizations`, {
            key: state.manual.tonalidadId || "",
            mode: state.manual.modoEscala
        });
        if (!Array.isArray(realizations) || !realizations.length) {
            realizations = await fetchApi(`/api/progressions/${entry.id}/realizations`);
        }

        entry.detail = detail;
        entry.degrees = Array.isArray(degrees) ? degrees : [];
        entry.realizations = Array.isArray(realizations) ? realizations : [];
        entry.selectedRealization = entry.realizations.find((r) => r.key_id === state.manual.tonalidadId) || entry.realizations[0] || null;
        entry.works = Array.isArray(detail?.works) ? detail.works : [];
        entry.tags = Array.isArray(detail?.tags) ? detail.tags : [];
        entry.pedagogy = detail?.pedagogy || null;
        entry.common_errors = Array.isArray(detail?.common_errors) ? detail.common_errors : [];
        entry.coverage = detail?.coverage || null;
        entry.description = detail?.description || entry.description || "";
        entry.cadence_type = detail?.cadence_type || entry.cadence_type || "";
        entry.tension_profile = detail?.tension_profile || entry.tension_profile || "";
        entry.expressive_character = detail?.expressive_character || entry.expressive_character || "";
        entry.usage_context = detail?.usage_context || entry.usage_context || "";
        entry.sentido = detail?.expressive_character || entry.sentido;
        entry.learning_level = entry.pedagogy?.level ?? entry.learning_level;
        entry.is_core = entry.pedagogy?.is_core ?? entry.is_core;
        entry.used_keys = entry.coverage?.used_keys ?? entry.used_keys;
        entry.total_keys_in_mode = entry.coverage?.total_keys_in_mode ?? entry.total_keys_in_mode;
        entry.variant_count = entry.coverage?.variant_count ?? entry.variant_count;
        entry.has_audio = entry.selectedRealization?.has_audio ?? entry.has_audio;
        entry.has_notation = entry.selectedRealization?.has_notation ?? entry.has_notation;

        if (entry.selectedRealization?.id) {
            try {
                const variants = await fetchApi(`/api/realizations/${entry.selectedRealization.id}/variants`);
                entry.variants = Array.isArray(variants) ? variants : [];
                if (entry.variants.length) {
                    entry.variant_count = entry.variants.length;
                }
            } catch (_) {
                entry.variants = [];
            }
        }

        entry.__loaded = true;
        return entry;
    }

    async function cargarEntradaDiccionario(entry) {
        if (!entry) return;
        try {
            const hidratada = await hidratarEntradaDiccionario(entry);
            state.ejercicioActual = construirEjercicioDesdeEntrada(hidratada);
            state.revealActivo = true;
            state.diccionario.seleccionRoman = hidratada.roman;
            state.diccionario.entradaActiva = hidratada;

            renderPartitura();
            renderInfo();
            renderOpciones();
            renderAnalisisPanel(hidratada);
            renderGradosPanel(hidratada);
            renderObrasPanel(hidratada);
            renderRutaDidactica(hidratada);
        } catch (e) {
            if (els.feedback) {
                els.feedback.textContent = `No se pudo cargar la progresion: ${e.message || "revisa filtros."}`;
                els.feedback.className = "feedback show incorrect";
            }
        }
    }

    function avanzarDiccionario(aleatorio = false) {
        if (!state.diccionario.resultados.length) return;
        const lista = state.diccionario.resultados;
        const actual = lista.findIndex((e) => e.roman === state.diccionario.seleccionRoman);
        let idx = 0;
        if (aleatorio) {
            idx = Math.floor(Math.random() * lista.length);
            if (lista.length > 1 && idx === actual) idx = (idx + 1) % lista.length;
        } else {
            idx = actual < 0 ? 0 : (actual + 1) % lista.length;
        }
        void cargarEntradaDiccionario(lista[idx]);
    }

    function obtenerDesbloqueoIdentificacion() {
        const perfil = window.PerfilUsuario?.obtenerEstadisticas?.() || {};
        const progreso = perfil.progresoProgresiones || {};
        const precision = Number(progreso.patron?.precision || 0);
        const intentos = Number(progreso.patron?.total || 0);

        let nivel = 1;
        if (precision >= 75 && intentos >= 12) nivel = 2;
        if (precision >= 82 && intentos >= 30) nivel = 3;

        const familiasPorNivel = {
            1: ["cadencia", "predominante-dominante", "pop"],
            2: ["cadencia", "predominante-dominante", "pop", "ciclo"],
            3: [...GeneradorProgresiones.FAMILIAS]
        };

        return {
            nivelMaximo: nivel,
            familias: familiasPorNivel[nivel]
        };
    }

    function updateVolumeVisibility() {
        const f = FORMACIONES[state.formacion];
        if (els.pianoVol) els.pianoVol.parentElement.style.display = f.tipo === "piano" ? "flex" : "none";
        if (els.choirVol) els.choirVol.parentElement.style.display = f.tipo === "choir" ? "flex" : "none";
        if (els.stringsVol) els.stringsVol.parentElement.style.display = f.tipo === "strings" ? "flex" : "none";
    }

    function configurarControlesAudio() {
        if (els.pianoVol) {
            els.pianoVol.addEventListener("input", (e) => {
                const v = Number(e.target.value) / 100;
                AudioEngine.setVolume("piano", v);
            });
        }
        if (els.choirVol) {
            els.choirVol.addEventListener("input", (e) => {
                const v = Number(e.target.value) / 100;
                AudioEngine.setVolume("choir", v);
                AudioEngine.setVolume("soprano", v);
            });
        }
        if (els.stringsVol) {
            els.stringsVol.addEventListener("input", (e) => {
                const v = Number(e.target.value) / 100;
                AudioEngine.setVolume("violin", v);
                AudioEngine.setVolume("viola", v);
                AudioEngine.setVolume("cello", v);
            });
        }
    }

    async function activarAudioSiNecesario() {
        try {
            if (window.Tone?.context?.state !== "running") {
                await window.Tone.start();
            }
            await AudioEngine.init();
            state.audioActivo = true;
            renderGuiaExperiencia();
            return true;
        } catch (e) {
            console.error("No se pudo activar audio:", e);
            state.audioActivo = false;
            if (els.feedback) {
                els.feedback.textContent = "No se pudo activar audio. Pulsa Escuchar otra vez.";
                els.feedback.className = "feedback show incorrect";
            }
            renderGuiaExperiencia();
            return false;
        }
    }

    function renderGuiaExperiencia() {
        const desbloqueo = obtenerDesbloqueoIdentificacion();
        const enGenerador = state.seccion === "generador";
        const enPractica = state.flujoPaso === "practica";
        if (els.sessionModeBadge) els.sessionModeBadge.textContent = "Guiado";

        if (els.uxCardGenerador) els.uxCardGenerador.classList.toggle("active", enGenerador);
        if (els.uxCardIdentificar) els.uxCardIdentificar.classList.toggle("active", !enGenerador);

        if (els.optionsTitle) {
            if (enGenerador) {
                els.optionsTitle.textContent = "Diccionario";
            } else {
                els.optionsTitle.textContent = state.etapaActual === "familia"
                    ? "Paso 1: Elige la familia"
                    : "Paso 2: Elige la progresion";
            }
        }

        if (els.skipBtn) {
            els.skipBtn.textContent = enGenerador ? "Aleatoria" : "Omitir";
            els.skipBtn.disabled = !enPractica;
        }
        if (els.nextBtn) {
            els.nextBtn.textContent = "Siguiente";
            els.nextBtn.disabled = !enPractica;
        }
        if (els.playBtn) els.playBtn.disabled = !enPractica;
        if (els.hintBtn) els.hintBtn.disabled = !enPractica || enGenerador;

        if (els.uxStatusTitle) {
            const pasoTxt = state.flujoPaso === "intencion" ? "Paso 1/3" : state.flujoPaso === "config" ? "Paso 2/3" : "Paso 3/3";
            els.uxStatusTitle.innerHTML = `${pasoTxt}`;
        }

        if (els.uxStatusAction) {
            if (state.flujoPaso === "intencion") {
                els.uxStatusAction.innerHTML = "Objetivo";
            } else if (state.flujoPaso === "config") {
                els.uxStatusAction.innerHTML = "Configura";
            } else if (enGenerador) {
                els.uxStatusAction.innerHTML = "Construir";
            } else if (state.etapaActual === "familia") {
                els.uxStatusAction.innerHTML = "Familia";
            } else {
                els.uxStatusAction.innerHTML = "Progresión";
            }
        }

        if (els.uxStatusScope) {
            if (enGenerador) {
                els.uxStatusScope.innerHTML = `Nivel <strong>${state.manual.nivel}</strong>`;
            } else {
                els.uxStatusScope.innerHTML = `Nivel máx <strong>${desbloqueo.nivelMaximo}</strong>`;
            }
        }

        if (els.uxStatusAudio) {
            els.uxStatusAudio.innerHTML = state.audioActivo
                ? "Audio: <strong>activo</strong>."
                : "Audio: <strong>pendiente</strong>. Pulsa Escuchar para activarlo.";
        }

        if (els.chordType) {
            els.chordType.textContent = enGenerador
                ? "Diccionario de progresiones"
                : "Identificación de progresiones";
        }
    }

    function renderControlesModo() {
        els.modeControlsHost.innerHTML = "";
        els.modeControlsHost.className = "manual-controls";
        const desbloqueo = obtenerDesbloqueoIdentificacion();
        renderGuiaExperiencia();
        renderRutaDidactica(state.diccionario.entradaActiva);
        state.modo = "manual";
        if (els.modeLabel) els.modeLabel.textContent = "Flujo guiado";

        if (els.modeHint) {
            if (state.flujoPaso === "intencion") {
                els.modeHint.textContent = "Paso 1";
            } else if (state.flujoPaso === "config") {
                els.modeHint.textContent = "Paso 2";
            } else {
                els.modeHint.textContent = "Paso 3";
            }
        }

        if (state.flujoPaso === "intencion") {
            const bloque = document.createElement("div");
            bloque.className = "selector-block";
            bloque.innerHTML = `<h3>¿Qué quieres hacer?</h3><div class="flow-actions" id="goalActions"></div>`;
            els.modeControlsHost.appendChild(bloque);
            const goal = document.getElementById("goalActions");
            [
                { id: "identificacion", label: "Quiero identificar progresiones" },
                { id: "generador", label: "Quiero usar el diccionario de progresiones" }
            ].forEach((it) => {
                const btn = document.createElement("button");
                btn.className = `flow-btn ${state.seccion === it.id ? "primary" : ""}`;
                btn.textContent = it.label;
                btn.onclick = () => {
                    state.seccion = it.id;
                    if (state.seccion === "generador" && state.manual.familia === "todas") state.manual.familia = "mixta";
                    state.flujoPaso = "config";
                    renderControlesModo();
                };
                goal.appendChild(btn);
            });
            return;
        }

        if (state.flujoPaso === "config") {
            const bloqueForm = document.createElement("div");
            bloqueForm.className = "selector-block";
            bloqueForm.innerHTML = `<h3>Formacion</h3><div class="compact-grid" id="formGrid"></div>`;
            els.modeControlsHost.appendChild(bloqueForm);
            Object.keys(FORMACIONES).forEach((key) => {
                const btn = crearBoton(key, FORMACIONES[key].nombre, state.formacion === key, "key-btn");
                btn.onclick = () => {
                    state.formacion = key;
                    renderControlesModo();
                };
                document.getElementById("formGrid").appendChild(btn);
            });
            updateVolumeVisibility();

            if (state.seccion === "generador") {
                const bloqueModo = document.createElement("div");
                bloqueModo.className = "selector-block";
                bloqueModo.innerHTML = `<h3>Modo</h3><div class="flow-actions" id="modeScaleActions"></div>`;
                els.modeControlsHost.appendChild(bloqueModo);
                [
                    { id: "major", label: "Mayor" },
                    { id: "minor", label: "Menor" }
                ].forEach((it) => {
                    const btn = document.createElement("button");
                    btn.className = `flow-btn ${state.manual.modoEscala === it.id ? "primary" : ""}`;
                    btn.textContent = it.label;
                    btn.onclick = () => {
                        state.manual.modoEscala = it.id;
                        sincronizarTonalidadConModo();
                        renderControlesModo();
                    };
                    document.getElementById("modeScaleActions").appendChild(btn);
                });

                const bloqueTon = document.createElement("div");
                bloqueTon.className = "selector-block";
                bloqueTon.innerHTML = `<h3>Tonalidad</h3><select id="keySelect" class="select-control"></select>`;
                els.modeControlsHost.appendChild(bloqueTon);
                const keySelect = document.getElementById("keySelect");
                const keysModo = state.api.keysByMode[state.manual.modoEscala] || [];

                if (keysModo.length) {
                    keysModo.forEach((k) => {
                        const op = document.createElement("option");
                        op.value = String(k.id);
                        op.textContent = k.display_name;
                        keySelect.appendChild(op);
                    });
                    if (!state.manual.tonalidadId) sincronizarTonalidadConModo();
                    keySelect.value = String(state.manual.tonalidadId || keysModo[0].id);
                    keySelect.onchange = () => {
                        const selected = keysModo.find((k) => String(k.id) === keySelect.value);
                        if (!selected) return;
                        state.manual.tonalidadId = selected.id;
                        state.manual.tonalidad = selected.tonic;
                        renderControlesModo();
                    };
                } else {
                    GeneradorProgresiones.TONALIDADES_MAYORES.forEach((t) => {
                        const op = document.createElement("option");
                        op.value = t;
                        op.textContent = `${t} ${state.manual.modoEscala === "minor" ? "minor" : "major"}`;
                        keySelect.appendChild(op);
                    });
                    keySelect.value = state.manual.tonalidad;
                    keySelect.onchange = () => {
                        state.manual.tonalidad = keySelect.value;
                    };
                }

                const bloqueNivel = document.createElement("div");
                bloqueNivel.className = "selector-block";
                bloqueNivel.innerHTML = `<h3>Nivel</h3><div class="compact-grid" id="nivelGrid"></div>`;
                els.modeControlsHost.appendChild(bloqueNivel);
                GeneradorProgresiones.NIVELES.forEach((nivel) => {
                    const btn = crearBoton(nivel, `Nivel ${nivel}`, state.manual.nivel === nivel, "key-btn");
                    btn.onclick = () => { state.manual.nivel = nivel; renderControlesModo(); };
                    document.getElementById("nivelGrid").appendChild(btn);
                });

                const bloqueComp = document.createElement("div");
                bloqueComp.className = "selector-block";
                bloqueComp.innerHTML = `<h3>Compositor</h3><select id="composerSelect" class="select-control"></select>`;
                els.modeControlsHost.appendChild(bloqueComp);
                const select = document.getElementById("composerSelect");
                const optAll = document.createElement("option");
                optAll.value = "todos";
                optAll.textContent = "Todos";
                select.appendChild(optAll);
                const listaCompositores = state.api.composers.length
                    ? state.api.composers.map((c) => ({ value: String(c.id), label: c.full_name, slug: slugDesdeNombre(c.full_name) }))
                    : Object.keys(window.PROGRESIONES_DATA?.compositores || {}).map((slug) => ({ value: slug, label: formatearNombreCompositor(slug), slug }));
                listaCompositores.forEach((item) => {
                    const op = document.createElement("option");
                    op.value = item.value;
                    op.textContent = item.label;
                    select.appendChild(op);
                });
                if (state.diccionario.composerId) {
                    select.value = String(state.diccionario.composerId);
                } else {
                    select.value = state.diccionario.compositor || "todos";
                }
                select.onchange = () => {
                    if (select.value === "todos") {
                        state.diccionario.compositor = "todos";
                        state.diccionario.composerId = null;
                    } else if (state.api.composers.length) {
                        const comp = state.api.composers.find((c) => String(c.id) === select.value);
                        state.diccionario.composerId = comp?.id || null;
                        state.diccionario.compositor = comp ? slugDesdeNombre(comp.full_name) : "todos";
                    } else {
                        state.diccionario.compositor = select.value;
                        state.diccionario.composerId = null;
                    }
                };

                const bloquePattern = document.createElement("div");
                bloquePattern.className = "selector-block";
                bloquePattern.innerHTML = `<h3>Patron romano</h3><input id="romanPatternInput" class="filter-input" type="text" placeholder="Ej: ii-V-I">`;
                els.modeControlsHost.appendChild(bloquePattern);
                const romanInput = document.getElementById("romanPatternInput");
                romanInput.value = state.diccionario.romanPattern || "";
                romanInput.oninput = () => {
                    state.diccionario.romanPattern = romanInput.value.trim();
                };

                const bloqueFiltros = document.createElement("div");
                bloqueFiltros.className = "selector-block";
                bloqueFiltros.innerHTML = `
                    <h3>Filtros didacticos</h3>
                    <select id="dictLevelSelect" class="select-control">
                        <option value="">Todos los niveles</option>
                        <option value="1">Nivel 1</option>
                        <option value="2">Nivel 2</option>
                        <option value="3">Nivel 3</option>
                        <option value="4">Nivel 4</option>
                        <option value="5">Nivel 5</option>
                    </select>
                    <div class="filter-checklist">
                        <label><input id="dictHasAudio" type="checkbox"> Con audio</label>
                        <label><input id="dictHasNotation" type="checkbox"> Con partitura</label>
                        <label><input id="dictCoreOnly" type="checkbox"> Solo nucleo</label>
                        <label><input id="dictHasExamples" type="checkbox"> Con obras</label>
                    </div>
                `;
                els.modeControlsHost.appendChild(bloqueFiltros);

                const levelSelect = document.getElementById("dictLevelSelect");
                const hasAudioChk = document.getElementById("dictHasAudio");
                const hasNotationChk = document.getElementById("dictHasNotation");
                const coreChk = document.getElementById("dictCoreOnly");
                const examplesChk = document.getElementById("dictHasExamples");

                levelSelect.value = state.diccionario.levelFilter || "";
                hasAudioChk.checked = Boolean(state.diccionario.hasAudio);
                hasNotationChk.checked = Boolean(state.diccionario.hasNotation);
                coreChk.checked = Boolean(state.diccionario.coreOnly);
                examplesChk.checked = Boolean(state.diccionario.hasExamples);

                levelSelect.onchange = () => { state.diccionario.levelFilter = levelSelect.value; };
                hasAudioChk.onchange = () => { state.diccionario.hasAudio = hasAudioChk.checked; };
                hasNotationChk.onchange = () => { state.diccionario.hasNotation = hasNotationChk.checked; };
                coreChk.onchange = () => { state.diccionario.coreOnly = coreChk.checked; };
                examplesChk.onchange = () => { state.diccionario.hasExamples = examplesChk.checked; };
            } else {
                const bloqueTon = document.createElement("div");
                bloqueTon.className = "selector-block";
                bloqueTon.innerHTML = `<h3>Tonalidad</h3><div class="compact-grid" id="tonGrid"></div>`;
                els.modeControlsHost.appendChild(bloqueTon);
                GeneradorProgresiones.TONALIDADES_MAYORES.forEach((t) => {
                    const btn = crearBoton(t, t, state.manual.tonalidad === t, "key-btn");
                    btn.onclick = () => {
                        state.manual.tonalidad = t;
                        state.manual.modoEscala = "major";
                        renderControlesModo();
                    };
                    document.getElementById("tonGrid").appendChild(btn);
                });

                const bloqueNivel = document.createElement("div");
                bloqueNivel.className = "selector-block";
                bloqueNivel.innerHTML = `<h3>Nivel</h3><div class="compact-grid" id="nivelGrid"></div>`;
                els.modeControlsHost.appendChild(bloqueNivel);
                GeneradorProgresiones.NIVELES.forEach((nivel) => {
                    const bloqueado = nivel > desbloqueo.nivelMaximo;
                    const btn = crearBoton(nivel, bloqueado ? `Nivel ${nivel} (bloq.)` : `Nivel ${nivel}`, state.manual.nivel === nivel, "key-btn");
                    if (bloqueado) btn.disabled = true;
                    btn.onclick = () => { state.manual.nivel = nivel; renderControlesModo(); };
                    document.getElementById("nivelGrid").appendChild(btn);
                });
            }

            const acciones = document.createElement("div");
            acciones.className = "selector-block";
            acciones.innerHTML = `<div class="flow-actions" id="configActions"></div>`;
            els.modeControlsHost.appendChild(acciones);
            const actions = document.getElementById("configActions");
            const back = document.createElement("button");
            back.className = "flow-btn";
            back.textContent = "Volver";
            back.onclick = () => { state.flujoPaso = "intencion"; renderControlesModo(); };
            actions.appendChild(back);
            const start = document.createElement("button");
            start.className = "flow-btn primary";
            start.textContent = state.seccion === "generador" ? "Abrir diccionario" : "Iniciar practica";
            start.onclick = () => {
                state.flujoPaso = "practica";
                renderControlesModo();
                generarEjercicio();
            };
            actions.appendChild(start);
            return;
        }

        const bloquePractica = document.createElement("div");
        bloquePractica.className = "selector-block";
        bloquePractica.innerHTML = `
            <h3>Control de sesion</h3>
            <div class="flow-actions" id="practiceActions"></div>
        `;
        els.modeControlsHost.appendChild(bloquePractica);
        const pActions = document.getElementById("practiceActions");
        const cfgBtn = document.createElement("button");
        cfgBtn.className = "flow-btn";
        cfgBtn.textContent = "Ajustar parametros";
        cfgBtn.onclick = () => { state.flujoPaso = "config"; renderControlesModo(); };
        pActions.appendChild(cfgBtn);
        const goalBtn = document.createElement("button");
        goalBtn.className = "flow-btn";
        goalBtn.textContent = "Cambiar objetivo";
        goalBtn.onclick = () => { state.flujoPaso = "intencion"; renderControlesModo(); };
        pActions.appendChild(goalBtn);

        if (state.seccion !== "generador") return;

        const bloqueDic = document.createElement("div");
        bloqueDic.className = "selector-block";
        bloqueDic.innerHTML = `<div class="flow-actions" id="dictActions"></div>`;
        els.modeControlsHost.appendChild(bloqueDic);
        const dActions = document.getElementById("dictActions");
        const refresh = document.createElement("button");
        refresh.className = "flow-btn primary";
        refresh.textContent = "Actualizar resultados";
        refresh.onclick = async () => {
            await construirDiccionario();
            renderOpciones();
            if (state.diccionario.resultados.length) {
                await cargarEntradaDiccionario(state.diccionario.resultados[0]);
            } else {
                renderAnalisisPanel(null);
                renderGradosPanel(null);
                renderObrasPanel(null);
                renderRutaDidactica(null);
            }
        };
        dActions.appendChild(refresh);
    }

    function buscarNotaEnRango(tipoNota, min, max) {
        if (!tipoNota) return "C4";
        const parseada = NOTAS.parse(tipoNota);
        if (parseada.octave === null) parseada.octave = 4;
        let midi = NOTAS.midi(parseada);
        while (midi < min) midi += 12;
        while (midi > max) midi -= 12;
        return `${parseada.letter}${parseada.accidental}${Math.floor(midi / 12) - 1}`;
    }

    async function generarEjercicio() {
        if (state.flujoPaso !== "practica") {
            renderGuiaExperiencia();
            return;
        }
        const desbloqueo = obtenerDesbloqueoIdentificacion();
        state.revealActivo = state.seccion === "generador";
        state.etapaActual = state.seccion === "generador" ? "diccionario" : "familia";
        limpiarFeedback();
        if (els.composerContext) {
            els.composerContext.textContent = state.seccion === "generador"
                ? "Selecciona una progresión del diccionario."
                : "Acierta una progresion para ver compositores y obras relacionadas.";
        }

        if (state.seccion === "generador") {
            await construirDiccionario();
            const primera = state.diccionario.resultados[0];
            if (primera) {
                await cargarEntradaDiccionario(primera);
            } else {
                renderAnalisisPanel(null);
                renderGradosPanel(null);
                renderObrasPanel(null);
                renderRutaDidactica(null);
            }
            renderGuiaExperiencia();
            renderOpciones();
            actualizarStats();
            return;
        }

        renderAnalisisPanel(null);
        renderGradosPanel(null);

        let config;
        const familiasActivas = desbloqueo.familias;
        const nivelManual = Math.min(state.manual.nivel, desbloqueo.nivelMaximo);
        const familiaManual = state.manual.familia !== "todas" && !familiasActivas.includes(state.manual.familia)
            ? "todas"
            : state.manual.familia;

        config = {
            tonalidad: state.manual.tonalidad,
            nivel: nivelManual,
            familia: familiaManual,
            fuente: "catalogo",
            longitud: state.manual.longitud,
            color: state.manual.color
        };

        let intentos = 0;
        let candidato = null;
        const anterior = state.ejercicioActual?.progStr || "";
        do {
            candidato = GeneradorProgresiones.generar(config);
            intentos++;
        } while (intentos < 8 && candidato?.progStr === anterior);
        state.ejercicioActual = candidato;

        state.opcionesFamilia = GeneradorProgresiones.generarOpcionesFamilia(state.ejercicioActual, 4);
        state.opcionesProgresion = GeneradorProgresiones.generarOpciones(state.ejercicioActual, {
            nivel: config.nivel,
            familia: state.ejercicioActual.familia
        });

        renderGuiaExperiencia();
        renderPartitura();
        renderInfo();
        renderOpciones();
        renderRutaDidactica(null);
        actualizarStats();

        if (state.audioActivo) {
            setTimeout(() => {
                ejecutarAudioProgresion();
            }, 500);
        }
    }

    function renderPartitura() {
        const f = FORMACIONES[state.formacion];
        VexFlowManager.limpiar();

        if (f.render === "grandstaff") {
            VexFlowManager.dibujarProgresionGrandStaff(state.ejercicioActual.acordes, state.ejercicioActual.tonalidad);
        } else {
            const stavesData = f.staves.map((s, i) => {
                const notesProg = state.ejercicioActual.acordes.map((acorde) => {
                    const notaBase = acorde.notas[i % acorde.notas.length];
                    return buscarNotaEnRango(notaBase, s.range[0], s.range[1]);
                });
                return {
                    clef: s.clef,
                    progresion: notesProg.map((n) => [n]),
                    displayOctaveOffset: s.displayOctaveOffset
                };
            });
            VexFlowManager.dibujarProgresionScore(stavesData, state.ejercicioActual.tonalidad);
        }
    }

    async function ejecutarAudioProgresion() {
        if (!state.ejercicioActual) return;
        const okAudio = await activarAudioSiNecesario();
        if (!okAudio) return;

        const f = FORMACIONES[state.formacion];
        const tempo = 85;
        const beatSec = 60 / tempo;

        AudioEngine.detenerTodo();

        state.ejercicioActual.acordes.forEach((acorde, i) => {
            setTimeout(() => {
                let notas;
                let insts;

                if (f.render === "grandstaff") {
                    notas = acorde.notas;
                    insts = "piano";
                } else {
                    notas = f.staves.map((s, j) => {
                        const notaBase = acorde.notas[j % acorde.notas.length];
                        return buscarNotaEnRango(notaBase, s.range[0], s.range[1]);
                    });
                    insts = f.staves.map((s) => s.inst);
                }

                AudioEngine.tocarArmonico(notas, "2n", insts);
            }, i * beatSec * 1000);
        });
    }

    function renderInfo() {
        els.chordName.textContent = state.revealActivo ? state.ejercicioActual.nombre : "Progresion oculta";

        const modoTexto = state.modo.toUpperCase();
        const nivelTexto = `Nivel ${state.ejercicioActual?.nivel || state.manual.nivel}`;
        const familiaTexto = nombreFamilia(state.ejercicioActual?.familia || state.manual.familia);
        const etapaTexto = state.seccion === "generador"
            ? "Diccionario"
            : (state.etapaActual === "familia" ? "Etapa 1: Familia" : "Etapa 2: Progresion");
        const bajoTexto = Array.isArray(state.ejercicioActual?.bajoLinea) ? state.ejercicioActual.bajoLinea.join(" - ") : "N/D";
        const seccionTexto = state.seccion === "generador" ? "Diccionario" : "Identificacion";
        const compositorActivo = state.diccionario.entradaActiva?.composer_name
            || (state.diccionario.compositor === "todos" ? "Todos" : formatearNombreCompositor(state.diccionario.compositor));

        if (state.seccion === "generador") {
            const conv = state.ejercicioActual?.conversionAbsoluta || "";
            const convTxt = conv && conv.length > 72 ? `${conv.slice(0, 72)}…` : (conv || "N/D");
            els.exerciseContext.innerHTML = `
                <div class="context-card">
                    <div class="context-row"><span>Tonalidad</span> <strong>${state.ejercicioActual.tonalidad}</strong></div>
                    <div class="context-row"><span>Compositor</span> <strong>${compositorActivo}</strong></div>
                    <div class="context-row"><span>Nivel</span> <strong>${nivelTexto}</strong></div>
                    <div class="context-row"><span>Conversion</span> <strong>${convTxt}</strong></div>
                    <div class="context-row"><span>Sentido</span> <strong>${sentidoDeProgresion(state.ejercicioActual?.progStr || "")}</strong></div>
                </div>
            `;
            return;
        }

        els.exerciseContext.innerHTML = `
            <div class="context-card">
                <div class="context-row"><span>Modo</span> <strong>${modoTexto}</strong></div>
                <div class="context-row"><span>Tonalidad</span> <strong>${state.ejercicioActual.tonalidad}</strong></div>
                <div class="context-row"><span>Nivel</span> <strong>${nivelTexto}</strong></div>
                <div class="context-row"><span>Familia</span> <strong>${familiaTexto}</strong></div>
                <div class="context-row"><span>Paso</span> <strong>${etapaTexto}</strong></div>
            </div>
        `;
    }

    function renderOpcionesLegacy() {
        els.optionsContainer.innerHTML = "";

        if (state.seccion === "generador") {
            if (!state.diccionario.resultados.length) {
                const vacio = document.createElement("div");
                vacio.className = "context-card";
                vacio.textContent = "Sin resultados con ese filtro.";
                els.optionsContainer.appendChild(vacio);
                return;
            }

            state.diccionario.resultados.slice(0, 60).forEach((entry) => {
                const btn = document.createElement("button");
                btn.className = "prog-btn";
                if (state.diccionario.seleccionRoman === entry.roman) btn.classList.add("active");
                const compTxt = entry.compositores.length
                    ? entry.compositores.map(formatearNombreCompositor).join(" · ")
                    : "Referencia general";
                btn.innerHTML = `<strong>${entry.roman}</strong><br><span style="font-size:.88rem;color:#2f3e5d;">${compTxt}</span>`;
                btn.onclick = () => cargarEntradaDiccionario(entry);
                els.optionsContainer.appendChild(btn);
            });
            return;
        }

        const opciones = state.etapaActual === "familia" ? state.opcionesFamilia : state.opcionesProgresion;

        opciones.forEach((p) => {
            const btn = document.createElement("button");
            btn.className = "prog-btn";
            btn.textContent = state.etapaActual === "familia" ? nombreFamilia(p.id) : p.nombre;
            btn.onclick = () => {
                if (state.etapaActual === "familia") {
                    evaluarFamilia(p.id, btn);
                } else {
                    evaluarProgresion(p.id, btn);
                }
            };
            els.optionsContainer.appendChild(btn);
        });
    }

    function renderOpciones() {
        els.optionsContainer.innerHTML = "";

        if (state.seccion === "generador") {
            if (state.diccionario.cargando) {
                const cargando = document.createElement("div");
                cargando.className = "panel-empty";
                cargando.textContent = "Cargando progresiones...";
                els.optionsContainer.appendChild(cargando);
                return;
            }

            if (!state.diccionario.resultados.length) {
                const vacio = document.createElement("div");
                vacio.className = "panel-empty";
                vacio.textContent = state.diccionario.ultimoError || "Sin resultados con ese filtro.";
                els.optionsContainer.appendChild(vacio);
                return;
            }

            state.diccionario.resultados.slice(0, 60).forEach((entry) => {
                const btn = document.createElement("button");
                btn.className = "prog-btn";
                const activo = state.diccionario.entradaActiva?.id
                    ? String(state.diccionario.entradaActiva.id) === String(entry.id)
                    : state.diccionario.seleccionRoman === entry.roman;
                if (activo) btn.classList.add("active");

                const compTxt = entry.composer_name
                    || (entry.compositores?.length
                        ? entry.compositores.map(formatearNombreCompositor).join(" · ")
                        : "Referencia general");
                const sub = [compTxt, entry.mode === "minor" ? "Menor" : "Mayor"].filter(Boolean).join(" · ");
                const badges = [];
                const level = entry.learning_level ?? entry.difficulty_level;
                if (level) badges.push(`N${level}`);
                if (Number(entry.has_audio || 0)) badges.push("Audio");
                if (Number(entry.has_notation || 0)) badges.push("Partitura");
                if (Number(entry.is_core || 0)) badges.push("Core");
                if (Number(entry.variant_count || 0) > 0) badges.push(`Var ${entry.variant_count}`);
                const conversion = entry.converted_chords
                    || convertirProgresionATonalidad(
                        entry.roman,
                        state.manual.tonalidad,
                        entry.mode || state.manual.modoEscala
                    ).chordSequence;
                const conversionShort = conversion
                    ? (conversion.length > 62 ? `${conversion.slice(0, 62)}…` : conversion)
                    : "";
                const badgeHtml = badges.length
                    ? `<div class="badge-row">${badges.map((b) => `<span class="badge">${b}</span>`).join("")}</div>`
                    : "";
                const convHtml = conversionShort
                    ? `<br><span style="font-size:.82rem;color:#5a667f;">${conversionShort}</span>`
                    : "";
                btn.innerHTML = `<strong>${entry.roman}</strong><br><span style="font-size:.88rem;color:#2f3e5d;">${sub}</span>${convHtml}${badgeHtml}`;
                btn.onclick = () => { void cargarEntradaDiccionario(entry); };
                els.optionsContainer.appendChild(btn);
            });
            return;
        }

        const opciones = state.etapaActual === "familia" ? state.opcionesFamilia : state.opcionesProgresion;
        opciones.forEach((p) => {
            const btn = document.createElement("button");
            btn.className = "prog-btn";
            btn.textContent = state.etapaActual === "familia" ? nombreFamilia(p.id) : p.nombre;
            btn.onclick = () => {
                if (state.etapaActual === "familia") {
                    evaluarFamilia(p.id, btn);
                } else {
                    evaluarProgresion(p.id, btn);
                }
            };
            els.optionsContainer.appendChild(btn);
        });
    }

    function registrarIntentoSistemas(evaluacion) {
        if (window.PerfilUsuario?.registrarIntento) {
            window.PerfilUsuario.registrarIntento({
                modulo: "identificacion_progresiones",
                ejercicio: state.ejercicioActual,
                evaluacion
            });
        }

        if (window.AIEngine?.registrarIntento) {
            window.AIEngine.registrarIntento({
                modulo: "identificacion_progresiones",
                ejercicio: state.ejercicioActual,
                evaluacion
            });
        }
    }

    function evaluarFamilia(familiaId, btn) {
        state.stats.total++;
        const correcta = state.ejercicioActual.familia === familiaId;

        state.ultimaEvaluacion = {
            correcto: correcta,
            etapa: "familia",
            comparacion: {
                familia: correcta,
                progresion: null
            },
            respuestaUsuario: {
                familia: familiaId
            }
        };
        registrarIntentoSistemas(state.ultimaEvaluacion);

        if (correcta) {
            btn.classList.add("correct");
            state.etapaActual = "progresion";
            els.feedback.textContent = "Familia correcta. Ahora identifica la progresion exacta.";
            els.feedback.className = "feedback show correct";
            renderGuiaExperiencia();
            renderInfo();
            renderOpciones();
            return;
        }

        btn.classList.add("incorrect");
        els.feedback.textContent = "Familia incorrecta. Escucha el tipo de tension y resolucion.";
        els.feedback.className = "feedback show incorrect";
        actualizarStats();
    }

    function evaluarProgresion(id, btn) {
        state.stats.total++;
        const correcta = state.ejercicioActual.respuestaCorrecta === id;
        const opcionElegida = (state.opcionesProgresion || []).find((p) => p.id === id);

        state.ultimaEvaluacion = {
            correcto: correcta,
            etapa: "progresion",
            comparacion: {
                familia: true,
                progresion: correcta
            },
            respuestaUsuario: {
                progresionId: id,
                nombre: opcionElegida?.nombre || id
            }
        };
        registrarIntentoSistemas(state.ultimaEvaluacion);

        if (correcta) {
            state.stats.correctas++;
            state.revealActivo = true;
            renderInfo();
            renderCompositoresRelacionados(state.ejercicioActual?.progStr || "");
            els.feedback.textContent = `Correcto: ${state.ejercicioActual.nombre}`;
            els.feedback.className = "feedback show correct";
            btn.classList.add("correct");
            actualizarStats();
            setTimeout(generarEjercicio, 1800);
            return;
        }

        btn.classList.add("incorrect");
        els.feedback.textContent = "Progresion incorrecta. Compara inicio y punto de reposo final.";
        els.feedback.className = "feedback show incorrect";
        actualizarStats();
    }

    function actualizarStats() {
        const perfil = window.PerfilUsuario?.obtenerEstadisticas?.() || {};
        const progreso = perfil.progresoProgresiones || {};
        const fam = progreso.familia || {};
        const pat = progreso.patron || {};

        const precisionFamilia = typeof fam.precision === "number" ? fam.precision : 0;
        const precisionPatron = typeof pat.precision === "number" ? pat.precision : 0;
        const precisionModulo = precisionPatron;

        els.statsSummary.innerHTML = [
            `Intentos: ${state.stats.total}`,
            `Aciertos finales: ${state.stats.correctas}`,
            `Precision modulo: ${precisionModulo}%`,
            `Familia: ${precisionFamilia}%`,
            `Patron: ${precisionPatron}%`
        ].join(" | ");
        els.progressFill.style.width = `${precisionModulo}%`;
    }

    function obtenerEjercicioParaMaestro() {
        if (!state.ejercicioActual) return null;
        return {
            ...state.ejercicioActual,
            contextoModulo: {
                modulo: "identificacion_progresiones",
                seccion: state.seccion,
                formacion: FORMACIONES[state.formacion]?.nombre || state.formacion,
                modo: state.modo,
                nivel: state.ejercicioActual.nivel,
                familia: state.ejercicioActual.familia,
                etapa: state.etapaActual,
                fuente: state.ejercicioActual.fuente,
                raizObjetivo: state.ejercicioActual.raizObjetivo,
                bajoLinea: state.ejercicioActual.bajoLinea
            }
        };
    }

    function prepararPanelMaestro() {
        if (!els.maestroPanel) return false;
        els.maestroPanel.classList.remove("hidden");
        if (els.maestroContent) {
            els.maestroContent.classList.add("hidden");
            els.maestroContent.innerHTML = "";
        }
        if (els.maestroLoading) els.maestroLoading.classList.remove("hidden");
        if (els.maestroError) els.maestroError.classList.add("hidden");
        return true;
    }

    function mostrarRespuestaMaestro(texto) {
        if (els.maestroLoading) els.maestroLoading.classList.add("hidden");
        if (els.maestroError) els.maestroError.classList.add("hidden");
        if (els.maestroContent) {
            els.maestroContent.classList.remove("hidden");
            els.maestroContent.innerHTML = `<div class="maestro-texto">${texto.replace(/\n/g, "<br>")}</div>`;
        }
    }

    function mostrarErrorMaestro(mensaje) {
        if (els.maestroPanel) els.maestroPanel.classList.remove("hidden");
        if (els.maestroLoading) els.maestroLoading.classList.add("hidden");
        if (els.maestroError) {
            els.maestroError.classList.remove("hidden");
            els.maestroError.textContent = mensaje;
        }
    }

    async function consultarMaestro(tipo = null, consulta = null) {
        if (!prepararPanelMaestro()) return;

        try {
            const res = await (window.AIEngine?.consultar?.({
                tipo: tipo || (state.ultimaEvaluacion && !state.ultimaEvaluacion.correcto ? "retroalimentacion_error" : "resumen_sesion"),
                modulo: "identificacion_progresiones",
                ejercicio: obtenerEjercicioParaMaestro(),
                evaluacion: state.ultimaEvaluacion,
                consulta
            }) ?? Promise.resolve({ ok: false, error: "Maestro no disponible." }));

            if (res.ok && res.respuesta) {
                mostrarRespuestaMaestro(res.respuesta);
            } else {
                mostrarErrorMaestro(res.error || "No se pudo conectar al Maestro.");
            }
        } catch (_) {
            mostrarErrorMaestro("Error de conexion con el Maestro.");
        }
    }

    function preguntarAlMaestro() {
        const consulta = els.maestroPregunta?.value?.trim();
        if (!consulta) {
            mostrarErrorMaestro("Escribe una pregunta para consultar al Maestro.");
            return;
        }
        consultarMaestro("consulta_libre", consulta);
    }

    function limpiarFeedback() {
        els.feedback.textContent = "";
        els.feedback.className = "feedback";
        if (els.hintBox) {
            const texto = state.seccion === "generador"
                ? "Diccionario: selecciona una progresión para ver obras y sentido armónico."
                : (window.Pistas?.generarProgresion
                    ? window.Pistas.generarProgresion({
                        ejercicio: state.ejercicioActual || { familia: state.manual.familia, tonalidad: state.manual.tonalidad },
                        etapa: state.etapaActual
                    })
                    : "Pista de escucha: identifica tension dominante y resolucion tonal.");
            els.hintBox.textContent = texto;
            els.hintBox.classList.remove("show");
        }
    }

    els.playBtn.onclick = ejecutarAudioProgresion;

    els.modeToggle.onclick = () => {};

    els.nextBtn.onclick = () => {
        if (state.seccion === "generador") {
            avanzarDiccionario(false);
            return;
        }
        generarEjercicio();
    };

    if (els.hintBtn) {
        els.hintBtn.onclick = () => {
            if (!state.ejercicioActual) return;
            const texto = state.seccion === "generador"
                ? "Escucha el bajo como linea independiente y describe en voz alta: salida, tension y llegada."
                : (window.Pistas?.generarProgresion
                    ? window.Pistas.generarProgresion({
                        ejercicio: state.ejercicioActual,
                        etapa: state.etapaActual
                    })
                    : "Escucha la funcion de llegada y el punto de mayor tension.");
            els.hintBox.textContent = texto;
            els.hintBox.classList.add("show");
        };
    }

    els.skipBtn.onclick = () => {
        if (state.seccion === "generador") {
            avanzarDiccionario(true);
            return;
        }
        state.revealActivo = true;
        state.ultimaEvaluacion = {
            correcto: false,
            etapa: state.etapaActual,
            respuestaUsuario: { accion: "omitido" }
        };
        registrarIntentoSistemas(state.ultimaEvaluacion);
        renderInfo();
        els.feedback.textContent = `Respuesta: ${state.ejercicioActual.nombre}`;
        els.feedback.className = "feedback show";
        setTimeout(generarEjercicio, 2500);
    };

    if (els.maestroBtn) els.maestroBtn.onclick = () => consultarMaestro();
    if (els.maestroClose) {
        els.maestroClose.onclick = () => {
            if (els.maestroPanel) els.maestroPanel.classList.add("hidden");
        };
    }
    if (els.maestroAskBtn) els.maestroAskBtn.onclick = preguntarAlMaestro;
    if (els.maestroPregunta) {
        els.maestroPregunta.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                preguntarAlMaestro();
            }
        });
    }

    document.querySelectorAll(".landing-card").forEach((card) => {
        card.addEventListener("click", () => {
            const objetivo = card.getAttribute("data-target");
            abrirModulo(objetivo);
        });
    });
    if (els.backToLandingBtn) {
        els.backToLandingBtn.onclick = volverAOpciones;
    }

    try {
        if (els.modeHint) els.modeHint.textContent = "Paso 1";
        configurarControlesAudio();
        void cargarCatalogoApiInicial();
        volverAOpciones();
    } catch (e) {
        console.error("Error critico de inicializacion:", e);
    }
});
