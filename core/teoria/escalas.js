// ============================================
// MODULO: ESCALAS
// Generación de escalas diatónicas
// ============================================

const ESCALAS = (() => {

"use strict";

// --------------------------------------------
// PATRONES DE ESCALA (SEMITONOS)
// --------------------------------------------

const PATRONES = {

major:          [2,2,1,2,2,2,1],
dorian:         [2,1,2,2,2,1,2],
phrygian:       [1,2,2,2,1,2,2],
lydian:         [2,2,2,1,2,2,1],
mixolydian:     [2,2,1,2,2,1,2],
natural_minor:  [2,1,2,2,1,2,2],
locrian:        [1,2,2,1,2,2,2],

harmonic_minor: [2,1,2,2,1,3,1],
melodic_minor:  [2,1,2,2,2,2,1],

major_pentatonic: [2,2,3,2,3],
minor_pentatonic: [3,2,2,3,2]

};


// --------------------------------------------
// HELPERS
// --------------------------------------------

const LETTERS = ["C","D","E","F","G","A","B"];

function siguienteLetra(letter){

const index = LETTERS.indexOf(letter);

return LETTERS[(index + 1) % 7];

}

function mod(n,m){
return ((n % m) + m) % m;
}


// --------------------------------------------
// SPELLING DIATONICO
// --------------------------------------------

function calcularAccidental(letter,targetPitch){

const natural = NOTAS.pitchClass({letter,accidental:"",octave:null});

let diff = mod(targetPitch - natural,12);

if(diff > 6){
diff -= 12;
}

if(diff === -2) return "bb";
if(diff === -1) return "b";
if(diff === 0) return "";
if(diff === 1) return "#";
if(diff === 2) return "##";

throw new Error("Alteración fuera de rango");

}


// --------------------------------------------
// CONSTRUIR ESCALA
// --------------------------------------------

function construir(tonica, tipo="major"){

const patron = PATRONES[tipo];

if(!patron){
throw new Error("Tipo de escala desconocido");
}

const tonicLiteral = NOTAS.parse(tonica);

const escala = [];

let currentPitch = NOTAS.pitchClass(tonicLiteral);
let currentLetter = tonicLiteral.letter;

escala.push({
letter: currentLetter,
accidental: tonicLiteral.accidental,
octave: null
});

for(let i=0;i<patron.length;i++){

currentPitch = mod(currentPitch + patron[i],12);
currentLetter = siguienteLetra(currentLetter);

const accidental = calcularAccidental(currentLetter,currentPitch);

escala.push({
letter: currentLetter,
accidental,
octave: null
});

}

return escala;

}


// --------------------------------------------
// OBTENER NOMBRES DE NOTA
// --------------------------------------------

function nombres(escala){

return escala.map(n=>n.letter + n.accidental);

}


// --------------------------------------------
// GRADO DE ESCALA
// --------------------------------------------

function grado(escala,index){

if(index < 1 || index > escala.length){
throw new Error("Grado fuera de rango");
}

return escala[index-1];

}


// --------------------------------------------
// EXPORT
// --------------------------------------------

return {

construir,
nombres,
grado,
PATRONES

};

})();

if (typeof window !== "undefined") {
    window.ESCALAS = ESCALAS;
}