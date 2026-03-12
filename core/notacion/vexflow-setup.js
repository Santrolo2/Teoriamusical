window.VexFlowManager = (() => {
    "use strict";

    let renderer = null;
    let context = null;
    let currentContainerId = null;

    const BASS_SPLIT_MIDI = 60;

    function getVF() {
    if (window.VexFlow?.Renderer) return window.VexFlow;
    if (window.VexFlow?.Flow?.Renderer) return window.VexFlow.Flow;
    if (window.Vex?.Flow?.Renderer) return window.Vex.Flow;
    if (window.Module?.Flow?.Renderer) return window.Module.Flow;
    if (window.Module?.Vex?.Flow?.Renderer) return window.Module.Vex.Flow;

    throw new Error("VexFlow no está disponible.");
}

    function ensureContainer(containerId = "stave") {
        const target = document.getElementById(containerId);
        if (!target) {
            throw new Error(`No se encontró el contenedor #${containerId}`);
        }
        currentContainerId = containerId;
        return target;
    }

    function computeWidth(target) {
        const raw = target.clientWidth || target.offsetWidth || 920;
        return Math.max(280, raw);
    }

    function init(containerId = "stave") {
        const VF = getVF();
        const target = ensureContainer(containerId);

        target.innerHTML = "";

        renderer = new VF.Renderer(target, VF.Renderer.Backends.SVG);
        const width = computeWidth(target);
        renderer.resize(width, 280);

        context = renderer.getContext();
        context.setViewBox(0, 0, width, 280); // Asegurar que todo sea visible
        if (context && typeof context.setFont === "function") {
            context.setFont("Arial", 10, "");
        }

        return true;
    }

    function limpiar(containerId = currentContainerId || "stave") {
        const target = document.getElementById(containerId);
        if (target) target.innerHTML = "";
        renderer = null;
        context = null;
        currentContainerId = null;
    }

    function parseSimpleNote(literal) {
        if (typeof literal !== "string") {
            throw new Error(`Nota inválida: ${literal}`);
        }

        const clean = literal.trim();
        const match = clean.match(/^([A-Ga-g])([b#]{0,2})(-?\d+)$/);

        if (!match) {
            throw new Error(`Formato de nota inválido: ${literal}`);
        }

        const [, letterRaw, accidentalRaw, octaveRaw] = match;
        const letter = letterRaw.toUpperCase();
        const accidental = accidentalRaw || "";
        const octave = Number(octaveRaw);

        const semitones = {
            C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11
        };

        let midi = (octave + 1) * 12 + semitones[letter];
        if (accidental === "#") midi += 1;
        if (accidental === "##") midi += 2;
        if (accidental === "b") midi -= 1;
        if (accidental === "bb") midi -= 2;

        return {
            letter,
            accidental,
            octave,
            midi,
            key: `${letter.toLowerCase()}${accidental}/${octave}`
        };
    }

    function obtenerKeySignature(tonalidadId) {
        if (!tonalidadId || typeof tonalidadId !== "string") return "C";
        const clean = tonalidadId.replace(/_(major|minor)$/i, "");
        return clean || "C";
    }

    function crearNotaConAccidentales(VF, clef, keysData) {
    const keys = keysData.length
        ? keysData.map(k => k.key)
        : [clef === "bass" ? "d/3" : (clef === "alto" ? "c/4" : "b/4")];

    const staveNote = new VF.StaveNote({
        clef,
        keys,
        duration: "w"
    });

    keysData.forEach((k, index) => {
        if (k.accidental) {
            if (typeof staveNote.addAccidental === "function") {
                staveNote.addAccidental(index, new VF.Accidental(k.accidental));
            } else if (typeof staveNote.addModifier === "function") {
                staveNote.addModifier(index, new VF.Accidental(k.accidental));
            }
        }
    });

    return staveNote;
}

    function dividirNotasPorRegistro(notas) {
        const parsed = notas.map(parseSimpleNote);

        const bass = parsed.filter(n => n.midi < BASS_SPLIT_MIDI);
        const treble = parsed.filter(n => n.midi >= BASS_SPLIT_MIDI);

        // Si el acorde es puramente agudo o puramente grave, 
        // dejamos el otro pentagrama vacío (VexFlow dibujará silencios o simplemente quedará limpio)
        // en lugar de forzar una nota a un lugar que no le pertenece.
        return { bass, treble };
    }

    function dibujarGrandStaff(acorde, tonalidadId = null, containerId = "stave") {
        if (!acorde || !Array.isArray(acorde.notas) || !acorde.notas.length) {
            throw new Error("Acorde inválido para render.");
        }

        const VF = getVF();
        init(containerId);

        const target = ensureContainer(containerId);
        const width = computeWidth(target);
        const staveWidth = width - 80;
        const x = 30;
        const yTreble = 30;
        const yBass = 145;

        const trebleStave = new VF.Stave(x, yTreble, staveWidth);
        const bassStave = new VF.Stave(x, yBass, staveWidth);

        const ks = obtenerKeySignature(tonalidadId);

        trebleStave.addClef("treble");
        bassStave.addClef("bass");

        try {
            trebleStave.addKeySignature(ks);
            bassStave.addKeySignature(ks);
        } catch (_) {
            trebleStave.addKeySignature("C");
            bassStave.addKeySignature("C");
        }

        trebleStave.setContext(context).draw();
        bassStave.setContext(context).draw();

        new VF.StaveConnector(trebleStave, bassStave)
            .setType(VF.StaveConnector.type.BRACE)
            .setContext(context)
            .draw();

        new VF.StaveConnector(trebleStave, bassStave)
            .setType(VF.StaveConnector.type.SINGLE_LEFT)
            .setContext(context)
            .draw();

        new VF.StaveConnector(trebleStave, bassStave)
            .setType(VF.StaveConnector.type.SINGLE_RIGHT)
            .setContext(context)
            .draw();

        const grupos = dividirNotasPorRegistro(acorde.notas);

        // Ottava markers omitted due to version incompatibility, using simple transposition for rendering logic
        let visualTreble = grupos.treble;
        if (grupos.treble.length) {
            const maxTreble = Math.max(...grupos.treble.map(n => n.midi));
            if (maxTreble >= 84) {
                visualTreble = grupos.treble.map(n => ({...n, key: `${n.letter.toLowerCase()}${n.accidental}/${n.octave - 1}`}));
            }
        }

        let visualBass = grupos.bass;
        if (grupos.bass.length) {
            const minBass = Math.min(...grupos.bass.map(n => n.midi));
            if (minBass <= 36) {
                visualBass = grupos.bass.map(n => ({...n, key: `${n.letter.toLowerCase()}${n.accidental}/${n.octave + 1}`}));
            }
        }

        if (grupos.treble.length) {
            const trebleNote = crearNotaConAccidentales(VF, "treble", visualTreble);
            const trebleVoice = new VF.Voice({ num_beats: 4, beat_value: 4 });
            if (typeof trebleVoice.setStrict === "function") trebleVoice.setStrict(false);
            trebleVoice.addTickables([trebleNote]);
            new VF.Formatter().joinVoices([trebleVoice]).format([trebleVoice], staveWidth - 50);
            trebleVoice.draw(context, trebleStave);
        }

        if (grupos.bass.length) {
            const bassNote = crearNotaConAccidentales(VF, "bass", visualBass);
            const bassVoice = new VF.Voice({ num_beats: 4, beat_value: 4 });
            if (typeof bassVoice.setStrict === "function") bassVoice.setStrict(false);
            bassVoice.addTickables([bassNote]);
            new VF.Formatter().joinVoices([bassVoice]).format([bassVoice], staveWidth - 50);
            bassVoice.draw(context, bassStave);
        }

        // Los marcadores Ottava se omiten temporalmente para evitar el error de constructor
    }

    function dibujarScore(stavesData, tonalidadId = null, containerId = "stave") {
        const VF = getVF();
        init(containerId);

        const target = ensureContainer(containerId);
        const width = computeWidth(target);
        const staveWidth = width - 80;
        const x = 30;
        
        // El alto total dependerá del número de sistemas
        const systemHeight = 110;
        renderer.resize(width, stavesData.length * systemHeight + 100);

        const ks = obtenerKeySignature(tonalidadId);
        const staves = [];

        stavesData.forEach((data, i) => {
            const y = 30 + (i * systemHeight);
            const stave = new VF.Stave(x, y, staveWidth);
            stave.addClef(data.clef || "treble");
            try {
                stave.addKeySignature(ks);
            } catch (_) {
                stave.addKeySignature("C");
            }
            stave.setContext(context).draw();
            staves.push(stave);

            // Notas
            if (data.notas && data.notas.length) {
                const parsed = data.notas.map(parseSimpleNote);
                
                const maxMidi = Math.max(...parsed.map(n => n.midi));
                const minMidi = Math.min(...parsed.map(n => n.midi));
                
                let visualNotes = parsed;
                const visualOffset = data.displayOctaveOffset || 0;

                if (maxMidi > 84) { // Superior a C6
                    visualNotes = parsed.map(n => ({...n, key: `${n.letter.toLowerCase()}${n.accidental}/${n.octave - 1 + visualOffset}`}));
                } else if (minMidi < 36) { // Inferior a C2
                    visualNotes = parsed.map(n => ({...n, key: `${n.letter.toLowerCase()}${n.accidental}/${n.octave + 1 + visualOffset}`}));
                } else if (visualOffset !== 0) {
                    visualNotes = parsed.map(n => ({...n, key: `${n.letter.toLowerCase()}${n.accidental}/${n.octave + visualOffset}`}));
                }

                const note = crearNotaConAccidentales(VF, data.clef || "treble", visualNotes);
                const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
                if (typeof voice.setStrict === "function") voice.setStrict(false);
                voice.addTickables([note]);
                new VF.Formatter().joinVoices([voice]).format([voice], staveWidth - 50);
                voice.draw(context, stave);

                // Ottava visual omitida para estabilidad
            }
        });

        // Conectores si hay más de uno
        if (staves.length > 1) {
            const firstStave = staves[0];
            const lastStave = staves[staves.length - 1];

            new VF.StaveConnector(firstStave, lastStave)
                .setType(VF.StaveConnector.type.SINGLE_LEFT)
                .setContext(context)
                .draw();
            
            new VF.StaveConnector(firstStave, lastStave)
                .setType(VF.StaveConnector.type.SINGLE_RIGHT)
                .setContext(context)
                .draw();
            
            // Usamos LLAVE (BRACE) para unir todos los sistemas como pidió el usuario
            new VF.StaveConnector(firstStave, lastStave)
                .setType(VF.StaveConnector.type.BRACE)
                .setContext(context)
                .draw();
        }
    }

    function dibujarPentagrama(acorde, tonalidadId = null, containerId = "stave") {
        dibujarGrandStaff(acorde, tonalidadId, containerId);
    }

    return {
        init,
        limpiar,
        dibujarPentagrama,
        dibujarGrandStaff,
        dibujarScore
    };
})();