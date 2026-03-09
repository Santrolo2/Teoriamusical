const IdentificacionAcordes = (() => {
    "use strict";

    const MODULO = "identificacion_acordes";

    const EVENTOS = {
        CORRECTO: "correcto",
        INCORRECTO: "incorrecto",
        PISTA: "pista",
        OMITIDO: "omitido",
        REVELADO: "revelado"
    };

    function nombreInversion(numero) {
        const mapa = [
            "estado fundamental",
            "primera inversión",
            "segunda inversión",
            "tercera inversión"
        ];
        return mapa[numero] || "inversión";
    }

    function validarEjercicio(ejercicio) {
        if (!ejercicio || typeof ejercicio !== "object") {
            return { valido: false, error: "No hay ejercicio activo." };
        }

        if (!ejercicio.acorde || !ejercicio.respuestaCorrecta) {
            return { valido: false, error: "El ejercicio está incompleto." };
        }

        return { valido: true };
    }

    function normalizarRespuesta(respuesta) {
        if (!respuesta || typeof respuesta !== "object") {
            return null;
        }

        return {
            raiz: respuesta.raiz ?? null,
            tipo: respuesta.tipo ?? null,
            inversion: Number.isInteger(respuesta.inversion)
                ? respuesta.inversion
                : Number(respuesta.inversion ?? 0)
        };
    }

    function compararRespuesta(correcta, usuario) {
        const detalle = {
            raiz: correcta.fundamental === usuario.raiz,
            tipo: correcta.tipoId === usuario.tipo,
            inversion: correcta.inversion === usuario.inversion
        };

        return {
            ...detalle,
            totalAciertos: Object.values(detalle).filter(Boolean).length,
            correctoTotal: detalle.raiz && detalle.tipo && detalle.inversion
        };
    }

    function categoriaError(comp) {
        if (!comp) return "global";
        if (comp.correctoTotal) return null;
        if (!comp.raiz && comp.tipo && comp.inversion) return "raiz";
        if (comp.raiz && !comp.tipo && comp.inversion) return "tipo";
        if (comp.raiz && comp.tipo && !comp.inversion) return "inversion";
        if (!comp.raiz && !comp.tipo && comp.inversion) return "raiz_tipo";
        if (!comp.raiz && comp.tipo && !comp.inversion) return "raiz_inversion";
        if (comp.raiz && !comp.tipo && !comp.inversion) return "tipo_inversion";
        return "global";
    }

    function construirRetroalimentacion(ejercicio, evento, comp) {
        const acorde = ejercicio.acorde;
        const tipoData = window.TIPOS_ACORDE?.obtener?.(acorde.tipo);
        const tipoNombre = tipoData?.nombre || acorde.tipo;
        const inversionNombre = nombreInversion(acorde.inversion);

        if (evento === EVENTOS.CORRECTO) {
            return {
                breve: "Correcto.",
                detalle: `Identificaste ${acorde.nombre} (${tipoNombre}) en ${inversionNombre}.`
            };
        }

        if (evento === EVENTOS.PISTA) {
            return {
                breve: "Pista usada.",
                detalle: `El intento queda penalizado de forma parcial.`
            };
        }

        if (evento === EVENTOS.OMITIDO) {
            return {
                breve: "Ejercicio omitido.",
                detalle: `La respuesta correcta era ${acorde.nombre} en ${inversionNombre}.`
            };
        }

        if (evento === EVENTOS.REVELADO) {
            return {
                breve: "Respuesta revelada.",
                detalle: `El acorde es ${acorde.nombre} en ${inversionNombre}.`
            };
        }

        const cat = categoriaError(comp);

        const mapa = {
            raiz: "Falló la raíz.",
            tipo: "Falló el tipo de acorde.",
            inversion: "Falló la inversión.",
            raiz_tipo: "Fallaron raíz y tipo.",
            raiz_inversion: "Fallaron raíz e inversión.",
            tipo_inversion: "Fallaron tipo e inversión.",
            global: "Respuesta incorrecta."
        };

        return {
            breve: mapa[cat] || "Respuesta incorrecta.",
            detalle: `La respuesta correcta era ${acorde.nombre} en ${inversionNombre}.`
        };
    }

    function construirPayloadIA(ejercicio, evaluacion) {
        return {
            modulo: MODULO,
            ejercicio,
            evaluacion
        };
    }

    function registrarEnPerfil(ejercicio, evaluacion) {
        if (!window.PerfilUsuario) return;

        if (typeof PerfilUsuario.registrarIntento === "function") {
            PerfilUsuario.registrarIntento({
                modulo: MODULO,
                ejercicio,
                evaluacion
            });
            return;
        }

        if (typeof PerfilUsuario.registrarEjercicio === "function") {
            PerfilUsuario.registrarEjercicio({
                modulo: MODULO,
                correcto: evaluacion.correcto,
                evento: evaluacion.evento,
                tiempo: evaluacion.tiempoRespuesta,
                acorde: ejercicio.acorde,
                comparacion: evaluacion.comparacion
            });
        }
    }

    function pedirPistaIA(ejercicio, comp, evento) {
        if (!window.AIEngine || typeof AIEngine.generarPista !== "function") {
            const acorde = ejercicio.acorde;
            return `Observa el bajo: ${acorde.bajo}.`;
        }

        return AIEngine.generarPista({
            modulo: MODULO,
            ejercicio,
            comparacion: comp,
            tipoEvento: evento
        });
    }

    function registrarIA(ejercicio, evaluacion) {
    if (!window.AIEngine || typeof AIEngine.registrarIntento !== "function") {
        return;
    }

    AIEngine.registrarIntento({
        modulo: MODULO,
        ejercicio,
        evaluacion
    });
}

    function crearEvaluacion({
        ejercicio,
        respuestaUsuario = null,
        tiempoRespuesta = 0,
        evento
    }) {
        const correcta = ejercicio.respuestaCorrecta;

        const comparacion = respuestaUsuario
            ? compararRespuesta(correcta, respuestaUsuario)
            : {
                raiz: false,
                tipo: false,
                inversion: false,
                totalAciertos: 0,
                correctoTotal: false
            };

        const correcto = evento === EVENTOS.CORRECTO;
        const retroalimentacion = construirRetroalimentacion(ejercicio, evento, comparacion);

        const evaluacion = {
            modulo: MODULO,
            correcto,
            evento,
            tiempoRespuesta: Number(tiempoRespuesta || 0),
            comparacion,
            diagnostico: {
                categoriaError: categoriaError(comparacion),
                retroalimentacion
            },
            pista: null,
            respuestaCorrecta: correcta,
            respuestaUsuario: respuestaUsuario || null
        };

        if (evento === EVENTOS.PISTA || evento === EVENTOS.INCORRECTO) {
            evaluacion.pista = pedirPistaIA(ejercicio, comparacion, evento);
        }

        registrarEnPerfil(ejercicio, evaluacion);
        registrarIA(ejercicio, evaluacion);

        return evaluacion;
    }

    function evaluarIntento(ejercicio, respuestaUsuario, tiempoRespuesta) {
        const validacion = validarEjercicio(ejercicio);
        if (!validacion.valido) {
            return { valido: false, error: validacion.error };
        }

        const respuesta = normalizarRespuesta(respuestaUsuario);
        if (!respuesta) {
            return { valido: false, error: "Respuesta inválida." };
        }

        const comp = compararRespuesta(ejercicio.respuestaCorrecta, respuesta);

        const evento = comp.correctoTotal
            ? EVENTOS.CORRECTO
            : EVENTOS.INCORRECTO;

        const resultado = crearEvaluacion({
            ejercicio,
            respuestaUsuario: respuesta,
            tiempoRespuesta,
            evento
        });

        return {
            valido: true,
            resultado,
            diagnostico: resultado.diagnostico,
            pista: resultado.pista
        };
    }

    function registrarPista(ejercicio, tiempoRespuesta) {
        const validacion = validarEjercicio(ejercicio);
        if (!validacion.valido) {
            return { valido: false, error: validacion.error };
        }

        const resultado = crearEvaluacion({
            ejercicio,
            tiempoRespuesta,
            evento: EVENTOS.PISTA
        });

        return {
            valido: true,
            resultado,
            diagnostico: resultado.diagnostico,
            pista: resultado.pista
        };
    }

    function registrarOmitir(ejercicio, tiempoRespuesta) {
        const validacion = validarEjercicio(ejercicio);
        if (!validacion.valido) {
            return { valido: false, error: validacion.error };
        }

        const resultado = crearEvaluacion({
            ejercicio,
            tiempoRespuesta,
            evento: EVENTOS.OMITIDO
        });

        return {
            valido: true,
            resultado,
            diagnostico: resultado.diagnostico,
            pista: resultado.pista
        };
    }

    function registrarRevelado(ejercicio, tiempoRespuesta) {
        const validacion = validarEjercicio(ejercicio);
        if (!validacion.valido) {
            return { valido: false, error: validacion.error };
        }

        const resultado = crearEvaluacion({
            ejercicio,
            tiempoRespuesta,
            evento: EVENTOS.REVELADO
        });

        return {
            valido: true,
            resultado,
            diagnostico: resultado.diagnostico,
            pista: resultado.pista
        };
    }

    return {
        MODULO,
        EVENTOS,
        evaluarIntento,
        registrarPista,
        registrarOmitir,
        registrarRevelado
    };
})();

window.IdentificacionAcordes = IdentificacionAcordes;