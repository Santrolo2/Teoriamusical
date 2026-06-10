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
    tonalidades: TONALIDADES,
    armonia: typeof ARMONIA !== "undefined" ? ARMONIA : (typeof window !== "undefined" ? window.ARMONIA : null),
    progresionesData: typeof PROGRESIONES_DATA !== "undefined" ? PROGRESIONES_DATA : (typeof window !== "undefined" ? window.PROGRESIONES_DATA : null)

};

})();

if (typeof window !== "undefined") {
    window.TEORIA = TEORIA;
}