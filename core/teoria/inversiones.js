// ============================================
// MODULO: INVERSIONES
// Lógica de inversiones de acordes
// ============================================

const INVERSIONES = (() => {

"use strict";


// --------------------------------------------
// NOMBRES DE INVERSION
// --------------------------------------------

const NOMBRES = [
"estado fundamental",
"primera inversion",
"segunda inversion",
"tercera inversion"
];


// --------------------------------------------
// VALIDAR INVERSION
// --------------------------------------------

function validar(acorde){

const max = acorde.notasBase.length - 1;

if(acorde.inversion > max){
throw new Error("Inversión inválida para este acorde");
}

return true;

}


// --------------------------------------------
// NOMBRE DE INVERSION
// --------------------------------------------

function nombre(acorde){

return NOMBRES[acorde.inversion] || "inversion";

}


// --------------------------------------------
// CIFRADO DE BAJO (FIGURAS)
// --------------------------------------------

function cifrado(acorde){

const n = acorde.notasBase.length;
const inv = acorde.inversion;

if(n === 3){

if(inv === 0) return "";
if(inv === 1) return "6";
if(inv === 2) return "6/4";

}

if(n === 4){

if(inv === 0) return "7";
if(inv === 1) return "6/5";
if(inv === 2) return "4/3";
if(inv === 3) return "4/2";

}

return "";

}


// --------------------------------------------
// ANALISIS DE INVERSION
// --------------------------------------------

function analizar(acorde){

validar(acorde);

return {

inversion: acorde.inversion,
nombre: nombre(acorde),
bajo: acorde.bajo,
cifrado: cifrado(acorde)

};

}


// --------------------------------------------
// EXPORT
// --------------------------------------------

return {

validar,
nombre,
cifrado,
analizar

};

})();

if (typeof window !== "undefined") {
    window.INVERSIONES = INVERSIONES;
}