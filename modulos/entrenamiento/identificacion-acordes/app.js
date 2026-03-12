document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const MODULO = "identificacion_acordes";
    const RAICES = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
    const TONALIDADES = ["C", "G", "D", "A", "E", "B", "F#", "C#", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];
    const INVERSIONES = [
        { value: null, label: "Libre" },
        { value: 0, label: "Fund." },
        { value: 1, label: "1ª" },
        { value: 2, label: "2ª" }
    ];

    const FALLBACK_TYPES = {
        major: { nombre: "Tríada Mayor", simbolo: "" },
        minor: { nombre: "Tríada Menor", simbolo: "m" },
        augmented: { nombre: "Tríada Aumentada", simbolo: "+" },
        diminished: { nombre: "Tríada Disminuida", simbolo: "°" },
        dom7: { nombre: "Séptima Dominante", simbolo: "7" },
        maj7: { nombre: "Séptima Mayor", simbolo: "maj7" },
        min7: { nombre: "Séptima Menor", simbolo: "m7" },
        halfDim7: { nombre: "Semidisminuido 7", simbolo: "ø7" },
        dim7: { nombre: "Disminuido 7", simbolo: "°7" }
    };

    const state = {
        modo: "manual",
        ejercicioActual: null,
        inicioTiempo: 0,
        revealActivo: false,
        pistaUsada: false,
        manual: {
            raiz: "C",
            tonalidad: "C",
            inversion: 0
        },
        stats: {
            total: 0,
            correctas: 0,
            omitidas: 0,
            pistas: 0,
            revelados: 0
        },
        ultimaEvaluacion: null,
        config: {
            ocultarRaiz: true
        },
        nextTimeout: null,
        respuestaCarga: {
            raizPasoSuperado: false,
            raizManual: null,
            tipoManual: null
        },
        rachaErrores: 0
    };

    const els = {
        modeLabel: document.getElementById("modeLabel"),
        modeHint: document.getElementById("modeHint"),
        modeToggle: document.getElementById("modeToggle"),
        modeControlsHost: document.getElementById("modeControlsHost"),

        chordName: document.getElementById("chordName"),
        chordType: document.getElementById("chordType"),
        chordInversion: document.getElementById("chordInversion"),

        optionsContainer: document.getElementById("optionsContainer"),
        feedback: document.getElementById("feedback"),
        hintBox: document.getElementById("hintBox"),
        exerciseContext: document.getElementById("exerciseContext"),

        skipBtn: document.getElementById("skipBtn"),
        nextBtn: document.getElementById("nextBtn"),
        playBtn: document.getElementById("playBtn"),
        arpeggioBtn: document.getElementById("arpeggioBtn"),

        progressFill: document.getElementById("progressFill"),
        statsSummary: document.getElementById("statsSummary"),
        strengthsBox: document.getElementById("strengthsBox"),
        weaknessesBox: document.getElementById("weaknessesBox"),
        recommendationBox: document.getElementById("recommendationBox"),
        sessionModeBadge: document.getElementById("sessionModeBadge"),
        maestroBtn: document.getElementById("maestroBtn"),
        maestroPanel: document.getElementById("maestroPanel"),
        maestroContent: document.getElementById("maestroContent"),
        maestroLoading: document.getElementById("maestroLoading"),
        maestroError: document.getElementById("maestroError"),
        maestroClose: document.getElementById("maestroClose"),
        pianoVol: document.getElementById("pianoVol")
    };

    function ok(cond, msg) {
        if (!cond) throw new Error(msg);
    }

    function errorUI(msg) {
        console.error(msg);
        if (els.feedback) {
            els.feedback.textContent = msg;
            els.feedback.className = "feedback show incorrect";
        }
    }

    function shuffle(arr) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    function nombreInversion(numero) {
        return ["Estado fundamental", "Primera inversión", "Segunda inversión", "Tercera inversión"][numero] || "Inversión";
    }

    function tiposDisponibles() {
        try {
            if (window.TIPOS_ACORDE && typeof window.TIPOS_ACORDE.listar === "function") {
                return window.TIPOS_ACORDE.listar().map(t => t.id);
            }
        } catch (_) {}
        return Object.keys(FALLBACK_TYPES);
    }

    function tipoMeta(tipoId) {
        try {
            if (window.TIPOS_ACORDE && typeof TIPOS_ACORDE.obtener === "function") {
                return TIPOS_ACORDE.obtener(tipoId);
            }
        } catch (_) {}
        return FALLBACK_TYPES[tipoId] || { nombre: tipoId, simbolo: "" };
    }

    function limpiarFeedback() {
        els.feedback.textContent = "";
        els.feedback.className = "feedback";
        els.hintBox.textContent = "Sin pista.";
    }

    function mostrarFeedback(texto, clase = "") {
        els.feedback.textContent = texto;
        els.feedback.className = `feedback show ${clase}`.trim();
    }

    function crearBoton(valor, texto, activo, claseExtra = "") {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `key-btn ${claseExtra} ${activo ? "active" : ""}`.trim();
        btn.textContent = texto;
        btn.dataset.value = valor === null ? "null" : String(valor);
        return btn;
    }

    function subirSemitono(nota) {
        const mapa = {
            C: "C#", "C#": "D", Db: "D", D: "D#", "D#": "E", Eb: "E",
            E: "F", F: "F#", "F#": "G", Gb: "G", G: "G#", "G#": "A",
            Ab: "A", A: "A#", "A#": "B", Bb: "B", B: "C"
        };
        const m = nota.match(/^([A-G][b#]?)(\d)$/);
        if (!m) return nota;
        let [, p, o] = m;
        let next = mapa[p] || p;
        let oct = Number(o);
        if (p === "B") oct += 1;
        return `${next}${oct}`;
    }

    function bajarSemitono(nota) {
        const mapa = {
            C: "B", "C#": "C", Db: "C", D: "Db", "D#": "D", Eb: "D",
            E: "Eb", F: "E", "F#": "F", Gb: "F", G: "Gb", "G#": "G",
            Ab: "G", A: "Ab", "A#": "A", Bb: "A", B: "Bb"
        };
        const m = nota.match(/^([A-G][b#]?)(\d)$/);
        if (!m) return nota;
        let [, p, o] = m;
        let next = mapa[p] || p;
        let oct = Number(o);
        if (p === "C") oct -= 1;
        return `${next}${oct}`;
    }

    function rotarNotas(notas, inversion) {
        const arr = [...notas];
        for (let i = 0; i < inversion; i++) {
            const n = arr.shift();
            const m = n.match(/^([A-G][b#]?)(\d)$/);
            if (m) {
                arr.push(`${m[1]}${Number(m[2]) + 1}`);
            } else {
                arr.push(n);
            }
        }
        return arr;
    }

    function construirAcordeLocal(raiz = "C", tipo = "major", inversion = 0, tonalidad = "C", octava = 4) {
        if (window.TEORIA && window.TEORIA.acordes && typeof window.TEORIA.acordes.construir === "function") {
            try {
                console.log(`[TEORIA] Construyendo acorde: ${raiz} ${tipo} inv:${inversion} oct:${octava}`);
                const acorde = window.TEORIA.acordes.construir(raiz, tipo, inversion, octava);
                return {
                    id: `local_${Date.now()}`,
                    modo: "identificacion",
                    origen: "teoria_engine",
                    tonalidad,
                    acorde: {
                        raiz: acorde.raiz,
                        tipo: acorde.tipo,
                        inversion: acorde.inversion,
                        nombre: acorde.nombre,
                        bajo: acorde.bajo,
                        notas: acorde.notas
                    },
                    respuestaCorrecta: {
                        fundamental: acorde.raiz,
                        tipoId: acorde.tipo,
                        inversion: acorde.inversion
                    },
                    meta: {
                        modulo: MODULO,
                        focoCategoria: "teoria_engine",
                        focoValor: tipo
                    }
                };
            } catch (e) {
                console.warn("Fallo al construir usando TEORIA engine, usando fallback local:", e);
            }
        } else {
            console.warn("[FALLBACK] TEORIA engine no disponible. Usando generador simple local.");
        }

        const mapas = {
            C: ["C4", "E4", "G4"],
            D: ["D4", "F#4", "A4"],
            E: ["E4", "G#4", "B4"],
            F: ["F4", "A4", "C5"],
            "F#": ["F#3", "A#3", "C#4"],
            G: ["G3", "B3", "D4"],
            A: ["A3", "C#4", "E4"],
            B: ["B3", "D#4", "F#4"],
            Db: ["Db4", "F4", "Ab4"],
            Eb: ["Eb4", "G4", "Bb4"],
            Ab: ["Ab3", "C4", "Eb4"],
            Bb: ["Bb3", "D4", "F4"]
        };

        let notas = mapas[raiz] || ["C4", "E4", "G4"];
        const tLower = (tipo || "").toLowerCase();

        if (tLower.includes("minor") || tLower.includes("min")) {
            notas = [notas[0], bajarSemitono(notas[1]), notas[2]];
        } else if (tLower.includes("dim")) {
            notas = [notas[0], bajarSemitono(notas[1]), bajarSemitono(notas[2])];
        } else if (tLower.includes("aug")) {
            notas = [notas[0], notas[1], subirSemitono(notas[2])];
        }

        const rotadas = rotarNotas(notas, inversion);
        const bajo = rotadas[0].replace(/\d+$/, "");

        return {
            id: `local_${Date.now()}`,
            modo: "identificacion",
            origen: "fallback_local",
            tonalidad,
            acorde: {
                raiz,
                tipo,
                inversion,
                nombre: `${raiz}${tipoMeta(tipo).simbolo}`,
                bajo,
                notas: rotadas
            },
            respuestaCorrecta: {
                fundamental: raiz,
                tipoId: tipo,
                inversion
            },
            meta: {
                modulo: MODULO,
                focoCategoria: "fallback_local",
                focoValor: tipo,
                octava: octava
            }
        };
    }

   function construirEjercicioFallback() {
    const tipos = tiposDisponibles();
    const raiz = RAICES[Math.floor(Math.random() * RAICES.length)];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)] || "major";
    const tonalidad = TONALIDADES[Math.floor(Math.random() * TONALIDADES.length)] || "C";
    const inversion = Math.floor(Math.random() * 3);
    const octava = Math.floor(Math.random() * 4) + 2; // Octava 2 a 5 (C2 a B5)
    return construirAcordeLocal(raiz, tipo, inversion, tonalidad, octava);
}

    function construirEjercicioManual() {
        const tipos = tiposDisponibles();
        const tipo = tipos[Math.floor(Math.random() * tipos.length)] || "major";
        const inversion = Number.isInteger(state.manual.inversion) ? state.manual.inversion : 0;
        const octava = Math.floor(Math.random() * 3) + 2; // Rango variado 2 a 4 para modo manual inicial
        return construirAcordeLocal(state.manual.raiz, tipo, inversion, state.manual.tonalidad, octava);
    }

    function generarEjercicioSeguro() {
    try {
        if (state.modo === "trainer" && window.AIEngine && typeof AIEngine.generarEjercicio === "function") {
            const ej = AIEngine.generarEjercicio({ modulo: MODULO });

            if (
                ej &&
                ej.acorde &&
                Array.isArray(ej.acorde.notas) &&
                ej.acorde.notas.length &&
                ej.respuestaCorrecta
            ) {
                return ej;
            }
        }

        if (state.modo === "manual") {
            return construirEjercicioManual();
        }

        if (window.GeneradorEjercicios && typeof GeneradorEjercicios.generar === "function") {
            const tipos = tiposDisponibles();
            const raiz = RAICES[Math.floor(Math.random() * RAICES.length)];
            const tipo = tipos[Math.floor(Math.random() * tipos.length)] || "major";
            const tonalidad = TONALIDADES[Math.floor(Math.random() * TONALIDADES.length)] || "C";
            const inversion = Math.floor(Math.random() * 3);

            const ej = GeneradorEjercicios.generar({
                raiz,
                tonalidad,
                tipo,
                inversion
            });

            if (
                ej &&
                ej.acorde &&
                Array.isArray(ej.acorde.notas) &&
                ej.acorde.notas.length &&
                ej.respuestaCorrecta
            ) {
                return ej;
            }
        }

        return construirEjercicioFallback();
    } catch (e) {
        errorUI(`Fallback activo: ${e.message}`);
        return construirEjercicioFallback();
    }
}

    function renderControlesModo() {
    els.modeControlsHost.innerHTML = "";

    if (state.modo === "trainer") {
        els.modeControlsHost.className = "mode-controls-host hidden";
        return;
    }

    els.modeControlsHost.className = "manual-controls";

    const bloqueRaiz = document.createElement("div");
    bloqueRaiz.className = "selector-block";
    bloqueRaiz.innerHTML = `<h3>Nota raíz</h3><div class="key-grid" id="rootGrid"></div>`;

    const bloqueTonalidad = document.createElement("div");
    bloqueTonalidad.className = "selector-block";
    bloqueTonalidad.innerHTML = `<h3>Tonalidad</h3><div class="compact-grid" id="keyGrid"></div>`;

    const bloqueInv = document.createElement("div");
    bloqueInv.className = "selector-block";
    bloqueInv.innerHTML = `<h3>Inversión</h3><div class="compact-inversion-selector" id="invGrid"></div>`;

    els.modeControlsHost.appendChild(bloqueRaiz);
    els.modeControlsHost.appendChild(bloqueTonalidad);
    els.modeControlsHost.appendChild(bloqueInv);

    const rootGrid = document.getElementById("rootGrid");
    RAICES.forEach(raiz => {
        const btn = crearBoton(
            raiz,
            raiz,
            state.manual.raiz === raiz,
            raiz.includes("b") || raiz.includes("#") ? "accidental" : ""
        );
        btn.addEventListener("click", () => {
            state.manual.raiz = raiz;
            renderControlesModo();
            generarEjercicio();
        });
        rootGrid.appendChild(btn);
    });

    const keyGrid = document.getElementById("keyGrid");
    TONALIDADES.forEach(tonalidad => {
        const btn = crearBoton(
            tonalidad,
            tonalidad,
            state.manual.tonalidad === tonalidad,
            tonalidad.includes("b") || tonalidad.includes("#") ? "accidental" : ""
        );
        btn.addEventListener("click", () => {
            state.manual.tonalidad = tonalidad;
            renderControlesModo();
            generarEjercicio();
        });
        keyGrid.appendChild(btn);
    });

    const invGrid = document.getElementById("invGrid");
    INVERSIONES.forEach(item => {
        const btn = crearBoton(item.value, item.label, state.manual.inversion === item.value, "inv-btn");
        btn.addEventListener("click", () => {
            state.manual.inversion = item.value;
            renderControlesModo();
            generarEjercicio();
        });
        invGrid.appendChild(btn);
    });
}
    function renderInfoOculta() {
        if (!state.ejercicioActual) return;

        els.chordName.textContent = state.revealActivo ? state.ejercicioActual.acorde.nombre : "Acorde oculto";
        els.chordType.textContent = state.revealActivo
            ? tipoMeta(state.ejercicioActual.acorde.tipo).nombre
            : "Identifica la estructura armónica mostrada";
        els.chordInversion.textContent = state.revealActivo
            ? `${nombreInversion(state.ejercicioActual.acorde.inversion)} · tonalidad ${state.ejercicioActual.tonalidad || "C"}`
            : "Grand staff · clave de sol y fa";
    }

   function renderContexto() {
    if (!state.ejercicioActual) return;

    els.exerciseContext.innerHTML = `
        <div class="context-card">
            <div class="context-row">
                <span class="context-label">Modo</span>
                <span class="context-value">${state.modo === "trainer" ? "Entrenador" : "Manual"}</span>
            </div>
            <div class="context-row">
                <span class="context-label">Tonalidad</span>
                <span class="context-value">${state.ejercicioActual.tonalidad || "C"}</span>
            </div>
            <div class="context-row">
                <span class="context-label">Origen</span>
                <span class="context-value">${state.ejercicioActual.origen || "adaptativo"}</span>
            </div>
            <div class="context-row">
                <span class="context-label">Foco IA</span>
                <span class="context-value">${state.ejercicioActual.meta?.focoCategoria || "Aleatorio"}</span>
            </div>
        </div>
    `;
}

    function renderPentagrama() {
        try {
            if (!window.VexFlowManager) throw new Error("VexFlowManager no disponible.");
            if (!state.ejercicioActual?.acorde?.notas?.length) return;
            
            window.VexFlowManager.dibujarGrandStaff(
                state.ejercicioActual.acorde,
                state.ejercicioActual.tonalidad || "C",
                "stave"
            );
        } catch (e) {
            console.error(e);
            errorUI(`Error al dibujar: ${e.message}`);
        }
    }

    function generarDistractores(correcto) {
        const usados = new Set([`${correcto.raiz}|${correcto.tipo}|${correcto.inversion}`]);
        const distractores = [];

        for (const tipo of shuffle(tiposDisponibles())) {
            if (distractores.length >= 3) break;
            const key = `${correcto.raiz}|${tipo}|${correcto.inversion}`;
            if (usados.has(key)) continue;
            usados.add(key);
            distractores.push({ raiz: correcto.raiz, tipo, inversion: correcto.inversion });
        }

        for (const inv of [0, 1, 2]) {
            if (distractores.length >= 5) break;
            const key = `${correcto.raiz}|${correcto.tipo}|${inv}`;
            if (usados.has(key)) continue;
            usados.add(key);
            distractores.push({ raiz: correcto.raiz, tipo: correcto.tipo, inversion: inv });
        }

        for (const raiz of shuffle(RAICES)) {
            if (distractores.length >= 7) break;
            const key = `${raiz}|${correcto.tipo}|${correcto.inversion}`;
            if (usados.has(key)) continue;
            usados.add(key);
            distractores.push({ raiz, tipo: correcto.tipo, inversion: correcto.inversion });
        }

        return distractores.slice(0, 7);
    }

    function bloquearOpciones(valor = true) {
        els.optionsContainer.querySelectorAll("button").forEach(btn => {
            btn.disabled = valor;
        });
    }

    function marcarRespuestaCorrecta() {
        if (!state.ejercicioActual) return;
        const correcta = {
            raiz: state.ejercicioActual.acorde.raiz,
            tipo: state.ejercicioActual.acorde.tipo
        };

        els.optionsContainer.querySelectorAll(".root-btn").forEach(btn => {
            if (btn.dataset.value === correcta.raiz) btn.classList.add("correct");
        });
        els.optionsContainer.querySelectorAll(".type-btn").forEach(btn => {
            if (btn.dataset.value === correcta.tipo) btn.classList.add("correct");
        });
    }

    function continuarSiguienteEjercicio() {
        if (state.nextTimeout) clearTimeout(state.nextTimeout);
        state.nextTimeout = setTimeout(generarEjercicio, 900);
    }

    function procesarExitoGlobal(intento) {
        if (window.AudioEngine) AudioEngine.detenerTodo();
        state.stats.correctas++;
        bloquearOpciones(true);
        mostrarResultado(intento);
        continuarSiguienteEjercicio();
    }

    function evaluarTipoAutomaticamente(tipo, btnDOM) {
        // En modo manual O si no se oculta la raíz, la raíz ya se da por sabida
        const debeOcultarRaiz = state.modo === "trainer" && state.config.ocultarRaiz;
        const raizAUsar = debeOcultarRaiz
            ? state.respuestaCarga.raizManual
            : state.ejercicioActual.acorde.raiz;
            
        state.respuestaCarga.tipoManual = tipo;
        
        // La UI actual no le pide al usuario identificar la inversión.
        // Simulamos que el usuario introdujo correctamente la inversión para que el engine lo marque como "correctoTotal".
        const inversionDelEjercicio = state.ejercicioActual && state.ejercicioActual.acorde ? state.ejercicioActual.acorde.inversion : 0;
        
        const respuesta = { raiz: raizAUsar, tipo: tipo, inversion: inversionDelEjercicio };
        const intento = (window.IdentificacionAcordes && window.IdentificacionAcordes.evaluarIntento)
            ? window.IdentificacionAcordes.evaluarIntento(state.ejercicioActual, respuesta, tiempoActual())
            : evaluarLocalmente(respuesta);

        state.stats.total++;

        if (intento.resultado && intento.resultado.correcto) {
            btnDOM.classList.add("correct");
            procesarExitoGlobal(intento);
        } else {
            btnDOM.classList.add("incorrect");
            mostrarResultado(intento);
        }
    }

    function evaluarRaizAutomaticamente(raiz, btnDOM) {
        if (!state.ejercicioActual) return;
        
        state.respuestaCarga.raizManual = raiz;
        document.querySelectorAll(".root-btn").forEach(b => b.classList.remove("active", "incorrect"));

        if (raiz === state.ejercicioActual.acorde.raiz) {
            btnDOM.classList.add("correct");
            state.respuestaCarga.raizPasoSuperado = true;
            mostrarFeedback("Raíz correcta. Ahora identifica el tipo:", "hint");
            renderOpciones(); // Re-render to show types
        } else {
            btnDOM.classList.add("incorrect");
            mostrarFeedback("Esa no es la raíz correcta.", "incorrect");
        }
    }

    function renderBloqueRaiz(correctaRaiz) {
        const bloqueRaiz = document.createElement("div");
        bloqueRaiz.className = "step-section";
        bloqueRaiz.innerHTML = `<h4>1. Identifica la Nota Raíz</h4><div class="root-selector-grid"></div>`;
        const rootGrid = bloqueRaiz.querySelector(".root-selector-grid");

        RAICES.forEach(raiz => {
            const esAlterada = raiz.includes("b") || raiz.includes("#");
            const btn = crearBoton(raiz, raiz, false, `root-btn ${esAlterada ? "accidental" : ""}`);
            btn.addEventListener("click", () => evaluarRaizAutomaticamente(raiz, btn));
            rootGrid.appendChild(btn);
        });
        
        return bloqueRaiz;
    }

    function renderBloqueTipo() {
        const tipos = tiposDisponibles();
        const bloqueTipo = document.createElement("div");
        bloqueTipo.className = "step-section fade-in";
        bloqueTipo.innerHTML = `<h4>2. Identifica el Tipo de Acorde</h4><div class="type-selector-grid"></div>`;
        const typeGrid = bloqueTipo.querySelector(".type-selector-grid");

        tipos.forEach(tipo => {
            const meta = tipoMeta(tipo);
            const btn = crearBoton(tipo, meta.nombre, false, "type-btn");
            btn.addEventListener("click", () => evaluarTipoAutomaticamente(tipo, btn));
            typeGrid.appendChild(btn);
        });
        return bloqueTipo;
    }

    function renderOpciones() {
        els.optionsContainer.className = "two-step-options";
        els.optionsContainer.innerHTML = "";
        
        if (!state.ejercicioActual) return;

        // Limpiar control superior (si ya teníamos botón, lo reutilizamos para no crear duplicados)
        let controlRaiz = document.getElementById("rootVisibilityToggle");
        
        // Solo mostrar el toggle de raíz si estamos en modo entrenador
        if (state.modo === "trainer") {
            if (!controlRaiz) {
                controlRaiz = document.createElement("button");
                controlRaiz.id = "rootVisibilityToggle";
                controlRaiz.className = "root-toggle-btn";
                controlRaiz.addEventListener("click", () => {
                    state.config.ocultarRaiz = !state.config.ocultarRaiz;
                    generarEjercicio(); // Reinicia el flujo actual al cambiar de modo
                });
            }
            controlRaiz.textContent = state.config.ocultarRaiz ? "Mostrar Raíz" : "Ocultar Raíz (Evaluar)";
            els.optionsContainer.appendChild(controlRaiz);
        }

        // En modo manual, siempre mostramos la raíz elegida y bloqueamos ocultarla
        const debeOcultarRaiz = state.modo === "trainer" && state.config.ocultarRaiz;

        if (!debeOcultarRaiz) {
            // Mostrar raíz explícitamente y saltar al tipo
            const infoRaiz = document.createElement("div");
            infoRaiz.className = "root-info-text";
            infoRaiz.innerHTML = `Raíz mostrada: <strong>${state.ejercicioActual.acorde.raiz}</strong>`;
            els.optionsContainer.appendChild(infoRaiz);
            
            els.optionsContainer.appendChild(renderBloqueTipo());
        } else {
            // Evaluando raíz primero (solo aplicable al Entrenador adaptativo)
            if (!state.respuestaCarga.raizPasoSuperado) {
                els.optionsContainer.appendChild(renderBloqueRaiz());
            } else {
                // Ya pasó la raíz, mostramos el éxito pasado arriba y los tipos abajo
                const infoRaizOk = document.createElement("div");
                infoRaizOk.className = "root-info-text correct-root";
                infoRaizOk.innerHTML = `Raíz identificada: <strong>${state.respuestaCarga.raizManual}</strong> ✓`;
                els.optionsContainer.appendChild(infoRaizOk);
                
                els.optionsContainer.appendChild(renderBloqueTipo());
            }
        }
    }

    function tiempoActual() {
        return (Date.now() - state.inicioTiempo) / 1000;
    }

    function evaluarLocalmente(respuesta) {
        const c = state.ejercicioActual.respuestaCorrecta;
        const correcto = c.fundamental === respuesta.raiz && c.tipoId === respuesta.tipo && c.inversion === respuesta.inversion;

        return {
            valido: true,
            resultado: {
                correcto,
                diagnostico: {
                    retroalimentacion: {
                        breve: correcto ? "Correcto." : "Respuesta incorrecta.",
                        detalle: correcto ? "Identificación correcta." : `La respuesta correcta era ${state.ejercicioActual.acorde.nombre}.`
                    }
                }
            },
            pista: correcto ? null : `Observa el bajo: ${state.ejercicioActual.acorde.bajo}.`
        };
    }

    function mostrarResultado(intento) {
        if (!intento?.valido) {
            mostrarFeedback(intento?.error || "No se pudo evaluar el intento.", "incorrect");
            return;
        }
        if (intento.resultado) state.ultimaEvaluacion = intento.resultado;

        const texto = intento.resultado?.diagnostico?.retroalimentacion?.breve || "Sin diagnóstico.";

        if (intento.pista) els.hintBox.textContent = intento.pista;

        if (intento.resultado.correcto) {
            state.rachaErrores = 0;
            mostrarFeedback(state.pistaUsada ? "Correcto con ayuda previa." : texto, "correct");
            actualizarSidebar();
            
            if (state.nextTimeout) clearTimeout(state.nextTimeout);
            state.nextTimeout = setTimeout(generarEjercicio, 700);
            return;
        }

        state.rachaErrores++;
        if (state.rachaErrores >= 3) {
            setTimeout(consultarMaestro, 1500);
        }

        mostrarFeedback(texto, "incorrect");
        actualizarSidebar();
    }

    function omitirEjercicio() {
        if (!state.ejercicioActual) return;
        if (window.AudioEngine) AudioEngine.detenerTodo();

        state.stats.total++;
        state.stats.omitidas++;

        bloquearOpciones(true);
        marcarRespuestaCorrecta();
        mostrarFeedback("Ejercicio omitido. Respuesta penalizada.", "incorrect");
        actualizarSidebar();

        continuarSiguienteEjercicio();
    }



    function formatearMetricas(lista, clase) {
        if (!lista?.length) {
            return `<div class="${clase}"><span>Sin datos aún</span><span class="stat-value">—</span></div>`;
        }

        return lista.slice(0, 5).map(item => {
            const etiqueta = item.clave || item.valor || item.categoria || "sin etiqueta";
            const precision = item.precision ?? item.porcentaje ?? 0;
            return `<div class="${clase}"><span>${etiqueta}</span><span class="stat-value">${precision}%</span></div>`;
        }).join("");
    }

    async function consultarMaestro() {
        if (!els.maestroBtn || !els.maestroPanel) return;
        els.maestroPanel.classList.remove("hidden");
        els.maestroContent.classList.add("hidden");
        els.maestroLoading.classList.remove("hidden");
        els.maestroError.classList.add("hidden");
        els.maestroContent.innerHTML = "";

        const tipo = state.ejercicioActual && state.ultimaEvaluacion && !state.ultimaEvaluacion.correcto
            ? "retroalimentacion_error"
            : "resumen_sesion";

        try {
            const resp = await (window.AIEngine?.consultar?.({
                tipo,
                modulo: MODULO,
                ejercicio: state.ejercicioActual || null,
                evaluacion: state.ultimaEvaluacion || null
            }) ?? Promise.resolve({ ok: false, error: "Maestro no disponible." }));

            els.maestroLoading.classList.add("hidden");

            if (resp.ok && resp.respuesta) {
                els.maestroContent.classList.remove("hidden");
                els.maestroContent.innerHTML = `<div class="maestro-texto">${resp.respuesta.replace(/\n/g, "<br>")}</div>`;
            } else {
                els.maestroError.classList.remove("hidden");
                els.maestroError.textContent = resp.error || "No se pudo conectar al Maestro.";
            }
        } catch (e) {
            els.maestroLoading.classList.add("hidden");
            els.maestroError.classList.remove("hidden");
            els.maestroError.textContent = "Error de conexión con el Maestro.";
        }
    }

    function cerrarMaestroPanel() {
        if (els.maestroPanel) els.maestroPanel.classList.add("hidden");
    }

    function actualizarSidebar() {
        let perfil = { fortalezas: [], debilidades: [], recomendacion: null };

        try {
            if (window.PerfilUsuario?.obtenerEstadisticas) {
                perfil = window.PerfilUsuario.obtenerEstadisticas() || perfil;
            }
        } catch (_) {}

        const precision = state.stats.total > 0
            ? Math.round((state.stats.correctas / state.stats.total) * 100)
            : 0;

        els.progressFill.style.width = `${Math.min(100, precision)}%`;

        els.statsSummary.innerHTML = `
            <strong>Intentos:</strong> ${state.stats.total}<br>
            <strong>Aciertos:</strong> ${state.stats.correctas}<br>
            <strong>Omisiones:</strong> ${state.stats.omitidas}<br>
            <strong>Pistas:</strong> ${state.stats.pistas}<br>
            <strong>Revelados:</strong> ${state.stats.revelados}<br>
            <strong>Precisión:</strong> ${precision}%
        `;

        els.strengthsBox.innerHTML = formatearMetricas(perfil.fortalezas, "strength-item");
        els.weaknessesBox.innerHTML = formatearMetricas(perfil.debilidades, "weakness-item");
        els.recommendationBox.textContent =
            (window.AIEngine?.recomendarSiguientePaso ? window.AIEngine.recomendarSiguientePaso({ modulo: MODULO }) : null) ||
            perfil.recomendacion ||
            "Modo estable de arranque activo.";
    }

    function generarEjercicio() {
        if (state.nextTimeout) {
            clearTimeout(state.nextTimeout);
            state.nextTimeout = null;
        }
        limpiarFeedback();
        state.revealActivo = false;
        state.pistaUsada = false;
        state.respuestaCarga.raizPasoSuperado = false;
        state.respuestaCarga.raizManual = null;
        state.respuestaCarga.tipoManual = null;

        state.ejercicioActual = generarEjercicioSeguro();
        state.inicioTiempo = Date.now();

        renderInfoOculta();
        renderContexto();
        renderPentagrama();
        renderOpciones();
        actualizarSidebar();

        // Reproducción automática del acorde al generar
        if (window.AudioEngine && state.ejercicioActual?.acorde?.notas) {
            setTimeout(() => {
                AudioEngine.tocarArmonico(state.ejercicioActual.acorde.notas);
            }, 400);
        }
    }

    function cambiarModo() {
        if (window.AudioEngine) AudioEngine.detenerTodo();
        state.modo = state.modo === "trainer" ? "manual" : "trainer";

        els.modeLabel.textContent = state.modo === "trainer" ? "Modo entrenador" : "Modo manual";
        els.modeHint.textContent = state.modo === "trainer"
            ? "Entrenamiento adaptativo con grand staff y opciones laterales."
            : "Práctica dirigida por raíz, tonalidad e inversión.";
        els.sessionModeBadge.textContent = state.modo === "trainer" ? "Entrenador" : "Manual";

        renderControlesModo();
        generarEjercicio();
    }

    function validarDOM() {
        Object.entries(els).forEach(([k, v]) => ok(v, `Falta el elemento DOM: ${k}`));
    }

    function init() {
        try {
            validarDOM();
            ok(window.VexFlowManager && typeof window.VexFlowManager.init === "function", "VexFlowManager.init no disponible.");
            window.VexFlowManager.init("stave");

            renderControlesModo();
            actualizarSidebar();

            if (window.AIEngine && typeof AIEngine.registrarModulo === "function") {
                AIEngine.registrarModulo(MODULO, {
                    hint: function hintIdentificacion(contexto) {
                        const { ejercicio, comparacion } = contexto;
                        const acorde = ejercicio?.acorde;
                        if (!acorde) return "Observa el acorde mostrado.";
                        /* Mapear comparación a categoría para Pistas.generar */
                        const comp = comparacion || {};
                        let categoriaPrincipal = "error_general";
                        if (comp.raiz && comp.tipo && !comp.inversion) categoriaPrincipal = "inversion";
                        else if (comp.raiz && !comp.tipo) categoriaPrincipal = "calidad";
                        else if (!comp.raiz) categoriaPrincipal = "fundamental";
                        const diagnostico = { correcto: false, categoriaPrincipal };
                        if (window.Pistas && typeof Pistas.generar === "function") {
                            const pista = Pistas.generar(acorde, null, diagnostico);
                            if (typeof pista === "string" && pista.length > 0) return pista;
                        }
                        /* Fallback si Pistas no está o no devuelve texto */
                        if (comp.raiz && comp.tipo && !comp.inversion) return "Observa qué nota quedó en el bajo.";
                        return `Concéntrate en el bajo: ${acorde.bajo}.`;
                    }
                });
            }

            generarEjercicio();

            els.modeToggle.addEventListener("click", cambiarModo);
            //els.hintBtn.addEventListener("click", pedirPista);
            els.skipBtn.addEventListener("click", omitirEjercicio);
            els.nextBtn.addEventListener("click", generarEjercicio);

            if (els.playBtn) {
                els.playBtn.addEventListener("click", () => {
                    if (state.ejercicioActual && window.AudioEngine) {
                        AudioEngine.tocarArmonico(state.ejercicioActual.acorde.notas);
                    }
                });
            }

            if (els.arpeggioBtn) {
                els.arpeggioBtn.addEventListener("click", () => {
                    if (state.ejercicioActual && window.AudioEngine) {
                        AudioEngine.tocarMelodico(state.ejercicioActual.acorde.notas);
                    }
                });
            }

            if (els.maestroBtn) els.maestroBtn.addEventListener("click", consultarMaestro);
            if (els.maestroClose) els.maestroClose.addEventListener("click", cerrarMaestroPanel);

            // Control de volumen dinámico
            const updateVolumeVisibility = () => {
                if (els.pianoVol) els.pianoVol.parentElement.style.display = "flex";
                if (els.choirVol) els.choirVol.parentElement.style.display = "none";
                if (els.stringsVol) els.stringsVol.parentElement.style.display = "none";
            };

            if (els.pianoVol) {
                els.pianoVol.addEventListener("input", (e) => {
                    const val = parseFloat(e.target.value) / 100;
                    if (window.AudioEngine) AudioEngine.setVolume("piano", val);
                });
            }

            updateVolumeVisibility();

            // Control de volumen
            if (els.pianoVol) {
                els.pianoVol.addEventListener("input", (e) => {
                    const val = parseFloat(e.target.value) / 100;
                    if (window.AudioEngine) AudioEngine.setVolume("piano", val);
                });
            }
        } catch (e) {
            errorUI(`Error de inicialización: ${e.message}`);
        }
    }

    init();
});