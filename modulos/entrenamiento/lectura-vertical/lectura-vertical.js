/**
 * lectura-vertical.js
 * Lógica para el módulo de lectura vertical (Directores).
 */
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const FORMACIONES = {
        coral: {
            nombre: "Coro SATB",
            staves: [
                { id: "S", label: "Soprano", clef: "treble", range: [60, 84], inst: "soprano" }, // C4 - C6
                { id: "A", label: "Contralto", clef: "treble", range: [53, 77], inst: "soprano" }, // F3 - F5
                { id: "T", label: "Tenor", clef: "treble", range: [48, 72], inst: "choir", displayOctaveOffset: 1 }, // C3 - C5
                { id: "B", label: "Bajo", clef: "bass", range: [40, 64], inst: "choir" } // E2 - E4
            ]
        },
        sexteto: {
            nombre: "Coro Sexteto (SMATBrB)",
            staves: [
                { id: "S", label: "Soprano", clef: "treble", range: [60, 84], inst: "soprano" },
                { id: "M", label: "Mezzo", clef: "treble", range: [57, 81], inst: "soprano" },
                { id: "A", label: "Contralto", clef: "treble", range: [53, 77], inst: "soprano" },
                { id: "T", label: "Tenor", clef: "treble", range: [48, 72], inst: "choir", displayOctaveOffset: 1 },
                { id: "Br", label: "Barítono", clef: "bass", range: [45, 69], inst: "choir" },
                { id: "B", label: "Bajo", clef: "bass", range: [40, 64], inst: "choir" }
            ]
        },
        cuerdas: {
            nombre: "Cuarteto de Cuerdas",
            staves: [
                { id: "v1", label: "Violín I", clef: "treble", range: [55, 96], inst: "violin" }, // G3 - C7
                { id: "v2", label: "Violín II", clef: "treble", range: [55, 84], inst: "violin" },
                { id: "vla", label: "Viola", clef: "alto", range: [48, 79], inst: "viola" }, // C3 - G5
                { id: "vlc", label: "Cello", clef: "bass", range: [36, 64], inst: "cello" } // C2 - E4
            ]
        }
    };
    const RAICES = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
    const TONALIDADES = ["C", "G", "D", "A", "E", "B", "F#", "C#", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];
    const INVERSIONES = [
        { value: 0, label: "Fund." },
        { value: 1, label: "1ª inv." },
        { value: 2, label: "2ª inv." },
        { value: 3, label: "3ª inv." }
    ];

    const state = {
        modo: "manual", // "manual" | "trainer"
        formacion: "coral",
        manual: {
            raiz: "C",
            tonalidad: "C",
            inversion: 0
        },
        ejercicioActual: null,
        stats: {
            total: 0,
            correctas: 0
        },
        revealActivo: false,
        playingTimeout: null
    };

    const els = {
        stave: document.getElementById("stave"),
        playBtn: document.getElementById("playBtn"),
        arpeggioBtn: document.getElementById("arpeggioBtn"),
        nextBtn: document.getElementById("nextBtn"),
        skipBtn: document.getElementById("skipBtn"),
        feedback: document.getElementById("feedback"),
        optionsContainer: document.getElementById("optionsContainer"),
        modeToggle: document.getElementById("modeToggle"),
        modeLabel: document.getElementById("modeLabel"),
        modeHint: document.getElementById("modeHint"),
        modeControlsHost: document.getElementById("modeControlsHost"),
        chordName: document.getElementById("chordName"),
        chordType: document.getElementById("chordType"),
        chordInversion: document.getElementById("chordInversion"),
        exerciseContext: document.getElementById("exerciseContext"),
        sessionModeBadge: document.getElementById("sessionModeBadge"),
        statsSummary: document.getElementById("statsSummary"),
        progressFill: document.getElementById("progressFill"),
        maestroBtn: document.getElementById("maestroBtn"),
        pianoVol: document.getElementById("pianoVol"),
        choirVol: document.getElementById("choirVol"),
        stringsVol: document.getElementById("stringsVol")
    };

    function ok(val, msg) { if (!val) throw new Error(msg); }

    function updateVolumeVisibility() {
        const isCoral = state.formacion === "coral";
        const isCuerdas = state.formacion === "cuerdas";

        if (els.pianoVol) els.pianoVol.parentElement.style.display = "none";
        if (els.choirVol) {
            els.choirVol.parentElement.style.display = (isCoral || state.formacion === "sexteto") ? "flex" : "none";
        }
        if (els.stringsVol) {
            els.stringsVol.parentElement.style.display = isCuerdas ? "flex" : "none";
        }
    }

    function buscarNotaEnRango(tipoNota, min, max) {
        if (!tipoNota) return "C4";
        try {
            const parseada = NOTAS.parse(tipoNota);
            if (parseada.octave === null) parseada.octave = 4;
            
            let midi = NOTAS.midi(parseada);
            while (midi < min) midi += 12;
            while (midi > max) midi -= 12;
            const octavaFinal = Math.floor(midi / 12) - 1;
            return `${parseada.letter}${parseada.accidental}${octavaFinal}`;
        } catch (e) {
            console.error("Error en buscarNotaEnRango:", e, tipoNota);
            return "C4";
        }
    }

    function renderControlesModo() {
        els.modeControlsHost.innerHTML = "";
        els.modeControlsHost.className = "manual-controls";
        
        const bloqueFormacion = document.createElement("div");
        bloqueFormacion.className = "selector-block";
        bloqueFormacion.innerHTML = `<h3>Formación</h3><div class="compact-grid" id="formGrid"></div>`;
        els.modeControlsHost.appendChild(bloqueFormacion);

        const formGrid = document.getElementById("formGrid");
        Object.keys(FORMACIONES).forEach(key => {
            const btn = crearBoton(key, FORMACIONES[key].nombre, state.formacion === key, "key-btn");
            btn.addEventListener("click", () => {
                if (window.AudioEngine) AudioEngine.detenerTodo();
                state.formacion = key;
                renderControlesModo();
                generarEjercicio();
            });
            formGrid.appendChild(btn);
        });

        updateVolumeVisibility();

        if (state.modo === "trainer") {
            return;
        }

        const bloqueRaiz = document.createElement("div");
        bloqueRaiz.className = "selector-block";
        bloqueRaiz.innerHTML = `<h3>Nota raíz</h3><div class="key-grid" id="rootGrid"></div>`;
        els.modeControlsHost.appendChild(bloqueRaiz);

        const rootGrid = document.getElementById("rootGrid");
        RAICES.forEach(raiz => {
            const btn = crearBoton(raiz, raiz, state.manual.raiz === raiz, `key-btn ${raiz.includes("b") || raiz.includes("#") ? "accidental" : ""}`);
            btn.addEventListener("click", () => {
                if (window.AudioEngine) AudioEngine.detenerTodo();
                state.manual.raiz = raiz;
                renderControlesModo();
                generarEjercicio();
            });
            rootGrid.appendChild(btn);
        });

        const bloqueTonalidad = document.createElement("div");
        bloqueTonalidad.className = "selector-block";
        bloqueTonalidad.innerHTML = `<h3>Tonalidad</h3><div class="compact-grid" id="keyGrid"></div>`;
        els.modeControlsHost.appendChild(bloqueTonalidad);

        const keyGrid = document.getElementById("keyGrid");
        TONALIDADES.forEach(t => {
            const btn = crearBoton(t, t, state.manual.tonalidad === t, `key-btn ${t.includes("b") || t.includes("#") ? "accidental" : ""}`);
            btn.addEventListener("click", () => {
                if (window.AudioEngine) AudioEngine.detenerTodo();
                state.manual.tonalidad = t;
                renderControlesModo();
                generarEjercicio();
            });
            keyGrid.appendChild(btn);
        });

        const bloqueInv = document.createElement("div");
        bloqueInv.className = "selector-block";
        bloqueInv.innerHTML = `<h3>Inversión</h3><div class="compact-inversion-selector" id="invGrid"></div>`;
        els.modeControlsHost.appendChild(bloqueInv);

        const invGrid = document.getElementById("invGrid");
        INVERSIONES.forEach(item => {
            const btn = crearBoton(item.value, item.label, state.manual.inversion === item.value, "inv-btn");
            btn.addEventListener("click", () => {
                if (window.AudioEngine) AudioEngine.detenerTodo();
                state.manual.inversion = item.value;
                renderControlesModo();
                generarEjercicio();
            });
            invGrid.appendChild(btn);
        });
    }

    function crearBoton(value, label, activo, extraClass = "") {
        const btn = document.createElement("button");
        btn.className = `control-btn ${extraClass} ${activo ? "active" : ""}`;
        btn.textContent = label;
        btn.dataset.value = value;
        return btn;
    }

    function generarEjercicio() {
        if (typeof GeneradorEjercicios === "undefined") return;
        state.revealActivo = false;
        limpiarFeedback();
        
        if (state.playingTimeout) {
            clearTimeout(state.playingTimeout);
            state.playingTimeout = null;
        }

        if (state.modo === "trainer") {
            state.ejercicioActual = GeneradorEjercicios.generar({
                config: { octava: Math.floor(Math.random() * 2) + 2 } 
            });
        } else {
            state.ejercicioActual = GeneradorEjercicios.generar({
                raiz: state.manual.raiz,
                tonalidad: state.manual.tonalidad,
                inversion: state.manual.inversion,
                config: { octava: 3 }
            });
        }

        const notasAcorde = state.ejercicioActual.acorde.notas;
        const formacionData = FORMACIONES[state.formacion];
        
        const stavesData = formacionData.staves.map((s, i) => {
            const notaBase = notasAcorde[i % notasAcorde.length];
            const notaAjustada = buscarNotaEnRango(notaBase, s.range[0], s.range[1]);
            
            const notasFinales = [notaAjustada];
            
            // Lógica de Divisi (solo para voces y con probabilidad)
            const esVoz = ["soprano", "choir"].includes(s.inst);
            if (esVoz && Math.random() < 0.2) {
                // Buscamos otra nota del mismo acorde que quepa en el rango
                const otrasNotas = notasAcorde.filter(n => n !== notaBase);
                for (const on of otrasNotas) {
                    const adj = buscarNotaEnRango(on, s.range[0], s.range[1]);
                    // Solo añadir si es una nota distinta a la que ya tenemos
                    if (adj !== notaAjustada) {
                        notasFinales.push(adj);
                        break; 
                    }
                }
            }

            return {
                id: s.id,
                label: s.label,
                clef: s.clef,
                notas: notasFinales,
                inst: s.inst,
                displayOctaveOffset: s.displayOctaveOffset
            };
        });

        if (window.VexFlowManager) {
            VexFlowManager.dibujarScore(stavesData, state.ejercicioActual.tonalidad);
        }

        renderInfoOculta();
        renderContexto();
        renderOpciones();
        actualizarSidebar();
        
        if (window.AudioEngine && state.ejercicioActual.acorde.notas) {
            // Recolectamos todas las notas incluyendo las de divisi
            const todasNotas = [];
            const todosInsts = [];
            stavesData.forEach(s => {
                s.notas.forEach(n => {
                    todasNotas.push(n);
                    todosInsts.push(s.inst);
                });
            });

            console.log("LecturaVertical: Tocando acorde", todasNotas, todosInsts);
            if (todasNotas.length > 0) {
                state.playingTimeout = setTimeout(() => {
                    AudioEngine.tocarArmonico(todasNotas, "2n", todosInsts);
                }, 600);
            }
        }
    }

    function renderInfoOculta() {
        if (!state.ejercicioActual) return;
        els.chordName.textContent = state.revealActivo ? state.ejercicioActual.acorde.nombre : "Acorde oculto";
        els.chordType.textContent = state.revealActivo 
            ? "" 
            : "Analiza la partitura";
        els.chordInversion.textContent = state.revealActivo 
            ? `Inversión ${state.ejercicioActual.acorde.inversion}` 
            : "Lectura Vertical";
    }

    function renderContexto() {
        if (!state.ejercicioActual) return;
        els.exerciseContext.innerHTML = `
            <div class="context-card">
                <div class="context-row"><span>Modo</span> <strong>${state.modo === "trainer" ? "Entrenador" : "Manual"}</strong></div>
                <div class="context-row"><span>Formación</span> <strong>${FORMACIONES[state.formacion].nombre}</strong></div>
                <div class="context-row"><span>Tonalidad</span> <strong>${state.ejercicioActual.tonalidad || "C"}</strong></div>
            </div>
        `;
    }

    function cambiarModo() {
        if (window.AudioEngine) AudioEngine.detenerTodo();
        state.modo = (state.modo === "trainer") ? "manual" : "trainer";
        els.modeLabel.textContent = state.modo === "trainer" ? "Modo entrenador" : "Modo manual";
        els.sessionModeBadge.textContent = state.modo === "trainer" ? "Entrenador" : "Manual";
        renderControlesModo();
        generarEjercicio();
    }

    function renderOpciones() {
        els.optionsContainer.innerHTML = "";
        els.optionsContainer.className = "two-step-options";
        if (typeof TIPOS_ACORDE === "undefined") return;

        const bloque = document.createElement("div");
        bloque.className = "step-section fade-in";
        bloque.innerHTML = `<h4>Identifica el acorde</h4><div class="type-selector-grid" id="opcionesInternas"></div>`;
        els.optionsContainer.appendChild(bloque);

        const container = document.getElementById("opcionesInternas");
        TIPOS_ACORDE.listar().forEach(t => {
            const btn = document.createElement("button");
            btn.className = "type-btn";
            btn.textContent = t.nombre;
            btn.dataset.id = t.id;
            btn.onclick = () => evaluar(t.id, btn);
            container.appendChild(btn);
        });
    }

    function evaluar(respuesta, btnRef) {
        state.stats.total++;
        const correcta = state.ejercicioActual.acorde.tipo === respuesta;
        
        // Limpiar estados previos de botones
        document.querySelectorAll(".type-btn").forEach(b => b.classList.remove("correct", "incorrect"));
        
        if (correcta) {
            if (window.AudioEngine) AudioEngine.detenerTodo();
            state.stats.correctas++;
            state.revealActivo = true;
            renderInfoOculta();
            els.feedback.textContent = "¡Correcto, Director! " + state.ejercicioActual.acorde.nombre;
            els.feedback.className = "feedback show correct";
            
            if (btnRef) btnRef.classList.add("correct");
            
            setTimeout(generarEjercicio, 1800);
        } else {
            els.feedback.textContent = "Error en la lectura. Revisa las voces.";
            els.feedback.className = "feedback show incorrect";
            if (btnRef) btnRef.classList.add("incorrect");
        }
        actualizarSidebar();
    }

    function actualizarSidebar() {
        if (!els.statsSummary) return;
        const perc = state.stats.total > 0 ? Math.round((state.stats.correctas / state.stats.total) * 100) : 0;
        els.statsSummary.innerHTML = `
            <strong>Intentos:</strong> ${state.stats.total}<br>
            <strong>Aciertos:</strong> ${state.stats.correctas}<br>
            <strong>Precisión:</strong> ${perc}%
        `;
        els.progressFill.style.width = `${perc}%`;
    }

    function limpiarFeedback() {
        els.feedback.textContent = "";
        els.feedback.className = "feedback";
    }

    function init() {
        if (window.AudioEngine) AudioEngine.detenerTodo();
        els.nextBtn.onclick = generarEjercicio;
        els.skipBtn.onclick = generarEjercicio;
        els.modeToggle.onclick = cambiarModo;
        if (els.playBtn) els.playBtn.onclick = () => {
            if (state.ejercicioActual) {
                const formData = FORMACIONES[state.formacion];
                const notas = formData.staves.map((s, i) => buscarNotaEnRango(state.ejercicioActual.acorde.notas[i % state.ejercicioActual.acorde.notas.length], s.range[0], s.range[1]));
                const insts = formData.staves.map(s => s.inst);
                AudioEngine.tocarArmonico(notas, "1n", insts);
            }
        };
        if (els.arpeggioBtn) els.arpeggioBtn.onclick = () => {
            if (state.ejercicioActual) {
                const formData = FORMACIONES[state.formacion];
                const notas = formData.staves.map((s, i) => buscarNotaEnRango(state.ejercicioActual.acorde.notas[i % state.ejercicioActual.acorde.notas.length], s.range[0], s.range[1]));
                const insts = formData.staves.map(s => s.inst);
                AudioEngine.tocarMelodico(notas, 0.7, insts);
            }
        };

        // Control de volumen
        if (els.choirVol) {
            els.choirVol.addEventListener("input", (e) => {
                const val = e.target.value / 100;
                if (window.AudioEngine) {
                    AudioEngine.setVolume("choir", val);
                    AudioEngine.setVolume("soprano", val);
                }
            });
        }
        if (els.stringsVol) {
            els.stringsVol.addEventListener("input", (e) => {
                const val = e.target.value / 100;
                if (window.AudioEngine) {
                    AudioEngine.setVolume("violin", val);
                    AudioEngine.setVolume("viola", val);
                    AudioEngine.setVolume("cello", val);
                }
            });
        }

        if (els.maestroBtn && window.LLMMaestro) {
            els.maestroBtn.onclick = async () => {
                const content = document.getElementById("maestroContent");
                const panel = document.getElementById("maestroPanel");
                const loading = document.getElementById("maestroLoading");
                panel.classList.remove("hidden");
                loading.classList.remove("hidden");
                content.innerHTML = "";
                try {
                    const res = await LLMMaestro.consultar({
                        modulo: "lectura_vertical",
                        ejercicio: state.ejercicioActual,
                        stats: state.stats
                    });
                    
                    if (res.ok && res.respuesta) {
                        content.innerHTML = `<div class="maestro-texto">${res.respuesta.replace(/\n/g, "<br>")}</div>`;
                    } else {
                        content.innerHTML = `<p class="error">${res.error || "Error al consultar al Maestro"}</p>`;
                    }
                } catch (e) {
                    content.innerHTML = `<p>Error: ${e.message}</p>`;
                } finally {
                    loading.classList.add("hidden");
                }
            };
            document.getElementById("maestroClose").onclick = () => {
                document.getElementById("maestroPanel").classList.add("hidden");
            };
        }

        renderControlesModo();
        generarEjercicio();
    }

    init();
});
