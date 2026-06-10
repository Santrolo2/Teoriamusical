/**
 * generador-progresiones.js
 * Generador didactico de progresiones:
 * - Catalogo guiado (familia/nivel)
 * - Generador procedimental (longitud/color)
 */
const GeneradorProgresiones = (() => {
    "use strict";

    const TONALIDADES_MAYORES = ["C", "G", "D", "A", "E", "B", "F#", "C#", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];
    const NIVELES = [1, 2, 3];
    const FAMILIAS = ["cadencia", "predominante-dominante", "ciclo", "pop", "mixta"];
    const COLORES = ["diatonico", "mixto", "tension"];
    const RAICES = ["C", "C#", "Db", "D", "Eb", "E", "F", "F#", "Gb", "G", "Ab", "A", "Bb", "B", "Cb"];
    const TOKENS_POR_NIVEL = {
        1: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
        2: ["I", "ii", "ii6", "iii", "IV", "I6", "V", "V7", "vi", "vii°"],
        3: ["I", "I6", "I64", "ii", "ii6", "iii", "iv", "IV", "V", "V7", "V/V", "vi", "vii°", "vii°/V", "bII6"]
    };

    const CATALOGO = [
        { id: "I-IV-V-I", nombre: "I - IV - V - I", roman: "I - IV - V - I", familia: "cadencia", nivel: 1 },
        { id: "ii-V-I", nombre: "ii - V - I", roman: "ii - V - I", familia: "predominante-dominante", nivel: 1 },
        { id: "I-vi-IV-V", nombre: "I - vi - IV - V", roman: "I - vi - IV - V", familia: "pop", nivel: 1 },
        { id: "I-V-vi-IV", nombre: "I - V - vi - IV", roman: "I - V - vi - IV", familia: "pop", nivel: 1 },
        { id: "vi-IV-I-V", nombre: "vi - IV - I - V", roman: "vi - IV - I - V", familia: "pop", nivel: 1 },
        { id: "ii-V-I-vi", nombre: "ii - V - I - vi", roman: "ii - V - I - vi", familia: "predominante-dominante", nivel: 2 },
        { id: "I-vi-ii-V-I", nombre: "I - vi - ii - V - I", roman: "I - vi - ii - V - I", familia: "ciclo", nivel: 2 },
        { id: "I-iii-vi-ii-V-I", nombre: "I - iii - vi - ii - V - I", roman: "I - iii - vi - ii - V - I", familia: "ciclo", nivel: 2 },
        { id: "I-IV-ii-V-I", nombre: "I - IV - ii - V - I", roman: "I - IV - ii - V - I", familia: "mixta", nivel: 2 },
        { id: "I-ii-V-VI", nombre: "I - ii - V/V - V - I", roman: "I - ii - V/V - V - I", familia: "mixta", nivel: 3 },
        { id: "I-IV-vii-V-I", nombre: "I - IV - vii°6/V - V - I", roman: "I - IV - vii°6/V - V - I", familia: "mixta", nivel: 3 },
        { id: "I-N6-V-I", nombre: "I - ♭II6 - V - I", roman: "I - bII6 - V - I", familia: "cadencia", nivel: 3 }
    ];

    const CATALOGO_CLASICO_EXTRA = [
        { id: "I-V-I", nombre: "I - V - I", roman: "I - V - I", familia: "cadencia", nivel: 1 },
        { id: "I-IV-I", nombre: "I - IV - I", roman: "I - IV - I", familia: "cadencia", nivel: 1 },
        { id: "I-ii-V-I", nombre: "I - ii - V - I", roman: "I - ii - V - I", familia: "predominante-dominante", nivel: 1 },
        { id: "I-vi-ii-V", nombre: "I - vi - ii - V", roman: "I - vi - ii - V", familia: "ciclo", nivel: 2 },
        { id: "I-IV-I6-V-I", nombre: "I - IV - I6 - V - I", roman: "I - IV - I6 - V - I", familia: "cadencia", nivel: 2 },
        { id: "I-vi-ii6-V7-I", nombre: "I - vi - ii6 - V7 - I", roman: "I - vi - ii6 - V7 - I", familia: "predominante-dominante", nivel: 3 },
        { id: "I-iv-I64-V-I", nombre: "I - iv - I64 - V - I", roman: "I - iv - I64 - V - I", familia: "cadencia", nivel: 3 },
        { id: "I-IV-viiV-V-I", nombre: "I - IV - vii°/V - V - I", roman: "I - IV - vii°/V - V - I", familia: "mixta", nivel: 3 }
    ];

    function obtenerCatalogoCompleto() {
        return [...CATALOGO, ...CATALOGO_CLASICO_EXTRA];
    }

    function elegir(lista) {
        return lista[Math.floor(Math.random() * lista.length)];
    }

    function normalizarRoman(roman = "") {
        return String(roman)
            .replace(/♭/g, "b")
            .replace(/°/g, "°")
            .replace(/–/g, "-")
            .replace(/—/g, "-");
    }

    function canonicalIdFromRoman(roman = "") {
        return normalizarRoman(roman).replace(/\s+/g, "").replace(/[^A-Za-z0-9b#\/\-°]/g, "");
    }

    function filtrarCatalogo({ nivel = null, familia = null } = {}) {
        return obtenerCatalogoCompleto().filter((p) => {
            if (nivel && p.nivel !== nivel) return false;
            if (familia && familia !== "todas" && p.familia !== familia) return false;
            return true;
        });
    }

    function transponerOctavaNota(nota, delta) {
        const m = String(nota).match(/^([A-G][b#]?)(-?\d+)$/);
        if (!m) return nota;
        const oct = Number(m[2]) + delta;
        return `${m[1]}${oct}`;
    }

    function ajustarRegistroProgresion(acordes = []) {
        // Baja una octava para que el bajo sea claramente visible y audible.
        return acordes.map((a) => {
            const notas = (a.notas || []).map((n) => transponerOctavaNota(n, -1));
            return {
                ...a,
                notas,
                bajo: notas[0] || a.bajo
            };
        });
    }

    function normalizarClaseNota(nota = "") {
        const clean = String(nota)
            .replace(/♯/g, "#")
            .replace(/♭/g, "b")
            .trim();
        const m = clean.match(/^([A-Ga-g])(bb|b|##|#)?/);
        if (!m) return "";
        return `${m[1].toUpperCase()}${m[2] || ""}`;
    }

    function raizDeTokenEnTonalidad(token, tonalidad) {
        try {
            const acordes = resolverAcordes(token, tonalidad);
            const acorde = acordes?.[0];
            if (!acorde) return "";
            const raiz = acorde.raiz || acorde.notasBase?.[0] || acorde.notas?.[0] || "";
            return normalizarClaseNota(raiz);
        } catch (_) {
            return "";
        }
    }

    function elegirInicioPorRaiz({ raizObjetivo = null, tonalidad = "C", familia = "mixta", nivel = 1, color = "diatonico" } = {}) {
        if (!raizObjetivo) return null;
        const objetivo = normalizarClaseNota(raizObjetivo);
        if (!objetivo) return null;

        const candidatosBase = {
            cadencia: ["I", "ii", "IV", "V", "vi"],
            "predominante-dominante": ["ii", "IV", "V", "vii°", "I"],
            ciclo: ["I", "vi", "ii", "V", "iii"],
            pop: ["I", "V", "vi", "IV"],
            mixta: ["I", "ii", "iii", "IV", "V", "vi"]
        };
        const candidatos = [...(candidatosBase[familia] || candidatosBase.mixta)];

        if (nivel >= 3) {
            if (color === "tension") candidatos.push("V/V", "bII6", "vii°6/V");
            if (color === "mixto") candidatos.push("V/V");
        }

        for (const token of candidatos) {
            if (raizDeTokenEnTonalidad(token, tonalidad) === objetivo) {
                return token;
            }
        }
        return null;
    }

    function analizarFunciones(roman = "") {
        return normalizarRoman(roman).split("-").map((s) => s.trim()).filter(Boolean).map((g) => {
            const grado = g.toLowerCase();
            let funcion = "tonica";
            if (grado.includes("v") || grado.includes("vii")) funcion = "dominante";
            if (grado.startsWith("ii") || grado.startsWith("iv") || grado.includes("bii")) funcion = "predominante";
            return { grado: g, funcion };
        });
    }

    function objetivoPedagogico(familia, nivel, fuente) {
        const base = {
            cadencia: "Escuchar cierre tonal y confirmar reposo final.",
            "predominante-dominante": "Distinguir preparacion y tension dominante antes de resolver.",
            ciclo: "Seguir direccion funcional encadenada sin perder centro tonal.",
            pop: "Reconocer patron global y estabilidad del bajo en repeticion.",
            mixta: "Combinar funcion tonal con color armonico de mayor complejidad."
        };
        const texto = base[familia] || "Reconocer funcion y direccion armonica.";
        const origen = fuente === "generador" ? "Progresion generada" : "Progresion del catalogo";
        return `${origen} nivel ${nivel}: ${texto}`;
    }

    function nivelDesdeTokens(tokens = []) {
        const set1 = new Set(TOKENS_POR_NIVEL[1]);
        const set2 = new Set(TOKENS_POR_NIVEL[2]);
        let nivel = 1;
        tokens.forEach((t) => {
            const tok = String(t).trim();
            if (!set2.has(tok)) nivel = Math.max(nivel, 3);
            else if (!set1.has(tok)) nivel = Math.max(nivel, 2);
        });
        return nivel;
    }

    function resolverAcordes(roman, tonalidad) {
        const armoniaMod = (typeof TEORIA !== "undefined" && TEORIA.armonia) || window.ARMONIA;
        if (!armoniaMod) {
            throw new Error("Modulo ARMONIA no disponible.");
        }
        const acordes = armoniaMod.resolverProgresion(normalizarRoman(roman), tonalidad, "major");
        return ajustarRegistroProgresion(acordes);
    }

    function construirDesdeRoman({
        tonalidad = "C",
        roman = "I - IV - V - I",
        familia = "mixta",
        nivel = null,
        fuente = "usuario",
        color = "diatonico",
        raizObjetivo = null,
        nombre = null
    } = {}) {
        const romanNorm = normalizarRoman(roman);
        const tokens = romanNorm.split("-").map((s) => s.trim()).filter(Boolean);
        const lvl = nivel || nivelDesdeTokens(tokens);
        const acordes = resolverAcordes(romanNorm, tonalidad);
        const bajoLinea = acordes.map((a) => String(a.bajo || "").replace(/\d+/g, ""));
        const analisis = analizarFunciones(romanNorm);

        return {
            id: `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            nombre: nombre || romanNorm,
            tonalidad,
            acordes,
            respuestaCorrecta: `custom_${canonicalIdFromRoman(romanNorm)}`,
            progStr: romanNorm,
            familia,
            nivel: lvl,
            fuente,
            color,
            raizObjetivo: normalizarClaseNota(raizObjetivo || ""),
            bajoLinea,
            analisis,
            objetivoPedagogico: objetivoPedagogico(familia, lvl, fuente)
        };
    }

    function generarEspacioProgresiones({
        nivel = 1,
        longitud = 4,
        familia = "mixta",
        max = 120
    } = {}) {
        const basePool = TOKENS_POR_NIVEL[Math.max(1, Math.min(3, Number(nivel) || 1))] || TOKENS_POR_NIVEL[1];
        const famPool = {
            cadencia: basePool.filter((t) => /^(I|IV|ii|ii6|V|V7|vii°|bII6)$/i.test(t)),
            "predominante-dominante": basePool.filter((t) => /^(ii|ii6|IV|V|V7|vii°|V\/V|I)$/i.test(t)),
            ciclo: basePool.filter((t) => /^(I|iii|vi|ii|ii6|V|V7)$/i.test(t)),
            pop: basePool.filter((t) => /^(I|IV|V|vi)$/i.test(t)),
            mixta: basePool
        };
        const pool = famPool[familia] && famPool[familia].length ? famPool[familia] : basePool;
        const n = Math.min(6, Math.max(3, Number(longitud) || 4));
        const seen = new Set();
        const out = [];

        const plantillas = {
            cadencia: [["I", "IV", "V", "I"], ["I", "ii", "V", "I"], ["I", "ii6", "V7", "I"]],
            "predominante-dominante": [["ii", "V", "I"], ["I", "ii", "V", "I"], ["I", "ii6", "V7", "I"]],
            ciclo: [["I", "vi", "ii", "V"], ["I", "iii", "vi", "ii", "V", "I"]],
            pop: [["I", "V", "vi", "IV"], ["vi", "IV", "I", "V"], ["I", "vi", "IV", "V"]],
            mixta: [["I", "ii", "V/V", "V", "I"], ["I", "IV", "ii", "V", "I"]]
        };
        (plantillas[familia] || plantillas.mixta).forEach((tpl) => {
            const tok = tpl.slice(0, n);
            if (tok.length < 3) return;
            const roman = tok.join(" - ");
            const id = canonicalIdFromRoman(roman);
            if (!seen.has(id)) {
                seen.add(id);
                out.push(roman);
            }
        });

        while (out.length < max) {
            const seq = ["I"];
            while (seq.length < n - 1) {
                seq.push(elegir(pool));
            }
            seq.push("I");
            const roman = seq.join(" - ");
            const id = canonicalIdFromRoman(roman);
            if (seen.has(id)) continue;
            seen.add(id);
            out.push(roman);
            if (seen.size > max * 8) break;
        }

        return out.slice(0, max);
    }

    function generarProcedural({
        longitud = 4,
        nivel = 1,
        familia = "mixta",
        color = "diatonico",
        tonalidad = "C",
        raizObjetivo = null
    } = {}) {
        const tonicaPool = ["I", "vi", "iii"];
        const predPool = ["ii", "IV", "ii6"];
        const domPool = ["V", "vii°", "V7"];
        const colorPool = color === "tension"
            ? ["V/V", "bII6", "vii°6/V"]
            : color === "mixto"
                ? ["IV", "ii", "V/V"]
                : ["ii", "IV"];

        const objetivo = Math.min(6, Math.max(3, Number(longitud) || 4));
        const inicioPreferido = elegirInicioPorRaiz({ raizObjetivo, tonalidad, familia, nivel, color });
        const seq = [inicioPreferido || "I"];

        while (seq.length < objetivo - 1) {
            const idx = seq.length;
            if (familia === "ciclo") {
                const ciclo = ["vi", "ii", "V"];
                seq.push(ciclo[(idx - 1) % ciclo.length]);
                continue;
            }
            if (familia === "pop") {
                const pop = ["V", "vi", "IV"];
                seq.push(pop[(idx - 1) % pop.length]);
                continue;
            }
            if (familia === "cadencia") {
                seq.push(idx % 2 === 0 ? elegir(domPool) : elegir(predPool));
                continue;
            }
            if (familia === "predominante-dominante") {
                seq.push(idx % 2 === 0 ? elegir(domPool) : elegir(predPool));
                continue;
            }

            // mixta
            if (nivel >= 3 && Math.random() < 0.35) {
                seq.push(elegir(colorPool));
            } else if (Math.random() < 0.5) {
                seq.push(elegir(predPool));
            } else {
                seq.push(elegir(tonicaPool));
            }
        }

        seq.push("I");

        // Para claridad de bajo, añade inversion suave en un punto intermedio.
        if (seq.length >= 4 && nivel >= 2) {
            const pos = Math.min(seq.length - 2, 2);
            if (!seq[pos].includes("/") && !seq[pos].endsWith("6")) {
                seq[pos] = `${seq[pos]}6`;
            }
        }

        return seq.join(" - ");
    }

    function construirProgresion({
        tonalidad = "C",
        progressionId = null,
        nivel = null,
        familia = null,
        fuente = "catalogo",
        longitud = 4,
        color = "diatonico",
        raizObjetivo = null
    }) {
        let base;
        let roman;
        let origen = "catalogo";

        if (fuente === "generador") {
            const fam = familia && familia !== "todas" ? familia : elegir(FAMILIAS);
            const lvl = nivel || 1;
            roman = generarProcedural({ longitud, nivel: lvl, familia: fam, color, tonalidad, raizObjetivo });
            base = {
                id: `gen_${canonicalIdFromRoman(roman)}`,
                nombre: roman,
                roman,
                familia: fam,
                nivel: lvl
            };
            origen = "generador";
        } else {
            const pool = filtrarCatalogo({ nivel, familia });
            const catalogo = obtenerCatalogoCompleto();
            base = progressionId
                ? (catalogo.find((p) => p.id === progressionId) || elegir(pool.length ? pool : catalogo))
                : elegir(pool.length ? pool : catalogo);
            roman = base.roman;
        }

        const acordes = resolverAcordes(roman, tonalidad);
        const bajoLinea = acordes.map((a) => String(a.bajo || "").replace(/\d+/g, ""));
        const analisis = analizarFunciones(roman);

        return {
            id: `prog_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            nombre: base.nombre,
            tonalidad,
            acordes,
            respuestaCorrecta: base.id,
            progStr: roman,
            familia: base.familia,
            nivel: base.nivel,
            fuente: origen,
            color,
            raizObjetivo: normalizarClaseNota(raizObjetivo || ""),
            bajoLinea,
            analisis,
            objetivoPedagogico: objetivoPedagogico(base.familia, base.nivel, origen)
        };
    }

    function generarOpcionesProcedurales(ejercicioActual, maxOptions = 4) {
        const romanBase = normalizarRoman(ejercicioActual.progStr);
        const tokens = romanBase.split("-").map((s) => s.trim()).filter(Boolean);
        const alternativas = ["ii", "IV", "V", "vi", "iii", "V/V", "bII6"];
        const opts = [];
        const vistos = new Set([ejercicioActual.respuestaCorrecta]);

        for (let i = 1; i < tokens.length - 1 && opts.length < maxOptions - 1; i++) {
            for (const alt of alternativas) {
                if (alt === tokens[i]) continue;
                const copia = [...tokens];
                copia[i] = alt;
                const roman = copia.join(" - ");
                const id = `gen_${canonicalIdFromRoman(roman)}`;
                if (vistos.has(id)) continue;
                vistos.add(id);
                opts.push({ id, nombre: roman });
                break;
            }
        }

        while (opts.length < maxOptions - 1) {
            const roman = generarProcedural({
                longitud: tokens.length,
                nivel: ejercicioActual.nivel,
                familia: ejercicioActual.familia,
                color: ejercicioActual.color || "diatonico"
            });
            const id = `gen_${canonicalIdFromRoman(roman)}`;
            if (vistos.has(id)) continue;
            vistos.add(id);
            opts.push({ id, nombre: roman });
        }

        opts.push({ id: ejercicioActual.respuestaCorrecta, nombre: ejercicioActual.nombre });
        return opts.sort(() => Math.random() - 0.5);
    }

    function generarOpciones(ejercicioActual, { nivel = null, familia = null, maxOptions = 4 } = {}) {
        if (ejercicioActual?.fuente === "generador") {
            return generarOpcionesProcedurales(ejercicioActual, maxOptions);
        }

        const candidatas = filtrarCatalogo({ nivel, familia })
            .filter((p) => p.id !== ejercicioActual.respuestaCorrecta);

        candidatas.sort(() => Math.random() - 0.5);
        const incorrectas = candidatas.slice(0, Math.max(1, maxOptions - 1));
        const opciones = [
            ...incorrectas.map((p) => ({ id: p.id, nombre: p.nombre })),
            { id: ejercicioActual.respuestaCorrecta, nombre: ejercicioActual.nombre }
        ];
        return opciones.sort(() => Math.random() - 0.5);
    }

    function generarOpcionesFamilia(ejercicioActual, maxOptions = 4) {
        const correcta = ejercicioActual?.familia;
        const base = [...FAMILIAS].filter((f) => f !== correcta).sort(() => Math.random() - 0.5);
        const opciones = base.slice(0, Math.max(1, maxOptions - 1)).map((familia) => ({
            id: familia,
            nombre: familia
        }));
        if (correcta) {
            opciones.push({ id: correcta, nombre: correcta });
        }
        return opciones.sort(() => Math.random() - 0.5);
    }

    function listar({ nivel = null, familia = null } = {}) {
        return filtrarCatalogo({ nivel, familia }).map((p) => ({ id: p.id, nombre: p.nombre }));
    }

    return {
        TONALIDADES_MAYORES,
        NIVELES,
        FAMILIAS,
        COLORES,
        RAICES,
        TOKENS_POR_NIVEL,
        CATALOGO,
        generar: construirProgresion,
        construirDesdeRoman,
        generarEspacioProgresiones,
        generarOpciones,
        generarOpcionesFamilia,
        listar
    };
})();

if (typeof window !== "undefined") {
    window.GeneradorProgresiones = GeneradorProgresiones;
}
