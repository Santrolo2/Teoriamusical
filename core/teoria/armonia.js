/**
 * MODULO: ARMONIA
 * Biblioteca de progresiones y resolución de grados romanos.
 */
const ARMONIA = (() => {
    "use strict";

    // Los datos de progresiones han sido movidos a progresiones-data.js
    /**
     * Resuelve un grado romano a un objeto de construcción de acorde
     * @param {string} gradoRomano Ej: "V/V", "♭VI", "vii°", "ii"
     * @param {object} tonalidadObj Objeto tonalidad de TEORIA
     */
    function resolverGrado(gradoStr, tonalidadObj) {
        // Limpiar strings
        const input = gradoStr.trim().replace("–", "-").replace("—", "-");
        
        // Manejar dominantes secundarias V/V, etc.
        if (input.includes("/")) {
            const [target, basis] = input.split("/");
            const basisChord = resolverGrado(basis, tonalidadObj);
            // Se asume que la dominante secundaria se resuelve sobre una tónica mayor temporal
            const basisTonalidad = TONALIDADES.obtener(basisChord.raiz, "major");
            return resolverGrado(target, basisTonalidad);
        }

        // Grados base
        const grados = {
            "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7,
            "i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6, "vii": 7
        };

        // Identificar alteracion ♭ o #
        let offset = 0;
        let cleanStr = input;
        if (input.startsWith("♭") || input.startsWith("b")) {
            offset = -1;
            cleanStr = input.substring(1);
        } else if (input.startsWith("#")) {
            offset = 1;
            cleanStr = input.substring(1);
        }

        // Identificar grado numérico
        let gradoNumerico = 0;
        let isMinor = cleanStr === cleanStr.toLowerCase();
        
        // Buscar grado en el string (ignorando simbolos adicionales por ahora)
        for (let g in grados) {
            if (cleanStr.startsWith(g)) {
                gradoNumerico = grados[g];
                cleanStr = cleanStr.substring(g.length);
                break;
            }
        }

        if (gradoNumerico === 0) throw new Error("No se pudo identificar el grado: " + gradoStr);

        // Obtener la nota de la escala
        const escala = tonalidadObj.escala;
        const notaDiatonica = escala[gradoNumerico - 1];
        
        // Aplicar offset cromático si existe (bVI, etc)
        let raiz = notaDiatonica.letter + notaDiatonica.accidental;
        if (offset !== 0) {
            const tempNota = NOTAS.parse(raiz);
            tempNota.octave = 4; // Octava temporal para el cálculo MIDI
            const alterada = NOTAS.transpose(tempNota, offset);
            raiz = alterada.letter + alterada.accidental;
        }

        // Determinar tipo de acorde
        let tipo = isMinor ? "minor" : "major";
        
        // Ajustar por simbolos °, ø7, 7, maj7, 6
        if (cleanStr.includes("°")) tipo = "diminished";
        if (cleanStr.includes("ø7")) tipo = "halfDim7";
        if (cleanStr.includes("7")) {
            if (tipo === "major") tipo = "dom7";
            if (tipo === "minor") tipo = "min7";
            if (tipo === "diminished") tipo = "dim7";
        }
        if (cleanStr.includes("maj7")) tipo = "maj7";

        return { raiz, tipo };
    }

    /**
     * Resuelve una progresión completa
     */
    function resolverProgresion(progStr, tonalidad, tipo = "major") {
        const tObj = TONALIDADES.obtener(tonalidad, tipo);
        const grados = progStr.split(/[–—-]/).map(s => s.trim());
        
        return grados.map(g => {
            const res = resolverGrado(g, tObj);
            // Inversiones simples si el string termina en 6 o 64 (muy básico por ahora)
            let inversion = 0;
            if (g.endsWith("6")) inversion = 1;
            if (g.endsWith("64")) inversion = 2;
            
            return ACORDES.construir(res.raiz, res.tipo, inversion);
        });
    }

    return {
        resolverProgresion
    };

})();

if (typeof window !== "undefined") {
    window.ARMONIA = ARMONIA;
}
