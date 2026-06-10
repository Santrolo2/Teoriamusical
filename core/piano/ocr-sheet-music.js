// ============================================
// MODULO: OCR/OMR PARA PARTITURAS DE PIANO
// Flujo recomendado: Audiveris -> Gemini -> Tesseract
// ============================================

const OCR_SHEET_MUSIC = (() => {
    "use strict";

    let tesseractWorker = null;
    let initialized = false;

    const PATRONES_NOTAS = {
        notaCompleta: /([A-G])(#|b|♯|♭)?(\d+)/g,
        notaIngles: /([A-G])(sharp|flat)?(\d+)/gi
    };

    async function init() {
        initialized = true;
        return Promise.resolve();
    }

    function getApiBases() {
        const custom = (typeof window !== "undefined" && window.MAESTRO_API_URL)
            ? [window.MAESTRO_API_URL]
            : [];
        // Explicitly use port 3001 where Express serves the API.
        // DO NOT use sameOrigin - the static file server on port 5501/8080 has no API.
        const localhost = "http://localhost:3001";
        return [...custom, localhost].filter(Boolean);
    }

    function toDataUrl(image) {
        if (!image || typeof image !== "string") return "";
        if (image.startsWith("data:image")) return image;
        return `data:image/png;base64,${image}`;
    }

    function normalizarErrorOmr(msg = "") {
        const texto = String(msg || "");
        if (/ENOENT/i.test(texto) && /oemer/i.test(texto)) {
            return "Oemer no está instalado en pip o en PATH.";
        }
        if (/GEMINI_API_KEY/i.test(texto)) {
            return "GEMINI_API_KEY no esta configurada en el backend.";
        }
        return texto || "Error desconocido consultando OMR backend.";
    }

    async function callBackendEndpoint(base, route, payload) {
        const response = await fetch(`${base.replace(/\/$/, "")}${route}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data?.detalle || data?.mensaje || data?.error || `OMR backend error (${response.status})`);
        }

        if (!Array.isArray(data?.notas)) {
            throw new Error("Respuesta OMR invalida.");
        }

        return {
            textoOriginal: data.textoOriginal || "",
            textoLimpio: data.textoLimpio || "",
            notas: data.notas,
            claves: data.claves || [],
            compas: data.compas || null,
            confianza: Number(data.confianza ?? 80),
            motor: data.motor || "omr-backend"
        };
    }

    async function callOmrBackend(image) {
        const payload = {
            imageBase64: toDataUrl(image)
        };

        const bases = getApiBases();
        const errores = [];

        for (const base of bases) {
            try {
                return await callBackendEndpoint(base, "/api/omr/analyze", payload);
            } catch (error) {
                errores.push(`oemer: ${normalizarErrorOmr(error?.message || error)}`);
            }
        }

        throw new Error(
            errores.length
                ? `No se pudo usar Oemer (${errores.join(" | ")})`
                : "No se pudo conectar al backend OMR."
        );
    }

    async function ensureTesseract() {
        if (tesseractWorker) return;
        if (typeof Tesseract === "undefined") {
            await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js");
        }
        tesseractWorker = await Tesseract.createWorker("eng", 1, {
            logger: (m) => console.log("OCR:", m)
        });
    }

    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async function procesarConTesseract(imagen, opciones = {}) {
        await ensureTesseract();

        const {
            detectarNotas = true,
            detectarClaves = true,
            detectarCompas = true
        } = opciones;

        const resultado = await tesseractWorker.recognize(imagen);
        const texto = resultado.data.text;

        const analisis = {
            textoOriginal: texto,
            textoLimpio: limpiarTexto(texto),
            notas: [],
            claves: [],
            compas: null,
            confianza: Number(resultado.data.confidence || 0),
            motor: "tesseract"
        };

        if (detectarNotas) analisis.notas = extraerNotas(analisis.textoLimpio);
        if (detectarClaves) analisis.claves = detectarClavesMusicales(analisis.textoLimpio);
        if (detectarCompas) analisis.compas = detectarCompasMusical(analisis.textoLimpio);

        return analisis;
    }

    async function procesarImagen(imagen, opciones = {}) {
        await init();

        // Only Oemer is supported — no Gemini, no Tesseract fallback
        return await callOmrBackend(imagen);
    }

    function limpiarTexto(texto) {
        return String(texto || "")
            .replace(/\s+/g, " ")
            .replace(/[^\w\s#b♯♭\d\-\/]/g, "")
            .trim();
    }

    function extraerNotas(texto) {
        const notas = [];
        const patrones = [PATRONES_NOTAS.notaCompleta, PATRONES_NOTAS.notaIngles];

        for (const patron of patrones) {
            patron.lastIndex = 0;
            let match;
            while ((match = patron.exec(texto)) !== null) {
                const [, letra, accidental, octava] = match;
                let accidentalNormalizado = "";

                if (accidental) {
                    if (accidental.includes("#") || accidental.includes("♯")) accidentalNormalizado = "#";
                    if (accidental.includes("b") || accidental.includes("♭")) accidentalNormalizado = "b";
                }

                const octavaNum = octava ? parseInt(octava, 10) : 4;
                notas.push({
                    nota: letra + accidentalNormalizado + octavaNum,
                    letra,
                    accidental: accidentalNormalizado,
                    octava: octavaNum,
                    confianza: 0.7
                });
            }
        }

        return notas;
    }

    function detectarClavesMusicales(texto) {
        const claves = [];
        const lower = String(texto || "").toLowerCase();
        if (lower.includes("treble") || lower.includes("sol")) claves.push({ tipo: "treble", nombre: "Clave de Sol" });
        if (lower.includes("bass") || lower.includes("fa")) claves.push({ tipo: "bass", nombre: "Clave de Fa" });
        return claves;
    }

    function detectarCompasMusical(texto) {
        const match = String(texto || "").match(/(\d+)\/(\d+)/);
        if (!match) return null;
        return {
            numerador: parseInt(match[1], 10),
            denominador: parseInt(match[2], 10),
            descripcion: `${match[1]}/${match[2]}`
        };
    }

    function notasAMidi(notas) {
        const NOTAS_MIDI = {
            C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3,
            E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8,
            Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11
        };

        return (notas || []).map((nota) => {
            const semitonos = NOTAS_MIDI[nota.letra + (nota.accidental || "")];
            const midi = (Number(nota.octava || 4) + 1) * 12 + (Number.isFinite(semitonos) ? semitonos : 0);
            return { ...nota, midi };
        });
    }

    function analizarEstructura(analisis) {
        const estructura = {
            tipo: "desconocido",
            numeroNotas: analisis.notas.length,
            rango: null,
            sugerencias: []
        };

        if (!analisis.notas.length) return estructura;

        const notasMidi = notasAMidi(analisis.notas);
        const minMidi = Math.min(...notasMidi.map((n) => n.midi));
        const maxMidi = Math.max(...notasMidi.map((n) => n.midi));

        estructura.rango = {
            notaMin: notasMidi.find((n) => n.midi === minMidi)?.nota,
            notaMax: notasMidi.find((n) => n.midi === maxMidi)?.nota,
            intervalo: maxMidi - minMidi
        };

        if (analisis.notas.length <= 5) {
            estructura.tipo = "acorde";
            estructura.sugerencias.push("Parece ser un acorde o pasaje corto.");
        } else if (analisis.notas.length <= 12) {
            estructura.tipo = "frase";
            estructura.sugerencias.push("Parece ser una frase musical corta.");
        } else {
            estructura.tipo = "pasaje";
            estructura.sugerencias.push("Parece ser un pasaje mas extenso.");
        }

        return estructura;
    }

    function generarSugerencias(analisis, estructura) {
        const sugerencias = [];

        if (!analisis.claves.length) {
            sugerencias.push("No se detectaron claves musicales con claridad.");
        }

        if (!analisis.notas.length) {
            sugerencias.push("No se detectaron notas. Intenta con una imagen mas clara o con mejor contraste.");
        } else {
            sugerencias.push(
                `Motor usado: ${analisis.motor}. Se detectaron ${analisis.notas.length} notas con ${Number(analisis.confianza || 0).toFixed(1)}% de confianza.`
            );
            if (estructura.rango?.notaMin && estructura.rango?.notaMax) {
                sugerencias.push(`Rango: ${estructura.rango.notaMin} a ${estructura.rango.notaMax}.`);
            }
        }

        if (analisis.motor === "tesseract") {
            if (analisis.fallbackReason) {
                sugerencias.push(`Motivo del fallback: ${analisis.fallbackReason}`);
            }
            sugerencias.push("Para mayor precisión usa Oemer o configura Gemini en el backend.");
        }

        return sugerencias;
    }

    async function analizarPartitura(imagen, opciones = {}) {
        const analisis = await procesarImagen(imagen, opciones);
        const estructura = analizarEstructura(analisis);
        const sugerencias = generarSugerencias(analisis, estructura);

        return {
            analisis,
            estructura,
            sugerencias,
            notasMidi: notasAMidi(analisis.notas)
        };
    }

    function notasAAcorde(notas) {
        if (!notas || !notas.length) return null;
        const notasOrdenadas = [...notas].sort((a, b) => a.midi - b.midi);
        return {
            notas: notasOrdenadas.map((n) => n.nota),
            raiz: notasOrdenadas[0].nota,
            tipo: "desconocido",
            inversion: 0,
            origen: "ocr"
        };
    }

    return {
        init,
        procesarImagen,
        analizarPartitura,
        notasAMidi,
        notasAAcorde,
        extraerNotas,
        limpiarTexto
    };
})();

if (typeof window !== "undefined") {
    window.OCR_SHEET_MUSIC = OCR_SHEET_MUSIC;
}
