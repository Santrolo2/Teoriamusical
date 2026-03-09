// ============================================
// MODULO: FUNCIONES TONALES
// Analisis y roles armónicos en la tonalidad
// ============================================

const FUNCIONES_TONALES = (() => {

"use strict";

// --------------------------------------------
// ROMAN NUMERALS BASE
// --------------------------------------------

const ROMAN_MAYORES = ["I", "II", "III", "IV", "V", "VI", "VII"];
const ROMAN_MENORES = ["i", "ii", "iii", "iv", "v", "vi", "vii"];

// --------------------------------------------
// IDENTIFICAR GRADO EN ESCALA
// --------------------------------------------

function encontrarGrado(raizAcorde, escalaArray) {
    const raizLiteral = NOTAS.parse(raizAcorde);
    
    // Tratamos de buscar coincidencia exacta
    for (let i = 0; i < escalaArray.length; i++) {
        if (escalaArray[i].letter === raizLiteral.letter && 
            escalaArray[i].accidental === raizLiteral.accidental) {
            return i + 1; // 1-indexed
        }
    }
    
    // Si no es diatonico, intentamos por enarmonía para devolver el grado mas cercano (cromático)
    for (let i = 0; i < escalaArray.length; i++) {
        const notaDiatonica = NOTAS.crear(escalaArray[i].letter + escalaArray[i].accidental);
        const notaAcorde = NOTAS.crear(raizAcorde);
        if (NOTAS.equalsEnharmonic(notaDiatonica, notaAcorde)) {
            return i + 1; // Grado enarmónico
        }
    }
    
    return null; // Acorde totalmente fuera de tonalidad
}

// --------------------------------------------
// CONVERTIR TIPO A SIMBOLO ROMANO
// --------------------------------------------

function formatearRomano(gradoNum, tipoId) {
    if (!gradoNum) return "?";
    
    const index = gradoNum - 1;
    let base = "";
    let sufijo = "";
    
    // Determinar si es mayúscula o minúscula según el tipo
    switch (tipoId) {
        case "major":
        case "augmented":
        case "dom7":
        case "maj7":
        case "sus2":
        case "sus4":
            base = ROMAN_MAYORES[index];
            break;
        case "minor":
        case "diminished":
        case "min7":
        case "dim7":
        case "halfDim7":
        case "minMaj7":
            base = ROMAN_MENORES[index];
            break;
        default:
            base = ROMAN_MAYORES[index];
    }
    
    // Agregar sufijos
    switch (tipoId) {
        case "augmented": sufijo = "+"; break;
        case "diminished": sufijo = "°"; break;
        case "dom7": sufijo = "7"; break;
        case "maj7": sufijo = "maj7"; break;
        case "min7": sufijo = "7"; break;
        case "dim7": sufijo = "°7"; break;
        case "halfDim7": sufijo = "ø7"; break;
        case "minMaj7": sufijo = "M7"; break;
        case "sus2": sufijo = "sus2"; break;
        case "sus4": sufijo = "sus4"; break;
    }
    
    return base + sufijo;
}

// --------------------------------------------
// ANALISIS ROMANO DE UN ACORDE
// --------------------------------------------

function analizarRomano(acordeObj, tonalidadObj) {
    if (!acordeObj || !tonalidadObj) return "?";
    
    const grado = encontrarGrado(acordeObj.raiz, tonalidadObj.escala);
    
    if (!grado) return "b" + formatearRomano(encontrarGrado(NOTAS.transpose(NOTAS.parse(acordeObj.raiz), 1).letter, tonalidadObj.escala), acordeObj.tipo) || "?"; 
    // Basic fallback for borrowed chords
    
    return formatearRomano(grado, acordeObj.tipo);
}

// --------------------------------------------
// DETERMINAR FUNCION ARMONICA
// --------------------------------------------

function funcionArmonica(gradoNum, tipoTonalidad) {
    if (!gradoNum) return "Desconocida";
    
    if (tipoTonalidad === "major") {
        switch (gradoNum) {
            case 1: case 3: case 6: return "Tónica";
            case 2: case 4: return "Subdominante";
            case 5: case 7: return "Dominante";
            default: return "Cromática";
        }
    } else {
        switch (gradoNum) {
            case 1: case 3: return "Tónica";
            case 2: case 4: case 6: return "Subdominante";
            case 5: case 7: return "Dominante";
            default: return "Cromática";
        }
    }
}

// --------------------------------------------
// EXPORT
// --------------------------------------------

return {
    analizarRomano,
    funcionArmonica,
    encontrarGrado
};

})();

if (typeof window !== "undefined") {
    window.FUNCIONES_TONALES = FUNCIONES_TONALES;
}