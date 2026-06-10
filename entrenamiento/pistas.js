const Pistas = (() => {
"use strict";

function generar(acordeCorrecto, respuestaUsuario, diagnostico) {

    if (!diagnostico || diagnostico.correcto) {
        return null;
    }

    const categoria = diagnostico.categoriaPrincipal;

    if (categoria === "fundamental") {
        return pistaFundamental(acordeCorrecto);
    }

    if (categoria === "calidad") {
        return pistaTipo(acordeCorrecto);
    }

    if (categoria === "inversion") {
        return pistaInversion(acordeCorrecto);
    }

    if (categoria === "lectura_visual_parcial") {
        return pistaNotas(acordeCorrecto);
    }

    return pistaGeneral(acordeCorrecto);
}

function pistaFundamental(acorde) {

    if (!acorde || !acorde.raiz) return "Observa la nota mas grave.";

    return `La fundamental del acorde es ${acorde.raiz}.`;
}

function pistaTipo(acorde) {

    if (!acorde || !acorde.notasBase) {
        return "Observa la estructura de intervalos del acorde.";
    }

    const notas = acorde.notasBase.join(" - ");

    return `Las notas del acorde son: ${notas}.`;
}

function pistaInversion(acorde) {

    if (!acorde || !acorde.bajo) {
        return "Observa que nota esta en el bajo.";
    }

    return `La nota mas grave del acorde es ${acorde.bajo}.`;
}

function pistaNotas(acorde) {

    if (!acorde || !acorde.notasBase) {
        return "Revisa cuidadosamente las notas del acorde.";
    }

    return `Las notas correctas incluyen: ${acorde.notasBase.join(", ")}`;
}

function pistaGeneral(acorde) {

    if (!acorde) {
        return "Observa cuidadosamente la disposicion de las notas.";
    }

    return "Analiza la raiz, la calidad del acorde y la nota del bajo.";
}

function generarProgresion(contexto = {}) {
    const ejercicio = contexto.ejercicio || {};
    const etapa = contexto.etapa || "familia";
    const familia = ejercicio.familia || "mixta";
    const tonalidad = ejercicio.tonalidad || "C";
    const progStr = ejercicio.progStr || "";

    if (etapa === "familia") {
        const mapaFamilia = {
            cadencia: "Busca una sensacion clara de cierre tonal al final del recorrido.",
            "predominante-dominante": "Escucha el paso de preparacion hacia tension dominante y su resolucion.",
            ciclo: "Identifica el encadenamiento de quintas o una direccion continua por grados funcionales.",
            pop: "Prioriza el contorno global y las repeticiones de patron mas que el detalle cromatico.",
            mixta: "Combina escucha de funcion y color: hay mezcla de recursos diatonicos y tension puntual."
        };
        return mapaFamilia[familia] || "Escucha primero la funcion global antes de intentar nombrar la progresion exacta.";
    }

    const primerGrado = progStr ? progStr.split("-")[0].trim() : "I";
    return `En tonalidad ${tonalidad}, la progresion inicia en ${primerGrado}. Compara el punto de llegada para distinguir entre opciones cercanas.`;
}

return {
    generar,
    generarProgresion
};

})();

if (typeof window !== "undefined") {
    window.Pistas = Pistas;
}
