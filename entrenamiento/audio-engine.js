const AudioEngine = (() => {
    "use strict";

    const samplers = {};
    const gains = {}; // Nodos de ganancia por tipo
    let orchestraEffects, pianoEffects, masterLimiter;
    let fallbackSynth;
    let initPromise = null;
    let initialized = false;

    // Configuración de volumen persistente (0 a 1)
    const volumenes = {
        piano: 0.8,
        choir: 0.8,
        soprano: 0.8,
        violin: 0.12,
        cello: 0.12,
        viola: 0.12
    };

    const SAMPLE_MAP = {
        piano: {
            urls: { "A0": "A0.mp3", "C1": "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3", "A1": "A1.mp3", "C2": "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3", "A2": "A2.mp3", "C3": "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3", "A4": "A4.mp3", "C5": "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3", "A6": "A6.mp3", "C7": "C7.mp3", "D#7": "Ds7.mp3", "F#7": "Fs7.mp3", "C8": "C8.mp3" },
            baseUrl: "https://tonejs.github.io/audio/salamander/",
            release: 1.5
        },
        soprano: {
            urls: { "C3": "C3.mp3", "Eb3": "Eb3.mp3", "Gb3": "Gb3.mp3", "A3": "A3.mp3", "C4": "C4.mp3", "Eb4": "Eb4.mp3", "Gb4": "Gb4.mp3", "A4": "A4.mp3", "C5": "C5.mp3", "Eb5": "Eb5.mp3", "Gb5": "Gb5.mp3", "A5": "A5.mp3" },
            baseUrl: "https://raw.githubusercontent.com/GLEITZ/midi-js-soundfonts/master/MusyngKite/choir_aahs-mp3/",
            release: 0.5, attack: 0.2
        },
        choir: {
            urls: { "C3": "C3.mp3", "Eb3": "Eb3.mp3", "Gb3": "Gb3.mp3", "A3": "A3.mp3", "C4": "C4.mp3", "Eb4": "Eb4.mp3", "Gb4": "Gb4.mp3", "A4": "A4.mp3", "C5": "C5.mp3", "Eb5": "Eb5.mp3", "Gb5": "Gb5.mp3", "A5": "A5.mp3" },
            baseUrl: "https://raw.githubusercontent.com/GLEITZ/midi-js-soundfonts/master/MusyngKite/choir_aahs-mp3/",
            release: 0.5, attack: 0.2
        },
        violin: {
            urls: { "G3": "G3.mp3", "C4": "C4.mp3", "E4": "E4.mp3", "G4": "G4.mp3", "C5": "C5.mp3", "E5": "E5.mp3", "G5": "G5.mp3" },
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/violin/",
            release: 0.6, attack: 0.1
        },
        cello: {
            urls: { "C2": "C2.mp3", "G2": "G2.mp3", "C3": "C3.mp3", "G3": "G3.mp3", "C4": "C4.mp3" },
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/cello/",
            release: 0.6, attack: 0.1
        },
        viola: {
             urls: { "G3": "G3.mp3", "C4": "C4.mp3", "E4": "E4.mp3", "G4": "G4.mp3", "C5": "C5.mp3", "E5": "E5.mp3", "G5": "G5.mp3" },
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/violin/",
            release: 0.6, attack: 0.1
        }
    };

    function init() {
        if (initialized) return Promise.resolve();
        if (initPromise) return initPromise;
        
        initPromise = (async () => {
            try {
                await Tone.start();
                masterLimiter = new Tone.Limiter(-1).toDestination();

                orchestraEffects = new Tone.Freeverb({ roomSize: 0.5, dampening: 3000, wet: 0.1 }).connect(masterLimiter);
                pianoEffects = new Tone.Freeverb({ roomSize: 0.4, dampening: 4000, wet: 0.15 }).connect(masterLimiter);

                fallbackSynth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "triangle" },
                    envelope: { attack: 0.05, sustain: 0.3, release: 1 }
                }).connect(pianoEffects);

                initialized = true;
                console.log("AudioEngine: Sistema listo con control de volumen.");
                getSampler("piano");
            } catch (e) {
                console.error("AudioEngine Error:", e);
                initPromise = null;
            }
        })();
        return initPromise;
    }

    // valor: 0.0 a 1.0
    function setVolume(tipo, valor) {
        volumenes[tipo] = Math.max(0, Math.min(1, valor));
        if (gains[tipo]) {
            // Conversión lineal a decibelios
            const db = Tone.gainToDb(volumenes[tipo]);
            gains[tipo].gain.rampTo(volumenes[tipo], 0.1);
        }
    }

    async function waitLoad(sampler, timeout = 3000) {
        if (sampler.loaded) return true;
        return new Promise(resolve => {
            const start = Date.now();
            const timer = setInterval(() => {
                if (sampler.loaded) {
                    clearInterval(timer);
                    resolve(true);
                } else if (Date.now() - start > timeout) {
                    clearInterval(timer);
                    resolve(false);
                }
            }, 100);
        });
    }

    async function getSampler(tipo) {
        await init();
        if (!samplers[tipo]) {
            const config = SAMPLE_MAP[tipo] || SAMPLE_MAP.piano;
            
            // Crear nodo de ganancia para este instrumento
            gains[tipo] = new Tone.Gain(volumenes[tipo]);
            
            if (tipo === "piano") {
                gains[tipo].connect(pianoEffects);
            } else {
                gains[tipo].connect(orchestraEffects);
            }

            const samp = new Tone.Sampler({
                urls: config.urls,
                baseUrl: config.baseUrl,
                release: config.release,
                attack: config.attack || 0
            }).connect(gains[tipo]);
            
            samplers[tipo] = samp;
        }
        return samplers[tipo];
    }

    function humanize(inst) {
        const isEns = inst !== "piano";
        return {
            velocity: (isEns ? 0.7 : 0.8) + (Math.random() * 0.1 - 0.05),
            offset: Math.random() * (isEns ? 0.05 : 0.02)
        };
    }

    function detenerTodo() {
        if (!initialized) return;
        Object.values(samplers).forEach(s => { if (s && s.loaded) s.releaseAll(); });
        if (fallbackSynth) fallbackSynth.releaseAll();
    }

    async function tocarArmonico(notas, duracion = "2n", instrumento = "piano") {
        await init();
        detenerTodo();
        const now = Tone.now();
        const nArr = Array.isArray(notas) ? notas : [notas];
        
        nArr.forEach(async (nota, i) => {
            const inst = Array.isArray(instrumento) ? instrumento[i] : instrumento;
            const samp = await getSampler(inst);
            const isReady = await waitLoad(samp, 2500);
            
            if (isReady) {
                const { velocity, offset } = humanize(inst);
                samp.triggerAttackRelease(nota, duracion, now + offset, velocity);
            } else if (inst === "piano") {
                fallbackSynth.triggerAttackRelease(nota, duracion, now);
            }
        });
    }

    async function tocarMelodico(notas, durNota = 0.7, instrumento = "piano") {
        await init();
        detenerTodo();
        const now = Tone.now();
        let nArr = Array.isArray(notas) ? [...notas] : [notas];
        
        // Ordenar notas de grave a agudo para que el arpegio sea siempre ascendente
        nArr.sort((a, b) => Tone.Frequency(a).toMidi() - Tone.Frequency(b).toMidi());

        nArr.forEach(async (nota, i) => {
            const time = now + (i * durNota);
            const inst = Array.isArray(instrumento) ? instrumento[i] : instrumento;
            const samp = await getSampler(inst);
            const isReady = await waitLoad(samp, 2500);

            if (isReady) {
                const { velocity, offset } = humanize(inst);
                samp.triggerAttackRelease(nota, "1n", time + offset, velocity);
            } else if (inst === "piano") {
                fallbackSynth.triggerAttackRelease(nota, "4n", time);
            }
        });
    }

    return { init, detenerTodo, tocarArmonico, tocarMelodico, setVolume };
})();

window.AudioEngine = AudioEngine;
