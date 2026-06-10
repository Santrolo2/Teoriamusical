// ============================================
// MODULO: ENTRENADOR DE PIANO - REDISEÑO
// ============================================

const PianoTrainer = (() => {
    "use strict";

    const DEFAULT_MODE = "fingering";
    let isAppInitialized = false;

    // The 3 explicit modes from the prompt:
    // 1. fingering (Revisar digitación por acorde)
    // 2. ocr (Modo OCR, digitación automática)
    // 3. exercise (Practicar patrones de digitación)

    const EXERCISE_STAGES = [
        {
            id: "triadas_fundamental",
            objetivo: "Objetivo: reconocer tríadas (mayor/menor) en estado fundamental.",
            tiposPermitidos: ["major", "minor"],
            inversionFija: 0
        },
        {
            id: "triadas_inversiones",
            objetivo: "Objetivo: reconocer tríadas con inversiones 1 y 2.",
            tiposPermitidos: ["major", "minor", "diminished", "augmented"]
        },
        {
            id: "septimas",
            objetivo: "Objetivo: reconocer acordes de séptima y su inversión.",
            tiposPermitidos: ["maj7", "dom7", "min7", "halfDim7"]
        }
    ];

    let currentMode = DEFAULT_MODE;
    let currentChord = null;
    let currentFingering = null;
    let ocrResult = null;
    let ocrChord = null;
    let selectedOcrEngine = "auto";

    let exercise = {
        current: null,
        stageIndex: 0,
        solvedInStage: 0,
        startedAt: 0
    };

    const elements = {};

    function getMaxInversionForType(type) {
        try {
            const info = window.TIPOS_ACORDE?.obtener?.(type);
            if (info?.cardinalidad > 0) return info.cardinalidad - 1;
        } catch (_) {}
        return String(type || "").includes("7") ? 3 : 2;
    }

    function safeModeLabel(mode) {
        if (mode === "fingering") return "Digitación";
        if (mode === "exercise") return "Ejercicios";
        return "OCR";
    }

    function initElements() {
        elements.landingScreen = document.getElementById("landingScreen");
        elements.mainInterface = document.getElementById("mainInterface");
        
        const modeCards = document.querySelectorAll(".mode-card");
        modeCards.forEach(card => {
            card.addEventListener("click", () => {
                const target = card.getAttribute("data-target");
                startAppInMode(target);
            });
        });

        elements.backToLandingBtn = document.getElementById("backToLandingBtn");
        elements.modeToggle = document.getElementById("modeToggle");
        elements.modeLabel = document.getElementById("modeLabel");
        
        elements.fingeringMode = document.getElementById("fingeringMode");
        elements.exerciseMode = document.getElementById("exerciseMode");
        elements.ocrMode = document.getElementById("ocrMode");

        elements.stave = document.getElementById("stave");
        elements.chordName = document.getElementById("chordName");
        elements.chordSubtitle = document.getElementById("chordSubtitle");
        elements.playBtn = document.getElementById("playBtn");
        elements.arpeggioBtn = document.getElementById("arpeggioBtn");
        elements.showFingeringBtn = document.getElementById("showFingeringBtn");
        elements.nextChordBtn = document.getElementById("nextChordBtn");
        elements.fingeringPanel = document.getElementById("fingeringPanel");
        elements.fingeringDisplay = document.getElementById("fingeringDisplay");
        elements.fingeringDetails = document.getElementById("fingeringDetails");

        // Builder Tabs
        elements.tabStepByStep = document.getElementById("tabStepByStep");
        elements.tabTextInput = document.getElementById("tabTextInput");
        elements.panelStepByStep = document.getElementById("panelStepByStep");
        elements.panelTextInput = document.getElementById("panelTextInput");

        // Step by Step Elements
        elements.btnNotesDown = document.getElementById("btnNotesDown");
        elements.btnNotesUp = document.getElementById("btnNotesUp");
        elements.labelNumNotes = document.getElementById("labelNumNotes");
        elements.dynamicNotesContainer = document.getElementById("dynamicNotesContainer");

        // Text Input Elements
        elements.inputChordText = document.getElementById("inputChordText");
        elements.btnOctaveDown = document.getElementById("btnOctaveDown");
        elements.btnOctaveUp = document.getElementById("btnOctaveUp");
        elements.labelFastOctave = document.getElementById("labelFastOctave");

        // Shared Actions
        elements.buildChordBtn = document.getElementById("buildChordBtn");
        elements.randomChordBtn = document.getElementById("randomChordBtn");

        elements.imageInput = document.getElementById("imageInput");
        elements.imagePreview = document.getElementById("imagePreview");
        elements.previewImg = document.getElementById("previewImg");
        elements.clearImageBtn = document.getElementById("clearImageBtn");
        elements.analyzeBtn = document.getElementById("analyzeBtn");
        elements.playOcrBtn = document.getElementById("playOcrBtn");
        elements.ocrEngine = document.getElementById("ocrEngine");
        elements.ocrResults = document.getElementById("ocrResults");
        elements.ocrAnalysis = document.getElementById("ocrAnalysis");
        elements.ocrSuggestions = document.getElementById("ocrSuggestions");
        elements.ocrFingering = document.getElementById("ocrFingering");
        elements.ocrFingeringDisplay = document.getElementById("ocrFingeringDisplay");
        elements.ocrLoading = document.getElementById("ocrLoading");

        elements.exerciseStave = document.getElementById("exerciseStave");
        elements.exerciseObjective = document.getElementById("exerciseObjective");
        elements.playExerciseBtn = document.getElementById("playExerciseBtn");
        elements.nextExerciseBtn = document.getElementById("nextExerciseBtn");
        elements.exerciseRoot = document.getElementById("exerciseRoot");
        elements.exerciseType = document.getElementById("exerciseType");
        elements.exerciseInversion = document.getElementById("exerciseInversion");
        elements.checkExerciseBtn = document.getElementById("checkExerciseBtn");
        elements.hintExerciseBtn = document.getElementById("hintExerciseBtn");
        elements.exerciseFeedbackText = document.getElementById("exerciseFeedbackText");

        elements.pianoVol = document.getElementById("pianoVol");
        elements.currentMode = document.getElementById("currentMode");
        elements.currentChord = document.getElementById("currentChord");
        elements.currentExercise = document.getElementById("currentExercise");
    }

    function startAppInMode(mode) {
        currentMode = mode;
        elements.landingScreen.classList.remove("active");
        elements.landingScreen.classList.add("hidden");
        elements.mainInterface.classList.remove("hidden");

        if (!isAppInitialized) {
            runFullInit();
            isAppInitialized = true;
        }

        updateModeView();
        
        // Start Audio Context if possible
        try { window.AudioEngine?.init?.(); } catch(e){}
    }

    function updateModeView() {
        elements.modeLabel.textContent = `Modo: ${safeModeLabel(currentMode)}`;
        if (elements.currentMode) elements.currentMode.textContent = safeModeLabel(currentMode);
        
        // Hide all
        elements.fingeringMode.classList.add("hidden");
        elements.ocrMode.classList.add("hidden");
        elements.exerciseMode.classList.add("hidden");

        if (currentMode === "fingering") {
            elements.fingeringMode.classList.remove("hidden");
            if (!currentChord) generateRandomChord();
            else displayChord();
        } else if (currentMode === "ocr") {
            elements.ocrMode.classList.remove("hidden");
            clearImage();
        } else if (currentMode === "exercise") {
            elements.exerciseMode.classList.remove("hidden");
            generateExercise();
        }
    }

    function returnToLanding() {
        elements.mainInterface.classList.add("hidden");
        elements.landingScreen.classList.remove("hidden");
        elements.landingScreen.classList.add("active");
    }

    const NOTAS_ESCALA = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    function initBuilderEvents() {
        // Tab switching
        elements.tabStepByStep.addEventListener("click", () => switchBuilderTab("step"));
        elements.tabTextInput.addEventListener("click", () => switchBuilderTab("text"));

        // Number of Notes configuration
        let numNotes = 3;
        elements.btnNotesDown.addEventListener("click", () => {
            if (numNotes > 2) {
                numNotes--;
                elements.labelNumNotes.textContent = numNotes;
                renderDynamicNoteMakers(numNotes);
            }
        });
        
        elements.btnNotesUp.addEventListener("click", () => {
            if (numNotes < 6) {
                numNotes++;
                elements.labelNumNotes.textContent = numNotes;
                renderDynamicNoteMakers(numNotes);
            }
        });

        // Fast Octave configuration
        let fastOct = 4;
        elements.btnOctaveDown.addEventListener("click", () => {
            if (fastOct > 1) fastOct--;
            elements.labelFastOctave.textContent = fastOct;
        });
        elements.btnOctaveUp.addEventListener("click", () => {
            if (fastOct < 7) fastOct++;
            elements.labelFastOctave.textContent = fastOct;
        });

        // Initial render for step by step notes
        renderDynamicNoteMakers(numNotes);
    }

    function switchBuilderTab(tab) {
        if (tab === "step") {
            elements.tabStepByStep.classList.add("active");
            elements.tabTextInput.classList.remove("active");
            elements.panelStepByStep.classList.add("active");
            elements.panelStepByStep.classList.remove("hidden");
            elements.panelTextInput.classList.remove("active");
            elements.panelTextInput.classList.add("hidden");
        } else {
            elements.tabTextInput.classList.add("active");
            elements.tabStepByStep.classList.remove("active");
            elements.panelTextInput.classList.add("active");
            elements.panelTextInput.classList.remove("hidden");
            elements.panelStepByStep.classList.remove("active");
            elements.panelStepByStep.classList.add("hidden");
        }
    }

    function renderDynamicNoteMakers(count) {
        elements.dynamicNotesContainer.innerHTML = "";
        
        // C E G by default
        const defaultNotes = [
            { noteIndex: 0, oct: 4, acc: 'natural' },
            { noteIndex: 4, oct: 4, acc: 'natural' },
            { noteIndex: 7, oct: 4, acc: 'natural' },
            { noteIndex: 11, oct: 4, acc: 'natural' },
            { noteIndex: 2, oct: 5, acc: 'natural' },
            { noteIndex: 5, oct: 5, acc: 'natural' }
        ];

        for (let i = 0; i < count; i++) {
            const row = document.createElement("div");
            row.className = "note-control-row";
            row.style.display = "flex";
            row.style.alignItems = "center";
            row.style.justifyContent = "space-between";
            row.style.background = "#fff";
            row.style.padding = "8px 12px";
            row.style.borderRadius = "8px";
            row.style.boxShadow = "var(--shadow-sm)";
            row.style.border = "1px solid var(--border-color)";
            row.style.marginBottom = "8px";
            
            const state = defaultNotes[i];

            const pitchControl = document.createElement("div");
            pitchControl.className = "number-control pitch-container";
            pitchControl.innerHTML = `
                <button class="icon-btn n-down"><i class="fas fa-arrow-down"></i></button>
                <span class="value-display n-val" data-idx="${state.noteIndex}" data-oct="${state.oct}" style="min-width:40px">${NOTAS_ESCALA[state.noteIndex]}${state.oct}</span>
                <button class="icon-btn n-up"><i class="fas fa-arrow-up"></i></button>
            `;

            const accControl = document.createElement("div");
            accControl.className = "accidental-toggles";
            accControl.style.display = "flex";
            accControl.style.gap = "5px";
            accControl.innerHTML = `
                <button class="icon-btn acc-btn active" data-acc="natural">♮</button>
                <button class="icon-btn acc-btn" data-acc="b">b</button>
                <button class="icon-btn acc-btn" data-acc="#">#</button>
            `;

            row.dataset.acc = state.acc;

            // Pitch Events
            const nDown = pitchControl.querySelector('.n-down');
            const nUp = pitchControl.querySelector('.n-up');
            const nVal = pitchControl.querySelector('.n-val');

            const parseVal = () => {
                return { idx: parseInt(nVal.dataset.idx), oct: parseInt(nVal.dataset.oct) };
            };

            const setVal = (idx, oct) => {
                nVal.dataset.idx = idx;
                nVal.dataset.oct = oct;
                nVal.textContent = `${NOTAS_ESCALA[idx]}${oct}`;
            };

            nDown.addEventListener('click', () => {
                let {idx, oct} = parseVal();
                idx--;
                if (idx < 0) { idx = 11; oct--; }
                if (oct < 1) { oct = 1; idx = 0; }
                setVal(idx, oct);
            });

            nUp.addEventListener('click', () => {
                let {idx, oct} = parseVal();
                idx++;
                if (idx > 11) { idx = 0; oct++; }
                if (oct > 7) { oct = 7; idx = 11; }
                setVal(idx, oct);
            });

            // Accidental Events
            const accBtns = accControl.querySelectorAll('.acc-btn');
            accBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    accBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    row.dataset.acc = btn.dataset.acc;
                });
            });

            row.appendChild(pitchControl);
            row.appendChild(accControl);
            elements.dynamicNotesContainer.appendChild(row);
        }
    }

    function buildChord() {
        try {
            if (elements.tabTextInput.classList.contains("active")) {
                const text = elements.inputChordText.value.trim();
                const oct = parseInt(elements.labelFastOctave.textContent) || 4;
                if (!text) return alert("Por favor ingresa un nombre de acorde.");
                
                // Construct a fake object mimicking the shape generated by the theoretical module parse, if it supports parse
                // For simplicity, we fallback to a hardcoded mapping or generic object since ACORDES doesn't natively parse "Cmaj7" from a single string in its public API easily without `ACORDES.identificar` which works in reverse.
                // Best bet is treating text as root + type.
                
                // Let's use the core ID parser or generic logic
                throw new Error("El cifrado de texto directo no está implementado aún en esta versión.");
            } else {
                // Step-by-Step Build
                const rows = Array.from(elements.dynamicNotesContainer.children);
                const notasConstruidas = rows.map(r => {
                    const span = r.querySelector('.n-val');
                    const basePitch = NOTAS_ESCALA[parseInt(span.dataset.idx)];
                    const oct = span.dataset.oct;
                    const acc = r.dataset.acc;
                    
                    let finalPitch = basePitch;
                    // Apply visual accidental offset to the note name if requested (e.g. Eb instead of D#)
                    if (acc === "b" && (basePitch.includes("#") || ["D","E","G","A","B"].includes(basePitch))) {
                         // Simple visual re-mapping for flat contexts
                         if (basePitch === "D") finalPitch = "Ebb"; // Extreme edge cases avoided
                         else if (basePitch === "C#") finalPitch = "Db";
                         else if (basePitch === "D#") finalPitch = "Eb";
                         else if (basePitch === "F#") finalPitch = "Gb";
                         else if (basePitch === "G#") finalPitch = "Ab";
                         else if (basePitch === "A#") finalPitch = "Bb";
                    } else if (acc === "#" && !basePitch.includes("#")) {
                        // Sharp a natural note explicitly
                        if (basePitch === "E") finalPitch = "E#";
                        else if (basePitch === "B") finalPitch = "B#";
                        else finalPitch = `${basePitch}#`;
                    }
                    
                    return `${finalPitch}${oct}`;
                });

                // Create a proxy chord object that VexFlow can render and Audio can play
                currentChord = {
                    nombre: "Acorde Personalizado",
                    inversion: 0,
                    notas: notasConstruidas, // e.g. ["C4", "E4", "G4"]
                    raiz: notasConstruidas[0].replace(/\d/, ""),
                    tipo: "custom"
                };
            }

            displayChord();
            generateFingering();
        } catch (error) {
            console.error("Error construyendo acorde:", error);
            alert("Error: " + error.message);
        }
    }

    function displayChord() {
        if (!currentChord) return;
        try {
            window.VexFlowManager?.dibujarPentagrama(currentChord, null, "stave");
            elements.chordName.textContent = currentChord.nombre || "Acorde";
            // Update subtitle to be informative
            elements.chordSubtitle.textContent = `Notas: ${currentChord.notas.join(' - ')}`;
            elements.currentChord.textContent = currentChord.nombre || "-";
            elements.fingeringPanel.classList.add("hidden"); 
        } catch (error) {
            console.error("Error mostrando acorde:", error);
            elements.chordSubtitle.textContent = "Error al renderizar partitura";
        }
    }

    function generateRandomChord() {
        if (!elements.tabStepByStep.classList.contains("active")) {
             switchBuilderTab("step");
        }
        
        const count = Math.floor(Math.random() * 3) + 3; // 3 to 5 notes
        let numNotes = count;
        elements.labelNumNotes.textContent = numNotes;
        renderDynamicNoteMakers(numNotes);
        
        const rows = Array.from(elements.dynamicNotesContainer.children);
        let currentOctave = 4;
        let lastIdx = Math.floor(Math.random() * 12);

        rows.forEach((r, i) => {
             const span = r.querySelector('.n-val');
             
             if (i > 0) {
                 lastIdx += Math.floor(Math.random() * 5) + 2; // Jump 2-6 semitones
                 if (lastIdx > 11) {
                     lastIdx = lastIdx % 12;
                     currentOctave++;
                 }
                 if (currentOctave > 6) currentOctave = 6;
             }
             
             span.dataset.idx = lastIdx;
             span.dataset.oct = currentOctave;
             span.textContent = `${NOTAS_ESCALA[lastIdx]}${currentOctave}`;
             
             // randomly apply flat sometimes
             if (Math.random() > 0.5 && NOTAS_ESCALA[lastIdx].includes("#")) {
                 r.dataset.acc = "b";
                 Array.from(r.querySelectorAll('.acc-btn')).forEach(b => {
                     b.classList.remove('active');
                     if (b.dataset.acc === "b") b.classList.add("active");
                 });
             }
        });

        buildChord();
    }
    function generateFingering() {
        if (!currentChord?.notas?.length) return;
        if (window.DIGITACIONES) {
            currentFingering = window.DIGITACIONES.generarDigitacion(currentChord) || null;
        }
    }

    function showFingering() {
        if (!currentFingering) generateFingering();
        if (!currentFingering) {
            alert("No hay digitación disponible para este caso.");
            return;
        }

        elements.fingeringPanel.classList.remove("hidden");
        elements.fingeringDisplay.textContent = window.DIGITACIONES.obtenerSugerenciaCompacta(currentFingering);
        elements.fingeringDetails.textContent = window.DIGITACIONES.formatearDigitacion(currentFingering);
        
        // Re-draw the stave to include fingering numbers on the SVG
        if (window.VexFlowManager && currentChord) {
            window.VexFlowManager.dibujarPentagrama(currentChord, null, "stave", currentFingering);
        }
    }

    async function playChord() {
        if (!currentChord?.notas?.length) return alert("Primero construye un acorde.");
        try {
            await window.AudioEngine?.init?.();
            await window.AudioEngine?.tocarArmonico?.(currentChord.notas, "2n", "piano");
        } catch (error) {
            console.error(error);
        }
    }

    async function arpeggiateChord() {
        if (!currentChord?.notas?.length) return alert("Primero construye un acorde.");
        try {
            await window.AudioEngine?.init?.();
            await window.AudioEngine?.tocarMelodico?.(currentChord.notas, 0.5, "piano");
        } catch (error) {
            console.error(error);
        }
    }

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.previewImg.src = e.target.result;
            elements.imagePreview.classList.remove("hidden");
            elements.analyzeBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    function clearImage() {
        elements.imageInput.value = "";
        elements.previewImg.src = "";
        elements.imagePreview.classList.add("hidden");
        elements.analyzeBtn.disabled = true;
        elements.playOcrBtn.disabled = true;
        elements.ocrResults.classList.add("hidden");
        elements.ocrFingering.classList.add("hidden");
        ocrResult = null;
        ocrChord = null;
    }

    async function analyzeImage() {
        if (!elements.previewImg.src) return alert("Selecciona una imagen primero.");

        elements.ocrLoading.classList.remove("hidden");
        elements.ocrResults.classList.add("hidden");
        elements.ocrFingering.classList.add("hidden");

        try {
            if (!window.OCR_SHEET_MUSIC) {
                throw new Error("Módulo OCR_SHEET_MUSIC no disponible");
            }
            await window.OCR_SHEET_MUSIC.init();
            ocrResult = await window.OCR_SHEET_MUSIC.analizarPartitura(elements.previewImg.src, {
                engine: selectedOcrEngine
            });
            displayOcrResults();

            if (ocrResult.notasMidi && ocrResult.notasMidi.length > 0) {
                ocrChord = window.OCR_SHEET_MUSIC.notasAAcorde(ocrResult.notasMidi);
                if (ocrChord) {
                    elements.playOcrBtn.disabled = false;
                    const f = window.DIGITACIONES?.generarDigitacion(ocrChord);
                    if (f) {
                        elements.ocrFingering.classList.remove("hidden");
                        elements.ocrFingeringDisplay.textContent = window.DIGITACIONES.obtenerSugerenciaCompacta(f);
                    }
                }
            }
        } catch (error) {
            console.error("Error analizando imagen:", error);
            alert(error.message || "No se pudo analizar la partitura de forma automática.");
        } finally {
            elements.ocrLoading.classList.add("hidden");
        }
    }

    function displayOcrResults() {
        elements.ocrResults.classList.remove("hidden");
        const a = ocrResult.analisis;
        const motor = a?.motor || "tesseract";
        elements.ocrAnalysis.innerHTML = `
            <p><strong>Motor IA:</strong> ${motor}</p>
            <p><strong>Precisión:</strong> ${Number(a.confianza || 0).toFixed(1)}%</p>
            <p><strong>Notas Leídas:</strong> ${(a.notas || []).length}</p>
            <p><strong>Transcripción:</strong> ${(a.notas || []).map(n => n.nota).join(", ") || "-"}</p>
            ${a.compas ? `<p><strong>Compás:</strong> ${a.compas.descripcion}</p>` : ""}
        `;

        elements.ocrSuggestions.innerHTML = `
            ${(ocrResult.sugerencias || []).length > 0 ? (ocrResult.sugerencias || []).map(s => `<p>• ${s}</p>`).join("") : "<p>No hay sugerencias adicionales.</p>"}
        `;
    }

    async function playOcrChord() {
        if (!ocrChord?.notas?.length) return alert("No hay notas para reproducir.");
        try {
            await window.AudioEngine?.init?.();
            await window.AudioEngine?.tocarArmonico?.(ocrChord.notas, "2n", "piano");
        } catch (error) {
            console.error(error);
        }
    }

    function populateExerciseSelectors() {
        const roots = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        if(elements.exerciseRoot) elements.exerciseRoot.innerHTML = roots.map(r => `<option value="${r}">${r}</option>`).join("");

        if(window.TIPOS_ACORDE && elements.exerciseType) {
            const types = window.TIPOS_ACORDE.listar();
            elements.exerciseType.innerHTML = types.map(t => `<option value="${t.id}">${t.nombre}</option>`).join("");
        }
    }

    function getCurrentStage() {
        return EXERCISE_STAGES[Math.min(exercise.stageIndex, EXERCISE_STAGES.length - 1)];
    }

    function generateExercise() {
        if (!window.GeneradorEjercicios) {
            elements.exerciseFeedbackText.textContent = "El generador de ejercicios no está disponible.";
            return;
        }

        const stage = getCurrentStage();
        elements.exerciseObjective.textContent = stage.objetivo;

        const cfg = { tiposPermitidos: stage.tiposPermitidos };
        if (Number.isInteger(stage.inversionFija)) cfg.inversion = stage.inversionFija;
        
        exercise.current = window.GeneradorEjercicios.generar(cfg);
        exercise.startedAt = Date.now();

        try {
            if(window.VexFlowManager) {
                window.VexFlowManager.dibujarPentagrama(exercise.current.acorde, null, "exerciseStave");
            }
            elements.currentExercise.textContent = `${stage.id} (${exercise.solvedInStage}/4)`;
            elements.exerciseFeedbackText.textContent = "Escucha y responde raíz/tipo/inversión.";
            elements.exerciseFeedbackText.classList.remove("empty");
            syncExerciseInversionOptions();
        } catch (error) {
            console.error("Error render ejercicio:", error);
            elements.exerciseFeedbackText.textContent = "No se pudo renderizar el ejercicio.";
        }
    }

    function syncExerciseInversionOptions() {
        if(!elements.exerciseType) return;
        const selectedType = elements.exerciseType.value;
        const maxInv = getMaxInversionForType(selectedType);
        Array.from(elements.exerciseInversion.options).forEach((opt, i) => {
            opt.disabled = i > maxInv;
            if (i > maxInv) opt.style.display = "none";
            else opt.style.display = "block";
        });
        const current = parseInt(elements.exerciseInversion.value, 10);
        if (current > maxInv) elements.exerciseInversion.value = String(maxInv);
    }

    async function playExercise() {
        if (!exercise.current?.acorde?.notas?.length) return;
        try {
            await window.AudioEngine?.init?.();
            await window.AudioEngine?.tocarArmonico?.(exercise.current.acorde.notas, "2n", "piano");
        } catch (error) {
            console.error(error);
        }
    }

    function evaluateExercise() {
        if (!exercise.current || !window.IdentificacionAcordes) return;

        const respuesta = {
            raiz: elements.exerciseRoot.value,
            tipo: elements.exerciseType.value,
            inversion: parseInt(elements.exerciseInversion.value, 10) || 0
        };

        const tiempo = (Date.now() - exercise.startedAt) / 1000;
        const result = window.IdentificacionAcordes.evaluarIntento(exercise.current, respuesta, tiempo);
        if (!result?.valido) {
            elements.exerciseFeedbackText.textContent = result?.error || "No se pudo evaluar.";
            return;
        }

        const ev = result.resultado;
        const d = ev?.diagnostico?.retroalimentacion;
        elements.exerciseFeedbackText.textContent = `${d?.breve || ""} ${d?.detalle || ""}`.trim();

        if (ev.correcto) {
            exercise.solvedInStage += 1;
            if (exercise.solvedInStage >= 4 && exercise.stageIndex < EXERCISE_STAGES.length - 1) {
                exercise.stageIndex += 1;
                exercise.solvedInStage = 0;
                elements.exerciseFeedbackText.textContent += " 🎉 ¡Subiste de etapa pedagógica!";
            }
             setTimeout(generateExercise, 1500);
        }
    }

    function hintExercise() {
        if (!exercise.current || !window.IdentificacionAcordes) return;
        const tiempo = (Date.now() - exercise.startedAt) / 1000;
        const r = window.IdentificacionAcordes.registrarPista(exercise.current, tiempo);
        const pista = r?.pista || "Observa el bajo del acorde y escucha la calidad sonora.";
        elements.exerciseFeedbackText.textContent = `Pista: ${pista}`;
    }

    function runFullInit() {
        // Events
        elements.backToLandingBtn.addEventListener("click", returnToLanding);

        initBuilderEvents();
        
        elements.buildChordBtn.addEventListener("click", buildChord);
        elements.randomChordBtn.addEventListener("click", generateRandomChord);
        elements.playBtn.addEventListener("click", playChord);
        elements.arpeggioBtn.addEventListener("click", arpeggiateChord);
        elements.showFingeringBtn.addEventListener("click", showFingering);
        elements.nextChordBtn.addEventListener("click", generateRandomChord);

        elements.clearImageBtn.addEventListener("click", clearImage);
        elements.imageInput.addEventListener("change", (e) => handleImageUpload(e));
        elements.analyzeBtn.addEventListener("click", analyzeImage);
        elements.playOcrBtn.addEventListener("click", playOcrChord);

        elements.ocrEngine.addEventListener("change", (e) => {
            selectedOcrEngine = e.target.value || "auto";
        });

        elements.playExerciseBtn.addEventListener("click", playExercise);
        elements.nextExerciseBtn.addEventListener("click", generateExercise);
        elements.checkExerciseBtn.addEventListener("click", evaluateExercise);
        elements.hintExerciseBtn.addEventListener("click", hintExercise);
        elements.exerciseType.addEventListener("change", syncExerciseInversionOptions);

        elements.pianoVol.addEventListener("input", (e) => {
            window.AudioEngine?.setVolume?.("piano", e.target.value / 100);
        });

        // Setup Options
        populateExerciseSelectors();
        
        generateRandomChord();
        
        if (window.PerfilUsuario?.init && window.TIPOS_ACORDE?.listar) {
            window.PerfilUsuario.init(window.TIPOS_ACORDE.listar());
        }
    }

    async function init() {
        initElements();
        console.log("PianoTrainer: módulo cargado, esperando selección de modo...");
    }

    return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
    PianoTrainer.init();
});
