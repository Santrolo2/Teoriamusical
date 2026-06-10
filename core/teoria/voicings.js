// ============================================
// MODULO: VOICINGS
// Distribución de notas en diferentes registros (Chorale/SATB)
// ============================================

const VOICINGS = (() => {
    "use strict";

    // Helper: Pasa un pitch class (0-11) y la letra, más octava, retorna "C4"
    function crearNota(letraBase, accidental, octava) {
        return letraBase + accidental + octava;
    }

    // Extremos aproximados (Midi)
    // Bajo: E2 (40) a C4 (60)
    // Tenor: C3 (48) a G4 (67)
    // Alto: G3 (55) a C5 (72)
    // Soprano: C4 (60) a G5 (79)

    // Convierte "C#4" a midi (simplificado)
    function notaAMidi(notaStr) {
        if (!window.NOTAS) return 60;
        const n = NOTAS.parse(notaStr);
        const semitones = {C:0, D:2, E:4, F:5, G:7, A:9, B:11};
        let midi = (n.octave + 1) * 12 + semitones[n.letter];
        if (n.accidental === "#") midi++;
        if (n.accidental === "##") midi+=2;
        if (n.accidental === "b") midi--;
        if (n.accidental === "bb") midi-=2;
        return midi;
    }

    // Dada una lista de `notasBase` (ej. ["C", "E", "G"]), genera 4 voces.
    function generarChorale(notasBase, inversion) {
        // 1. Determinar el Bajo
        const notaBajo = notasBase[inversion % notasBase.length];
        
        // Asignar el bajo en octava 2 o 3 (rango 40-55 preferido)
        // Para simplificar, le damos octava 2 o 3 dependiendo de la letra.
        // C a E en octava 3, F a B en octava 2.
        let octavaBajo = 3;
        const letterBajo = notaBajo.charAt(0);
        if (["F","G","A","B"].includes(letterBajo)) {
            octavaBajo = 2;
        }
        
        const bajoFinal = notaBajo + octavaBajo;
        const midiBajo = notaAMidi(bajoFinal);

        // 2. Determinar las otras 3 voces (SAT)
        // Necesitamos cubrir las demás notas de `notasBase`.
        let notasFaltantes = [...notasBase];
        // Remover el bajo de la lista conceptual, aunque si es triada, necesitamos 4 voces (S, A, T, B)
        // Entonces, una nota debe duplicarse (idealmente la raíz).
        const raiz = notasBase[0];
        let vocesSuperiores = [];
        
        if (notasBase.length === 3) {
            vocesSuperiores = [notasBase[0], notasBase[1], notasBase[2], raiz]; // Duplicar raíz
        } else if (notasBase.length === 4) {
             vocesSuperiores = [...notasBase];
        } else {
            // Si son 5 o más (ej. 9na), tomamos raíz, 3ra, 7ma y la nota guía (9na)
            vocesSuperiores = [notasBase[0], notasBase[1], notasBase[3], notasBase[4]];
        }

        // Remover una instancia de la nota del bajo de `vocesSuperiores` porque el bajo ya la toca
        const idx = vocesSuperiores.indexOf(notaBajo);
        if (idx !== -1) {
            vocesSuperiores.splice(idx, 1);
        }

        // Ordenamos las voces superiores para formar un Drop-2 o un spread abierto razonable
        // Una manera fácil es asignarlas a octava 4 (y 5 si se cruzan).
        let octavaActual = 4;
        let midiAnterior = midiBajo;
        
        let resultadoSuperiores = [];
        
        // Shuffle manual simple para variar las posiciones o forzar un orden
        // Las colocamos de abajo hacia arriba asignando octavas crecientes
        
        let notasAAsignar = vocesSuperiores.sort((a, b) => {
            const pcA = window.NOTAS.pitchClass(window.NOTAS.parse(a));
            const pcB = window.NOTAS.pitchClass(window.NOTAS.parse(b));
            return pcA - pcB;
        });
        
        // Empujar las notas desde octava 4 hacia arriba
        for(let i=0; i<notasAAsignar.length; i++) {
            const n = notasAAsignar[i];
            const parsed = window.NOTAS.parse(n);
            let pc = window.NOTAS.pitchClass(parsed);
            
            let intentoMidi = (octavaActual + 1) * 12 + window.NOTAS.pitchClass({letter: parsed.letter, accidental: ""});
            if (parsed.accidental === "#") intentoMidi++;
            if (parsed.accidental === "b") intentoMidi--;

            if (intentoMidi <= midiAnterior) {
                octavaActual++;
                intentoMidi += 12;
            }
            
            resultadoSuperiores.push(n + octavaActual);
            midiAnterior = intentoMidi;
        }

        return [bajoFinal, ...resultadoSuperiores];
    }

    return {
        generarChorale
    };
})();

if (typeof window !== "undefined") {
    window.VOICINGS = VOICINGS;
}
