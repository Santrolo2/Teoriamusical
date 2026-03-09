// ============================================
// MODULO: NOTAS
// Núcleo de representación de notas musicales
// ============================================

const NOTAS = (() => {

"use strict";

// --------------------------------------------
// CONSTANTES
// --------------------------------------------

const LETTERS = ["C","D","E","F","G","A","B"];

const DIATONIC_INDEX = {
C:0,
D:1,
E:2,
F:3,
G:4,
A:5,
B:6
};

const NATURAL_PITCH_CLASS = {
C:0,
D:2,
E:4,
F:5,
G:7,
A:9,
B:11
};

const ACCIDENTAL_OFFSET = {
"bb":-2,
"b":-1,
"":0,
"#":1,
"##":2
};


// --------------------------------------------
// HELPERS
// --------------------------------------------

function mod(n,m){
return ((n % m) + m) % m;
}

function esEntero(x){
return Number.isInteger(x);
}


// --------------------------------------------
// VALIDACION
// --------------------------------------------

function validarLetra(letter){
if(!LETTERS.includes(letter)){
throw new Error("Letra musical inválida: " + letter);
}
}

function validarAlteracion(acc){
if(!(acc in ACCIDENTAL_OFFSET)){
throw new Error("Alteración inválida: " + acc);
}
}

function validarOctava(octave){
if(octave === null) return;

if(!esEntero(octave)){
throw new Error("Octava inválida");
}
}


// --------------------------------------------
// PARSE NOTE
// --------------------------------------------

function parse(input){

if(typeof input !== "string"){
throw new Error("Nota debe ser string");
}

const clean = input
.trim()
.replace(/♯/g,"#")
.replace(/♭/g,"b");

const match = clean.match(/^([A-Ga-g])(bb|b|##|#)?(-?\d+)?$/);

if(!match){
throw new Error("Formato de nota inválido: " + input);
}

const letter = match[1].toUpperCase();
const accidental = match[2] || "";
const octave = match[3] !== undefined ? Number(match[3]) : null;

validarLetra(letter);
validarAlteracion(accidental);
validarOctava(octave);

return {
letter,
accidental,
octave
};

}


// --------------------------------------------
// PITCH CLASS
// --------------------------------------------

function pitchClass(note){

const base = NATURAL_PITCH_CLASS[note.letter];
const offset = ACCIDENTAL_OFFSET[note.accidental];

return mod(base + offset,12);

}


// --------------------------------------------
// MIDI
// --------------------------------------------

function midi(note){

if(note.octave === null){
throw new Error("Octava requerida para MIDI");
}

return (note.octave + 1) * 12 + pitchClass(note);

}


// --------------------------------------------
// CONSTRUCCION DE OBJETO NOTA
// --------------------------------------------

function crear(input){

const literal = typeof input === "string" ? parse(input) : input;

return {
literal,
pitchClass: pitchClass(literal),
midi: literal.octave !== null ? midi(literal) : null,
diatonicIndex: DIATONIC_INDEX[literal.letter]
};

}


// --------------------------------------------
// COMPARACIONES
// --------------------------------------------

function equalsStrict(a,b){

return (
a.letter === b.letter &&
a.accidental === b.accidental &&
a.octave === b.octave
);

}

function equalsEnharmonic(a,b){

if(a.octave !== null && b.octave !== null){
return midi(a) === midi(b);
}

return pitchClass(a) === pitchClass(b);

}


// --------------------------------------------
// TRANSPOSICION CROMATICA
// --------------------------------------------

const PC_TO_SHARP = {
0:"C",
1:"C#",
2:"D",
3:"D#",
4:"E",
5:"F",
6:"F#",
7:"G",
8:"G#",
9:"A",
10:"A#",
11:"B"
};

function transpose(note,semitones){

const m = midi(note) + semitones;

const pc = mod(m,12);
const octave = Math.floor(m/12) - 1;

const name = PC_TO_SHARP[pc];

return parse(name + octave);

}


// --------------------------------------------
// EXPORT
// --------------------------------------------

return {

parse,
crear,

pitchClass,
midi,

equalsStrict,
equalsEnharmonic,

transpose

};

})();

if (typeof window !== "undefined") {
    window.NOTAS = NOTAS;
}