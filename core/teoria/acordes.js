// ============================================
// MODULO: ACORDES
// Construcción ortográfica de acordes
// ============================================

const ACORDES = (() => {

"use strict";


// --------------------------------------------
// HELPERS
// --------------------------------------------

function rotar(array, pasos){

const n = pasos % array.length;

return array.slice(n).concat(array.slice(0,n));

}


// --------------------------------------------
// LETRA POR GRADO
// --------------------------------------------

function letraPorGrado(letraBase, grado){

const letras = ["C","D","E","F","G","A","B"];

const base = letras.indexOf(letraBase);

const index = (base + (grado-1)) % 7;

return letras[index];

}


// --------------------------------------------
// CALCULAR ACCIDENTAL PARA SEMITONO OBJETIVO
// --------------------------------------------

function calcularAccidental(letraObjetivo, semitonoObjetivo){

const natural = NOTAS.pitchClass({
letter: letraObjetivo,
accidental:"",
octave:null
});

let diff = (semitonoObjetivo - natural + 12) % 12;

if(diff === 0) return "";
if(diff === 1) return "#";
if(diff === 2) return "##";
if(diff === 11) return "b";
if(diff === 10) return "bb";

throw new Error("No se puede construir nota ortográfica");

}


// --------------------------------------------
// CONSTRUIR NOTA ORTOGRAFICA
// --------------------------------------------

function construirNota(letraObjetivo, semitonoObjetivo){

const accidental = calcularAccidental(letraObjetivo,semitonoObjetivo);

return letraObjetivo + accidental;

}


// --------------------------------------------
// CONSTRUIR NOTAS DEL ACORDE
// --------------------------------------------

function construirNotas(raiz,tipo){

const tipoAcorde = TIPOS_ACORDE.obtener(tipo);

const datosRaiz = NOTAS.parse(raiz);

const semitonoRaiz = NOTAS.pitchClass(datosRaiz);

const notas = [];

// Fallback to strict tertian harmony if grados are not defined (for backwards compat or custom chords)
const gradosFallback = [1, 3, 5, 7, 9, 11, 13];

for(let i=0;i<tipoAcorde.intervalos.length;i++){

const intervalo = tipoAcorde.intervalos[i];

const grado = (tipoAcorde.grados && tipoAcorde.grados[i]) ? tipoAcorde.grados[i] : gradosFallback[i];

const letraObjetivo = letraPorGrado(datosRaiz.letter,grado);

const semitonoObjetivo = (semitonoRaiz + intervalo) % 12;

const nota = construirNota(letraObjetivo,semitonoObjetivo);

notas.push(nota);

}

return notas;

}


// --------------------------------------------
// APLICAR INVERSION
// --------------------------------------------

function aplicarInversion(notas,inversion){

if(inversion === 0) return notas;

return rotar(notas,inversion);

}


// --------------------------------------------
// ASIGNAR OCTAVAS
// --------------------------------------------

function asignarOctavas(notas,octavaBase=4){

const resultado = [];

let octava = octavaBase;

let semAnterior = null;

for(const nota of notas){

const pc = NOTAS.pitchClass(NOTAS.parse(nota));

if(semAnterior !== null && pc <= semAnterior){
octava++;
}

resultado.push(nota + octava);

semAnterior = pc;

}

return resultado;

}


// --------------------------------------------
// NOMBRE VISIBLE
// --------------------------------------------

function nombreVisible(raiz,tipo){

const t = TIPOS_ACORDE.obtener(tipo);

return raiz + t.simbolo;

}


// --------------------------------------------
// CONSTRUIR ACORDE COMPLETO
// --------------------------------------------

function construir(raiz,tipo,inversion=0,octavaBase=4){

const tipoAcorde = TIPOS_ACORDE.obtener(tipo);

if(inversion >= tipoAcorde.cardinalidad){
throw new Error("Inversión inválida");
}

const notasBase = construirNotas(raiz,tipo);

const notasInvertidas = aplicarInversion(notasBase,inversion);

const notas = asignarOctavas(notasInvertidas,octavaBase);

return {

raiz,
tipo,
inversion,

nombre: nombreVisible(raiz,tipo),

notasBase,
notas,

bajo: notas[0]

};

}


// --------------------------------------------
// EXPORT
// --------------------------------------------

return {

construir,
construirNotas,
aplicarInversion

};

})();

if (typeof window !== "undefined") {
    window.ACORDES = ACORDES;
}