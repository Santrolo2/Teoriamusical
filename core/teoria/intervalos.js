// ============================================
// MODULO: INTERVALOS
// Relaciones entre notas
// ============================================

const INTERVALOS = (() => {

"use strict";

// --------------------------------------------
// TABLAS TEORICAS
// --------------------------------------------

// semitonos esperados para intervalos mayores o justos
const BASE_INTERVAL_SEMITONES = {
1:0,
2:2,
3:4,
4:5,
5:7,
6:9,
7:11,
8:12
};

// intervalos perfectos
const PERFECT_INTERVALS = [1,4,5,8];


// --------------------------------------------
// HELPERS
// --------------------------------------------

function mod(n,m){
return ((n % m) + m) % m;
}


// --------------------------------------------
// CALCULO NUMERO DIATONICO
// --------------------------------------------

function numeroDiatonico(nota1,nota2){

const a = NOTAS.crear(nota1);
const b = NOTAS.crear(nota2);

let diff = b.diatonicIndex - a.diatonicIndex;

if(diff < 0){
diff += 7;
}

return diff + 1;

}


// --------------------------------------------
// SEMITONOS ENTRE NOTAS
// --------------------------------------------

function semitonos(nota1,nota2){

const m1 = NOTAS.midi(NOTAS.parse(nota1));
const m2 = NOTAS.midi(NOTAS.parse(nota2));

return m2 - m1;

}


// --------------------------------------------
// CALIDAD DEL INTERVALO
// --------------------------------------------

function calidad(numero,semitonesReales){

const base = BASE_INTERVAL_SEMITONES[numero];

if(base === undefined){
throw new Error("Intervalo no soportado");
}

const diferencia = semitonesReales - base;

if(PERFECT_INTERVALS.includes(numero)){

if(diferencia === 0) return "perfect";
if(diferencia === 1) return "augmented";
if(diferencia === -1) return "diminished";

}

else{

if(diferencia === 0) return "major";
if(diferencia === -1) return "minor";
if(diferencia === 1) return "augmented";
if(diferencia === -2) return "diminished";

}

return "unknown";

}


// --------------------------------------------
// CONSTRUIR INTERVALO ENTRE DOS NOTAS
// --------------------------------------------

function entre(nota1,nota2){

const n = numeroDiatonico(nota1,nota2);
const s = semitonos(nota1,nota2);

return {
numero:n,
semitonos:s,
calidad:calidad(n,s)
};

}


// --------------------------------------------
// TRANSPOSICION POR INTERVALO
// --------------------------------------------

function transponer(nota,semitonos){

return NOTAS.transpose(
NOTAS.parse(nota),
semitonos
);

}


// --------------------------------------------
// INTERVALOS BASICOS
// --------------------------------------------

const INTERVALOS_BASE = {
m2:1,
M2:2,
m3:3,
M3:4,
P4:5,
A4:6,
d5:6,
P5:7,
m6:8,
M6:9,
m7:10,
M7:11,
P8:12
};


// --------------------------------------------
// TRANSPOSICION POR NOMBRE DE INTERVALO
// --------------------------------------------

function transponerIntervalo(nota,intervalo){

const semitonos = INTERVALOS_BASE[intervalo];

if(semitonos === undefined){
throw new Error("Intervalo no definido: " + intervalo);
}

return transponer(nota,semitonos);

}


// --------------------------------------------
// EXPORT
// --------------------------------------------

return {

entre,
semitonos,
numeroDiatonico,
calidad,

transponer,
transponerIntervalo

};

})();

if (typeof window !== "undefined") {
    window.INTERVALOS = INTERVALOS;
}