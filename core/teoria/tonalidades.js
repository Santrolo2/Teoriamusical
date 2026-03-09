// ============================================
// MODULO: TONALIDADES
// Contexto tonal y armaduras
// ============================================

const TONALIDADES = (() => {

"use strict";


// --------------------------------------------
// DEFINICION DE TONALIDADES MAYORES
// --------------------------------------------

const MAYORES = {

C:  { id:"C_major",  armadura:[],                     alteracion:"natural" },

G:  { id:"G_major",  armadura:["F#"],                  alteracion:"sharp" },

D:  { id:"D_major",  armadura:["F#","C#"],              alteracion:"sharp" },

A:  { id:"A_major",  armadura:["F#","C#","G#"],         alteracion:"sharp" },

E:  { id:"E_major",  armadura:["F#","C#","G#","D#"],    alteracion:"sharp" },

B:  { id:"B_major",  armadura:["F#","C#","G#","D#","A#"], alteracion:"sharp" },

"F#": { id:"F#_major", armadura:["F#","C#","G#","D#","A#","E#"], alteracion:"sharp" },

"C#": { id:"C#_major", armadura:["F#","C#","G#","D#","A#","E#","B#"], alteracion:"sharp" },

F:  { id:"F_major",  armadura:["Bb"],                  alteracion:"flat" },

Bb: { id:"Bb_major", armadura:["Bb","Eb"],             alteracion:"flat" },

Eb: { id:"Eb_major", armadura:["Bb","Eb","Ab"],        alteracion:"flat" },

Ab: { id:"Ab_major", armadura:["Bb","Eb","Ab","Db"],   alteracion:"flat" },

Db: { id:"Db_major", armadura:["Bb","Eb","Ab","Db","Gb"], alteracion:"flat" },

Gb: { id:"Gb_major", armadura:["Bb","Eb","Ab","Db","Gb","Cb"], alteracion:"flat" },

Cb: { id:"Cb_major", armadura:["Bb","Eb","Ab","Db","Gb","Cb","Fb"], alteracion:"flat" }

};


// --------------------------------------------
// RELATIVAS MENORES
// --------------------------------------------

const RELATIVAS_MENORES = {

C:"A",
G:"E",
D:"B",
A:"F#",
E:"C#",
B:"G#",
"F#":"D#",
"C#":"A#",

F:"D",
Bb:"G",
Eb:"C",
Ab:"F",
Db:"Bb",
Gb:"Eb",
Cb:"Ab"

};


// --------------------------------------------
// OBTENER TONALIDAD MAYOR
// --------------------------------------------

function mayor(nombre){

const t = MAYORES[nombre];

if(!t){
throw new Error("Tonalidad mayor no definida: " + nombre);
}

return {
nombre,
tipo:"major",
armadura:t.armadura,
alteracion:t.alteracion,
escala:ESCALAS.construir(nombre,"major")
};

}


// --------------------------------------------
// OBTENER TONALIDAD MENOR NATURAL
// --------------------------------------------

function menor(nombre){

return {
nombre,
tipo:"minor",
armadura: mayor(relativaMayor(nombre)).armadura,
escala: ESCALAS.construir(nombre,"natural_minor")
};

}


// --------------------------------------------
// RELATIVA MAYOR
// --------------------------------------------

function relativaMayor(minor){

for(const k in RELATIVAS_MENORES){

if(RELATIVAS_MENORES[k] === minor){

return k;

}

}

throw new Error("No se encontró relativa mayor");

}


// --------------------------------------------
// RELATIVA MENOR
// --------------------------------------------

function relativaMenor(major){

return RELATIVAS_MENORES[major];

}


// --------------------------------------------
// GRADOS DIATONICOS
// --------------------------------------------

function grados(tonalidad){

const escala = tonalidad.escala;

return escala.map((nota,i)=>{

return {

grado:i+1,
nota:nota.letter + nota.accidental

};

});

}


// --------------------------------------------
// EXPORT
// --------------------------------------------

return {

mayor,
menor,
relativaMayor,
relativaMenor,
grados

};

})();

if (typeof window !== "undefined") {
    window.TONALIDADES = TONALIDADES;
}