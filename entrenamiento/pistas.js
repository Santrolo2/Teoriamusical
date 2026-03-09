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

    if (!acorde || !acorde.raiz) return "Observa la nota más grave.";

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
        return "Observa qué nota está en el bajo.";
    }

    return `La nota más grave del acorde es ${acorde.bajo}.`;
}

function pistaNotas(acorde) {

    if (!acorde || !acorde.notasBase) {
        return "Revisa cuidadosamente las notas del acorde.";
    }

    return `Las notas correctas incluyen: ${acorde.notasBase.join(", ")}`;
}

function pistaGeneral(acorde) {

    if (!acorde) {
        return "Observa cuidadosamente la disposición de las notas.";
    }

    return "Analiza la raíz, la calidad del acorde y la nota del bajo.";
}

return {
    generar
};

})();

if (typeof window !== "undefined") {
    window.Pistas = Pistas;
}