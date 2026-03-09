const fs = require('fs');
const vm = require('vm');

const context = vm.createContext({ console });

function runModule(path, varName) {
    let code = fs.readFileSync(path, 'utf8');
    // The modules are wrapped in `const NAME = (() => { ... })();` 
    // In node vm, `const` at top level isn't attached to the context globally.
    // We rewrite `const NAME =` to `NAME =` so it implicitly becomes global in the sandbox.
    code = code.replace(new RegExp(`const\\s+${varName}\\s*=`), `${varName} =`);
    vm.runInContext(code, context);
}

try {
    runModule('./core/teoria/notas.js', 'NOTAS');
    runModule('./core/teoria/intervalos.js', 'INTERVALOS');
    runModule('./core/teoria/tipos-acorde.js', 'TIPOS_ACORDE');
    runModule('./core/teoria/acordes.js', 'ACORDES');
    runModule('./core/teoria/escalas.js', 'ESCALAS');
    runModule('./core/teoria/tonalidades.js', 'TONALIDADES');
    runModule('./core/teoria/funciones-tonales.js', 'FUNCIONES_TONALES');
} catch (e) {
    console.error("Setup Error:", e);
}

const { ACORDES, FUNCIONES_TONALES, ESCALAS, TONALIDADES } = context;

// Test 1: Orthography Fix for non-tertian chords
try {
    const sus2 = ACORDES.construirNotas('C', 'sus2');
    console.log("C sus2:", sus2);
    if (sus2.join(',') === "C,D,G") console.log("✅ Suspendido 2 Orthography OK");
    else console.log("❌ Suspendido 2 Failed", sus2);
} catch (e) { console.error("Error in Test 1", e.stack); }

// Test 2: Tonal Functions
try {
    const fnTonal = FUNCIONES_TONALES.analizarRomano({ raiz: 'G', tipo: 'dom7' }, TONALIDADES.mayor('C'));
    console.log("G7 in C Major:", fnTonal);
    if (fnTonal === "V7") console.log("✅ Roman Numeral Function OK");
    else console.log("❌ Roman Numeral Failed", fnTonal);
    
    const fnTonalMin = FUNCIONES_TONALES.analizarRomano({ raiz: 'D', tipo: 'min7' }, TONALIDADES.mayor('C'));
    console.log("Dm7 in C Major:", fnTonalMin);
    if (fnTonalMin === "ii7") console.log("✅ Roman Numeral Function OK");
    else console.log("❌ Roman Numeral Failed", fnTonalMin);
} catch (e) { console.error("Error in Test 2", e); }

// Test 3: Scales Expansion
try {
    const dorian = ESCALAS.construir('D', 'dorian');
    const noteNames = ESCALAS.nombres(dorian);
    console.log("D Dorian Scale:", noteNames);
    if (noteNames.join(',') === "D,E,F,G,A,B,C") console.log("✅ Modes Expansion OK");
    else console.log("❌ Modes Expansion Failed", noteNames);
} catch (e) { console.error("Error in Test 3", e); }
