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
        const match = clean
            .replace(/♯/g, "#")
            .replace(/♭/g, "b")
            .replace(/♮/g, "n")
            .match(/^([A-Ga-g])(bb|b|n|##|#)?(-?\d+)$/);

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

    function mapaArmadura(tonalidadId) {
        const ks = obtenerKeySignature(tonalidadId);
        try {
            if (window.TONALIDADES && typeof window.TONALIDADES.mapaArmadura === "function") {
                return window.TONALIDADES.mapaArmadura(ks);
            }
        } catch (_) {}

        return { C: "", D: "", E: "", F: "", G: "", A: "", B: "" };
    }

    function accidentalVisibleSegunArmadura(nota, tonalidadId) {
        const esperado = mapaArmadura(tonalidadId)[nota.letter] || "";
        const real = nota.accidental || "";

        if (real === esperado) return "";
        if (!real && esperado) return "n";
        return real;
    }

    function construirKeyVisual(nota, octave, tonalidadId) {
        const accidentalVisible = accidentalVisibleSegunArmadura(nota, tonalidadId);
        const accidentalKey = accidentalVisible === "n" ? "n" : (nota.accidental || "");
        return `${nota.letter.toLowerCase()}${accidentalKey}/${octave}`;
    }

    function crearNotaConAccidentales(VF, clef, keysData, tonalidadId = null, duration = "w", dedosMap = {}) {
    const keys = keysData.length
        ? keysData.map(k => k.key)
        : [clef === "bass" ? "d/3" : (clef === "alto" ? "c/4" : "b/4")];

    const staveNote = new VF.StaveNote({
        clef,
        keys,
        duration: duration
    });


    keysData.forEach((k, index) => {
        const accidental = accidentalVisibleSegunArmadura(k, tonalidadId);
        
        // Agregar accidental
        if (accidental) {
            if (typeof staveNote.addAccidental === "function") {
                staveNote.addAccidental(index, new VF.Accidental(accidental));
            } else if (typeof staveNote.addModifier === "function") {
                try {
                    staveNote.addModifier(new VF.Accidental(accidental), index);
                } catch(e) {
                    staveNote.addModifier(index, new VF.Accidental(accidental));
                }
            }
        }
        
        // Agregar Digitación (FretHandFinger)
        if (dedosMap && typeof dedosMap[k.midi] !== "undefined") {
            const numeroDedo = String(dedosMap[k.midi]);
            const fingering = new VF.FretHandFinger(numeroDedo);
            if (clef === "treble") {
               fingering.setPosition(VF.Modifier.Position.ABOVE);
            } else {
               fingering.setPosition(VF.Modifier.Position.BELOW);
            }
            
            if (typeof staveNote.addModifier === "function") {
                try {
                    staveNote.addModifier(fingering, index);
                } catch(e) {
                    staveNote.addModifier(index, fingering);
                }
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

    function moverGrupoAOctava(parsedNotes, minMidi, maxMidi) {
        if (!parsedNotes || !parsedNotes.length) return parsedNotes || [];
        let grupo = parsedNotes.map(n => ({ ...n }));
        let promedio = grupo.reduce((acc, n) => acc + n.midi, 0) / grupo.length;

        while (promedio < minMidi) {
            grupo = grupo.map(n => ({
                ...n,
                octave: n.octave + 1,
                midi: n.midi + 12
            }));
            promedio = grupo.reduce((acc, n) => acc + n.midi, 0) / grupo.length;
        }
        while (promedio > maxMidi) {
            grupo = grupo.map(n => ({
                ...n,
                octave: n.octave - 1,
                midi: n.midi - 12
            }));
            promedio = grupo.reduce((acc, n) => acc + n.midi, 0) / grupo.length;
        }
        return grupo;
    }

    function dividirAcordeProgresionGrandStaff(notas) {
        const parsed = notas.map(parseSimpleNote).sort((a, b) => a.midi - b.midi);
        if (!parsed.length) return { bass: [], treble: [] };
        if (parsed.length === 1) return { bass: [parsed[0]], treble: [] };

        // Para progresiones didácticas: bajo claro + acorde completo en mano derecha.
        let bass = [parsed[0]];
        let treble = parsed.slice(1);

        bass = moverGrupoAOctava(bass, 38, 50);
        treble = moverGrupoAOctava(treble, 60, 74);

        return { bass, treble };
    }

    function dibujarGrandStaff(acorde, tonalidadId = null, containerId = "stave", digitacionObj = null) {
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

        // Ottava markers omitted due to version incompatibility.
        // We still compute visual keys consistently so accidentals (including naturals) are explicit.
        let trebleOctaveOffset = 0;
        if (grupos.treble.length) {
            const maxTreble = Math.max(...grupos.treble.map(n => n.midi));
            if (maxTreble >= 84) trebleOctaveOffset = -1;
        }
        const visualTreble = grupos.treble.map(n => ({
            ...n,
            key: construirKeyVisual(n, n.octave + trebleOctaveOffset, tonalidadId)
        }));

        let bassOctaveOffset = 0;
        if (grupos.bass.length) {
            const minBass = Math.min(...grupos.bass.map(n => n.midi));
            if (minBass <= 36) bassOctaveOffset = 1;
        }
        const visualBass = grupos.bass.map(n => ({
            ...n,
            key: construirKeyVisual(n, n.octave + bassOctaveOffset, tonalidadId)
        }));

        // Crear mapa de digitaciones MIDI -> Dedo
        const mapaDedosTreble = {};
        const mapaDedosBass = {};
        
        if (digitacionObj && digitacionObj.manos) {
            if (digitacionObj.manos.derecha) {
                digitacionObj.manos.derecha.notas.forEach((n, idx) => {
                    const midi = parseSimpleNote(n).midi;
                    mapaDedosTreble[midi] = digitacionObj.manos.derecha.dedos[idx];
                });
            }
            if (digitacionObj.manos.izquierda) {
                digitacionObj.manos.izquierda.notas.forEach((n, idx) => {
                    const midi = parseSimpleNote(n).midi;
                    mapaDedosBass[midi] = digitacionObj.manos.izquierda.dedos[idx];
                });
            }
        }

        if (grupos.treble.length) {
            const trebleNote = crearNotaConAccidentales(VF, "treble", visualTreble, tonalidadId, "w", mapaDedosTreble);
            const trebleVoice = new VF.Voice({ num_beats: 4, beat_value: 4 });
            if (typeof trebleVoice.setStrict === "function") trebleVoice.setStrict(false);
            trebleVoice.addTickables([trebleNote]);
            new VF.Formatter().joinVoices([trebleVoice]).format([trebleVoice], staveWidth - 50);
            trebleVoice.draw(context, trebleStave);
        }

        if (grupos.bass.length) {
            const bassNote = crearNotaConAccidentales(VF, "bass", visualBass, tonalidadId, "w", mapaDedosBass);
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
                const visualOffset = data.displayOctaveOffset || 0;
                const ottavaOffset = maxMidi > 84 ? -1 : (minMidi < 36 ? 1 : 0);

                const visualNotes = parsed.map(n => ({
                    ...n,
                    key: construirKeyVisual(n, n.octave + visualOffset + ottavaOffset, tonalidadId)
                }));

                const note = crearNotaConAccidentales(VF, data.clef || "treble", visualNotes, tonalidadId);
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

    function dibujarProgresionScore(stavesData, tonalidadId = null, containerId = "stave") {
        try {
            const VF = getVF();
            init(containerId);

            const target = ensureContainer(containerId);
            const width = computeWidth(target);
            const staveWidth = width - 80;
            const x = 30;
            
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

                if (data.progresion && data.progresion.length) {
                    const tickables = data.progresion.map(acordeNotas => {
                        const parsed = acordeNotas.map(parseSimpleNote);
                        const visualOffset = data.displayOctaveOffset || 0;
                        const visualNotes = parsed.map(n => ({
                            ...n,
                            key: construirKeyVisual(n, n.octave + visualOffset, tonalidadId)
                        }));
                        return crearNotaConAccidentales(VF, data.clef || "treble", visualNotes, tonalidadId, "q");
                    });

                    const voice = new VF.Voice({ num_beats: data.progresion.length, beat_value: 4 });
                    if (typeof voice.setStrict === "function") voice.setStrict(false);
                    voice.addTickables(tickables);
                    
                    new VF.Formatter().joinVoices([voice]).format([voice], staveWidth - 50);
                    voice.draw(context, stave);
                }
            });

            if (staves.length > 1) {
                const firstStave = staves[0];
                const lastStave = staves[staves.length - 1];
                new VF.StaveConnector(firstStave, lastStave).setType(VF.StaveConnector.type.SINGLE_LEFT).setContext(context).draw();
                new VF.StaveConnector(firstStave, lastStave).setType(VF.StaveConnector.type.SINGLE_RIGHT).setContext(context).draw();
                new VF.StaveConnector(firstStave, lastStave).setType(VF.StaveConnector.type.BRACE).setContext(context).draw();
            }
        } catch (e) {
            console.error("Error en dibujarProgresionScore:", e);
        }
    }

    function dibujarProgresionGrandStaff(progresion, tonalidadId = null, containerId = "stave") {
        try {
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

            new VF.StaveConnector(trebleStave, bassStave).setType(VF.StaveConnector.type.BRACE).setContext(context).draw();
            new VF.StaveConnector(trebleStave, bassStave).setType(VF.StaveConnector.type.SINGLE_LEFT).setContext(context).draw();
            new VF.StaveConnector(trebleStave, bassStave).setType(VF.StaveConnector.type.SINGLE_RIGHT).setContext(context).draw();

            const trebleNotes = [];
            const bassNotes = [];

            progresion.forEach(acorde => {
                const { treble, bass } = dividirAcordeProgresionGrandStaff(acorde.notas);
                const trebleVisual = treble.map(n => ({
                    ...n,
                    key: construirKeyVisual(n, n.octave, tonalidadId)
                }));
                const bassVisual = bass.map(n => ({
                    ...n,
                    key: construirKeyVisual(n, n.octave, tonalidadId)
                }));
                trebleNotes.push(crearNotaConAccidentales(VF, "treble", trebleVisual, tonalidadId, "q"));
                bassNotes.push(crearNotaConAccidentales(VF, "bass", bassVisual, tonalidadId, "q"));
            });
            const numBeats = (progresion && progresion.length) || 4;
            const trebleVoice = new VF.Voice({ num_beats: numBeats, beat_value: 4 });
            const bassVoice = new VF.Voice({ num_beats: numBeats, beat_value: 4 });
            
            if (typeof trebleVoice.setStrict === "function") trebleVoice.setStrict(false);
            if (typeof bassVoice.setStrict === "function") bassVoice.setStrict(false);
            
            trebleVoice.addTickables(trebleNotes);
            bassVoice.addTickables(bassNotes);

            new VF.Formatter().joinVoices([trebleVoice, bassVoice]).format([trebleVoice, bassVoice], staveWidth - 50);
            
            trebleVoice.draw(context, trebleStave);
            bassVoice.draw(context, bassStave);
        } catch (e) {
            console.error("Error en dibujarProgresionGrandStaff:", e);
        }
    }

    function dibujarPentagrama(acorde, tonalidadId = null, containerId = "stave", digitacionObj = null) {
        dibujarGrandStaff(acorde, tonalidadId, containerId, digitacionObj);
    }

    return {
        init,
        limpiar,
        dibujarPentagrama,
        dibujarGrandStaff,
        dibujarScore,
        dibujarProgresionScore,
        dibujarProgresionGrandStaff
    };

})();
