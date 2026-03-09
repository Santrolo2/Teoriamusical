// ============================================
// FACHADA DEL NÚCLEO TEÓRICO
// Punto único de acceso a la teoría musical
// ============================================

const TEORIA = (() => {

"use strict";

return {

    // Entidades básicas
    notas: NOTAS,
    intervalos: INTERVALOS,
    escalas: ESCALAS,

    // Sistema armónico
    acordes: ACORDES,
    tiposAcorde: TIPOS_ACORDE,
    inversiones: INVERSIONES,

    // Contexto tonal
    tonalidades: TONALIDADES

};

})();

if (typeof window !== "undefined") {
    window.TEORIA = TEORIA;
}