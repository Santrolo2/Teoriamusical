// ============================================
// MODULO: TIPOS DE ACORDE
// Define estructuras interválicas de acordes
// ============================================

const TIPOS_ACORDE = (() => {

"use strict";


// --------------------------------------------
// DEFINICION DE TIPOS
// intervalos medidos desde la raíz (semitonos)
// --------------------------------------------

const TIPOS = {

    major: {
        id: "major",
        nombre: "Tríada Mayor",
        simbolo: "",
        intervalos: [0,4,7],
        grados: [1, 3, 5],
        cardinalidad: 3
    },

    minor: {
        id: "minor",
        nombre: "Tríada Menor",
        simbolo: "m",
        intervalos: [0,3,7],
        grados: [1, 3, 5],
        cardinalidad: 3
    },

    augmented: {
        id: "augmented",
        nombre: "Tríada Aumentada",
        simbolo: "+",
        intervalos: [0,4,8],
        grados: [1, 3, 5],
        cardinalidad: 3
    },

    diminished: {
        id: "diminished",
        nombre: "Tríada Disminuida",
        simbolo: "°",
        intervalos: [0,3,6],
        grados: [1, 3, 5],
        cardinalidad: 3
    },

    sus2: {
        id: "sus2",
        nombre: "Suspendido 2",
        simbolo: "sus2",
        intervalos: [0,2,7],
        grados: [1, 2, 5],
        cardinalidad: 3
    },

    sus4: {
        id: "sus4",
        nombre: "Suspendido 4",
        simbolo: "sus4",
        intervalos: [0,5,7],
        grados: [1, 4, 5],
        cardinalidad: 3
    },

    dom7: {
        id: "dom7",
        nombre: "Séptima Dominante",
        simbolo: "7",
        intervalos: [0,4,7,10],
        grados: [1, 3, 5, 7],
        cardinalidad: 4
    },

    maj7: {
        id: "maj7",
        nombre: "Séptima Mayor",
        simbolo: "maj7",
        intervalos: [0,4,7,11],
        grados: [1, 3, 5, 7],
        cardinalidad: 4
    },

    min7: {
        id: "min7",
        nombre: "Séptima Menor",
        simbolo: "m7",
        intervalos: [0,3,7,10],
        grados: [1, 3, 5, 7],
        cardinalidad: 4
    },

    halfDim7: {
        id: "halfDim7",
        nombre: "Semidisminuido 7",
        simbolo: "ø7",
        intervalos: [0,3,6,10],
        grados: [1, 3, 5, 7],
        cardinalidad: 4
    },

    dim7: {
        id: "dim7",
        nombre: "Disminuido 7",
        simbolo: "°7",
        intervalos: [0,3,6,9],
        grados: [1, 3, 5, 7],
        cardinalidad: 4
    },
    
    minMaj7: {
        id: "minMaj7",
        nombre: "Menor Mayor Séptima",
        simbolo: "mM7",
        intervalos: [0,3,7,11],
        grados: [1, 3, 5, 7],
        cardinalidad: 4
    }

};


// --------------------------------------------
// OBTENER TIPO
// --------------------------------------------

function obtener(id){

const tipo = TIPOS[id];

if(!tipo){
throw new Error("Tipo de acorde no definido: " + id);
}

return tipo;

}


// --------------------------------------------
// LISTAR TIPOS
// --------------------------------------------

function listar(){

return Object.values(TIPOS);

}


// --------------------------------------------
// EXPORT
// --------------------------------------------

return {

obtener,
listar

};

})();

if (typeof window !== "undefined") {
    window.TIPOS_ACORDE = TIPOS_ACORDE;
}