const AIEngine = (() => {
    "use strict";

    const DEFAULT_MODULE = "identificacion_acordes";

    const memoria = {
        historialGlobal: [],
        maxHistorialGlobal: 300,
        porModulo: {}
    };

    const registry = {
        modules: Object.create(null),
        sharedStrategies: {
            selector: null,
            hint: null,
            recommendation: null
        }
    };

    const consts = {
        raices: ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
    };

    function ensureModuloBucket(modulo) {
        if (!memoria.porModulo[modulo]) {
            memoria.porModulo[modulo] = {
                historial: [],
                maxHistorial: 120
            };
        }
        return memoria.porModulo[modulo];
    }

    function pushGlobal(item) {
        memoria.historialGlobal.unshift(item);
        if (memoria.historialGlobal.length > memoria.maxHistorialGlobal) {
            memoria.historialGlobal.pop();
        }
    }

    function pushModulo(modulo, item) {
        const bucket = ensureModuloBucket(modulo);
        bucket.historial.unshift(item);
        if (bucket.historial.length > bucket.maxHistorial) {
            bucket.historial.pop();
        }
    }

    function elegir(array) {
        if (!Array.isArray(array) || !array.length) return null;
        return array[Math.floor(Math.random() * array.length)];
    }

    function obtenerTiposSeguro() {
        if (!window.TIPOS_ACORDE || typeof TIPOS_ACORDE.listar !== "function") {
            return ["major", "minor", "dom7", "maj7"];
        }
        return TIPOS_ACORDE.listar().map(t => t.id);
    }

    function esTipoAcordeValido(tipoId) {
        return obtenerTiposSeguro().includes(tipoId);
    }

    function obtenerPerfilSeguro() {
        if (window.PerfilUsuario && typeof PerfilUsuario.obtenerEstadisticas === "function") {
            return PerfilUsuario.obtenerEstadisticas() || {
                fortalezas: [],
                debilidades: [],
                recomendacion: null
            };
        }

        return {
            fortalezas: [],
            debilidades: [],
            recomendacion: null
        };
    }

    function normalizarModulo(modulo) {
        return modulo || DEFAULT_MODULE;
    }

    function inferirFocoGeneral(perfil) {
        // 40% chance of Exploit (Weakness Targeting), 60% chance of Explore (Randomized)
        const isExploit = Math.random() < 0.4;
        
        if (isExploit && perfil?.debilidades?.length) {
            const principal = perfil.debilidades[0];
            return {
                categoria: principal.categoria || principal.clave || "mixto",
                valor: principal.valor || principal.clave || null,
                origen: "debilidad"
            };
        }

        return {
            categoria: "mixto",
            valor: null,
            origen: "exploracion"
        };
    }

    function construirConfigBaseDesdeFoco(foco) {
        const config = {};
        if (!foco) return config;

        const valor = foco.valor || foco.categoria || null;

        if (typeof valor === "string" && valor.startsWith("inv_")) {
            const numero = Number(valor.replace("inv_", ""));
            if (Number.isInteger(numero)) {
                config.inversion = numero;
            }
        }

        if (typeof valor === "string" && esTipoAcordeValido(valor)) {
            config.tipo = valor;
        }

        if (consts.raices.includes(valor)) {
            config.raiz = valor;
        }

        return config;
    }

    function evitarRepeticionBasica(modulo, configBase) {
        const bucket = ensureModuloBucket(modulo);
        const historial = bucket.historial;
        const copia = { ...configBase };

        // Evitar que el MISMO ACORDE (Raíz + Tipo) aparezca en los últimos 3 intentos
        const numIntentosRevisar = Math.min(3, historial.length);
        
        let coincidenciaReciente = false;

        for (let i = 0; i < numIntentosRevisar; i++) {
            const ejPrevio = historial[i]?.ejercicio?.acorde;
            if (ejPrevio) {
                if (ejPrevio.raiz === copia.raiz && ejPrevio.tipo === copia.tipo) {
                    coincidenciaReciente = true;
                    break;
                }
            }
        }

        if (coincidenciaReciente) {
            // Forzar un cambio. Cambiamos la raíz si estamos en exploración libre, o el tipo si la raíz es obligatoria por foco
            if (!configBase.raiz) {
                // Sacar todas las raíces que aparecieron recientemente para asegurar máxima variedad
                const raicesRecientes = historial.slice(0, numIntentosRevisar).map(h => h?.ejercicio?.acorde?.raiz).filter(Boolean);
                const alternativasR = consts.raices.filter(r => !raicesRecientes.includes(r));
                copia.raiz = elegir(alternativasR.length ? alternativasR : consts.raices.filter(r => r !== copia.raiz)) || copia.raiz;
            } else if (!configBase.tipo) {
                const tiposRecientes = historial.slice(0, numIntentosRevisar).map(h => h?.ejercicio?.acorde?.tipo).filter(Boolean);
                const alternativasT = obtenerTiposSeguro().filter(t => !tiposRecientes.includes(t));
                copia.tipo = elegir(alternativasT.length ? alternativasT : obtenerTiposSeguro().filter(t => t !== copia.tipo)) || copia.tipo;
            } else {
                // Si ambos vinieron forzados por el foco (muy raro), al menos cambiamos la raíz para romper la monotonía
                const alternativasR = consts.raices.filter(r => r !== copia.raiz);
                copia.raiz = elegir(alternativasR) || copia.raiz;
            }
        }

        // Regla original de fallback: si no se especificó tipo y por algún motivo no se filtró arriba, intentar variar la raíz respecto al INMEDIATO anterior
        const ultimo = historial[0];
        if (ultimo?.ejercicio?.acorde && !coincidenciaReciente) {
            const acordePrevio = ultimo.ejercicio.acorde;
            if (copia.raiz === acordePrevio.raiz && !configBase.tipo && !configBase.raiz) {
                const alternativas = consts.raices.filter(r => r !== acordePrevio.raiz);
                copia.raiz = elegir(alternativas) || copia.raiz;
            }
        }

        return copia;
    }

    function estrategiaModulo(modulo) {
        return registry.modules[modulo] || null;
    }

    function selectorCompartido(contexto) {
        const foco = inferirFocoGeneral(contexto.perfil);
        let config = construirConfigBaseDesdeFoco(foco);

        // Pre-rellenar los datos faltantes ANTES de enviarlos al validador de repeticiones
        if (!config.raiz) config.raiz = elegir(consts.raices) || "C";
        if (!config.tipo) config.tipo = elegir(obtenerTiposSeguro()) || "major";
        if (!Number.isInteger(config.inversion)) config.inversion = 0;

        // Ahora validamos este candidato completo contra el historial
        config = evitarRepeticionBasica(contexto.modulo, config);

        return { config, foco };
    }

    function generarEjercicio(options = {}) {
        const modulo = normalizarModulo(options.modulo);
        const perfil = obtenerPerfilSeguro();
        const moduloStrategy = estrategiaModulo(modulo);

        const contexto = { modulo, perfil, memoria, options };

        let decision;
        if (moduloStrategy?.selector && typeof moduloStrategy.selector === "function") {
            decision = moduloStrategy.selector(contexto);
        } else if (registry.sharedStrategies.selector) {
            decision = registry.sharedStrategies.selector(contexto);
        } else {
            decision = selectorCompartido(contexto);
        }

        const config = {
            ...(decision?.config || {}),
            ...(options.overrideConfig || {})
        };

        if (!window.GeneradorEjercicios || typeof GeneradorEjercicios.generar !== "function") {
            throw new Error("GeneradorEjercicios no está disponible.");
        }

        const ejercicio = GeneradorEjercicios.generar(config);
        
        // Pass the explicit AI focus strategy to the UI context
        const estrategiaNombre = decision?.foco?.origen === "exploracion" 
            ? "Exploración (Azar)" 
            : `Refuerzo (${decision?.foco?.valor || 'Mixto'})`;

        ejercicio.meta = {
            ...(ejercicio.meta || {}),
            modulo,
            focoCategoria: estrategiaNombre,
            focoValor: decision?.foco?.valor || null,
            generadoPorIA: true,
            estrategia: moduloStrategy ? "modulo" : "shared"
        };

        return ejercicio;
    }

    function registrarIntento(payload = {}) {
        const ejercicio = payload.ejercicio || null;
        const evaluacion = payload.evaluacion || null;
        const modulo = normalizarModulo(payload.modulo || ejercicio?.meta?.modulo || ejercicio?.modulo);

        const item = {
            timestamp: Date.now(),
            modulo,
            ejercicio,
            evaluacion
        };

        pushGlobal(item);
        pushModulo(modulo, item);
        return item;
    }

    function generarPista(payload = {}) {
        const modulo = normalizarModulo(payload.modulo);
        const estrategia = estrategiaModulo(modulo);
        const acorde = payload?.ejercicio?.acorde;

        /* Intentar pista específica del módulo (mantiene interfaz: siempre devolver string) */
        if (estrategia?.hint && typeof estrategia.hint === "function") {
            try {
                const contexto = {
                    modulo,
                    ejercicio: payload.ejercicio,
                    evaluacion: payload.evaluacion,
                    comparacion: payload.comparacion,
                    tipoEvento: payload.tipoEvento,
                    perfil: obtenerPerfilSeguro()
                };
                const resultado = estrategia.hint(contexto);
                if (typeof resultado === "string" && resultado.length > 0) {
                    return resultado;
                }
            } catch (e) {
                if (typeof console !== "undefined" && console.warn) {
                    console.warn("AIEngine: hint del módulo falló, usando fallback.", e);
                }
            }
        }

        /* Comportamiento por defecto (igual que antes: la interfaz no se rompe) */
        if (!acorde) return "Observa el acorde mostrado.";
        if (payload?.comparacion?.raiz && payload?.comparacion?.tipo && !payload?.comparacion?.inversion) {
            return "Observa qué nota quedó en el bajo.";
        }
        return `Concéntrate en el bajo: ${acorde.bajo}.`;
    }

    function recomendarSiguientePaso(options = {}) {
        const modulo = normalizarModulo(options.modulo);
        const perfil = obtenerPerfilSeguro();
        const debilidad = perfil?.debilidades?.[0];

        if (!debilidad) {
            return `Aún no hay suficiente información para una recomendación específica en ${modulo}.`;
        }

        const clave = debilidad.clave || debilidad.valor || debilidad.categoria || "general";
        return `Conviene reforzar ${clave} en ${modulo}.`;
    }

    function registrarModulo(nombre, handlers = {}) {
        registry.modules[nombre] = {
            selector: typeof handlers.selector === "function" ? handlers.selector : null,
            hint: typeof handlers.hint === "function" ? handlers.hint : null,
            recommendation: typeof handlers.recommendation === "function" ? handlers.recommendation : null,
            onAttempt: typeof handlers.onAttempt === "function" ? handlers.onAttempt : null
        };
        ensureModuloBucket(nombre);
        return true;
    }

    function registrarEstrategiaCompartida(nombre, fn) {
        registry.sharedStrategies[nombre] = fn;
        return true;
    }

    function obtenerEstadoIA() {
        return {
            modulosRegistrados: Object.keys(registry.modules),
            historialGlobal: memoria.historialGlobal.length,
            buckets: Object.fromEntries(
                Object.entries(memoria.porModulo).map(([k, v]) => [k, v.historial.length])
            )
        };
    }

    /**
     * Consulta al Maestro IA (LLM real) para retroalimentación pedagógica.
     * Requiere backend con OpenAI configurado (ver server/).
     * @param {Object} options - { tipo, modulo, ejercicio, evaluacion, consulta }
     * @returns {Promise<{ok: boolean, respuesta?: string, error?: string}>}
     */
    async function consultarMaestro(options = {}) {
        if (typeof window === "undefined" || !window.LLMMaestro || typeof window.LLMMaestro.consultarMaestro !== "function") {
            return {
                ok: false,
                error: "El Maestro IA no está disponible. Carga llm-maestro.js y asegúrate de que el backend esté corriendo."
            };
        }

        const modulo = normalizarModulo(options.modulo);
        const perfil = obtenerPerfilSeguro();

        const historialReciente = (perfil?.historial || []).slice(0, 10).map(h => ({
            acorde: h.acorde,
            correcto: h.correcto,
            tipo: h.tipo,
            inversion: h.inversion,
            raiz: h.raiz,
            fecha: h.fecha
        }));

        const payload = {
            tipo: options.tipo || "retroalimentacion_error",
            modulo,
            perfil: {
                ejercicios: perfil?.ejercicios,
                correctas: perfil?.correctas,
                precision: perfil?.precision,
                debilidades: (perfil?.debilidades || []).slice(0, 5),
                fortalezas: (perfil?.fortalezas || []).slice(0, 5),
                confusiones: perfil?.confusiones || {}
            },
            ejercicio: options.ejercicio || null,
            evaluacion: options.evaluacion || null,
            historialReciente,
            consulta: options.consulta || null
        };

        return window.LLMMaestro.consultarMaestro(payload);
    }

    return {
        generarEjercicio,
        registrarIntento,
        generarPista,
        recomendarSiguientePaso,
        registrarModulo,
        registrarEstrategiaCompartida,
        obtenerEstadoIA,
        consultarMaestro
    };
})();

window.AIEngine = AIEngine;