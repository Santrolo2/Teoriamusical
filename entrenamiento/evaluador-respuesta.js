const EvaluadorRespuesta = (() => {
    "use strict";

    function normalizarTipo(tipo) {
        const mapa = {
            major: "major",
            minor: "minor",
            diminished: "diminished",
            augmented: "augmented",
            sus2: "sus2",
            sus4: "sus4",
            maj7: "maj7",
            dom7: "dom7",
            min7: "min7",
            halfDim7: "halfDim7",
            dim7: "dim7",
            minMaj7: "minMaj7",

            mayor: "major",
            menor: "minor",
            disminuido: "diminished",
            aumentado: "augmented",
            dominant7: "dom7",
            major7: "maj7",
            minor7: "min7",
            halfDiminished7: "halfDim7",
            diminished7: "dim7"
        };

        return mapa[tipo] || tipo || null;
    }

    function limpiarNota(nota) {
        if (!nota || typeof nota !== "string") return null;
        const parsed = NOTAS.parse(nota);
        return parsed.letter + parsed.accidental;
    }

    function normalizarNotas(lista) {
        if (!Array.isArray(lista)) return [];
        return lista.map(limpiarNota).filter(Boolean);
    }

    function normalizarAcorde(acorde) {
        if (!acorde) {
            return {
                nombre: null,
                fundamental: null,
                tipo: null,
                tipoId: null,
                inversion: null,
                notas: [],
                notasBase: [],
                gradoRomano: null,
                tonalidadId: null,
                bajo: null
            };
        }

        const fundamental = acorde.raiz || acorde.fundamental || null;
        const tipoId = normalizarTipo(acorde.tipo || acorde.tipoId || null);

        return {
            nombre: acorde.nombre || null,
            fundamental,
            tipo: tipoId,
            tipoId,
            inversion: Number.isInteger(acorde.inversion) ? acorde.inversion : null,
            notas: normalizarNotas(acorde.notas || []),
            notasBase: normalizarNotas(acorde.notasBase || acorde.notas || []),
            gradoRomano: acorde.gradoRomano || null,
            tonalidadId: acorde.tonalidadId || acorde.tonalidad || null,
            bajo: limpiarNota(acorde.bajo || (acorde.notas && acorde.notas[0]) || null)
        };
    }

    function contarCoincidenciasNotas(esperadas, respuesta) {
        const usadas = new Array(respuesta.length).fill(false);
        let total = 0;

        for (const notaEsperada of esperadas) {
            for (let i = 0; i < respuesta.length; i++) {
                if (!usadas[i] && notaEsperada === respuesta[i]) {
                    usadas[i] = true;
                    total++;
                    break;
                }
            }
        }

        return total;
    }

    function evaluar(acordeEsperado, respuestaUsuario) {
        const esperado = normalizarAcorde(acordeEsperado);
        const respuesta = normalizarAcorde(respuestaUsuario);

        const coincidencias = {
            fundamental: esperado.fundamental === respuesta.fundamental,
            tipo: esperado.tipoId === respuesta.tipoId,
            inversion: esperado.inversion === respuesta.inversion,
            gradoRomano: esperado.gradoRomano && respuesta.gradoRomano
                ? esperado.gradoRomano === respuesta.gradoRomano
                : false,
            notas: contarCoincidenciasNotas(esperado.notasBase, respuesta.notasBase)
        };

        const correcto =
            coincidencias.fundamental &&
            coincidencias.tipo &&
            coincidencias.inversion;

        return {
            correcto,
            esperado,
            respuesta,
            coincidencias
        };
    }

    return {
        evaluar,
        normalizarAcorde
    };
})();