const AnalizadorError = (() => {
    "use strict";

    function analizar(resultadoEvaluacion, contexto = {}, historial = []) {
        const { correcto, esperado, respuesta, coincidencias } = resultadoEvaluacion;

        if (correcto) {
            return {
                correcto: true,
                categoriaPrincipal: "acierto",
                categorias: ["acierto"],
                severidad: 0,
                indicadores: {
                    acertoFundamental: true,
                    acertoTipo: true,
                    acertoInversion: true,
                    acertoGradoRomano: coincidencias.gradoRomano,
                    coincidenciaParcialNotas: coincidencias.notas,
                    totalNotasEsperadas: esperado.notasBase.length,
                    bajoEsperado: esperado.bajo,
                    bajoRespuesta: respuesta.bajo,
                    acertoAlteraciones: true
                },
                hipotesis: [],
                retroalimentacion: {
                    breve: "Correcto.",
                    tecnica: "La identificación coincide con la estructura del acorde.",
                    sugerenciaEjercicio: "Continuar."
                },
                ajustePedagogico: {
                    bajarDificultad: false,
                    reforzarInversiones: false,
                    reforzarTipos: false,
                    reforzarAlteraciones: false,
                    reforzarFuncionTonal: false
                }
            };
        }

        const categorias = [];
        let categoriaPrincipal = "error_general";
        let severidad = 0.5;
        const hipotesis = [];

        if (!coincidencias.fundamental && coincidencias.tipo) {
            categoriaPrincipal = "fundamental";
            categorias.push("fundamental");
            severidad = 0.7;

            if (esperado.bajo && respuesta.fundamental === esperado.bajo) {
                categorias.push("fundamental_por_bajo");
                hipotesis.push("Tomó el bajo como fundamental.");
            }
        }

        if (coincidencias.fundamental && !coincidencias.tipo) {
            categoriaPrincipal = "calidad";
            categorias.push("calidad");
            severidad = 0.65;
            hipotesis.push("Reconoció la raíz, pero confundió la cualidad del acorde.");
        }

        if (
            coincidencias.fundamental &&
            coincidencias.tipo &&
            !coincidencias.inversion
        ) {
            categoriaPrincipal = "inversion";
            categorias.push("inversion");
            severidad = 0.25;
            hipotesis.push("Reconoció el acorde, pero no su disposición o bajo.");
        }

        if (
            coincidencias.notas > 0 &&
            coincidencias.notas < esperado.notasBase.length &&
            !categorias.includes("lectura_visual_parcial")
        ) {
            categorias.push("lectura_visual_parcial");
            hipotesis.push("Hubo reconocimiento parcial de notas.");
        }

        if (
            coincidencias.fundamental &&
            coincidencias.tipo &&
            respuesta.bajo &&
            esperado.bajo &&
            respuesta.bajo !== esperado.bajo &&
            !categorias.includes("inversion")
        ) {
            categorias.push("inversion");
        }

        if (!categorias.length) {
            categorias.push("error_general");
        }

        const erroresRecientes = historial.filter(item => item && item.correcto === false);
        if (erroresRecientes.length >= 3) {
            categorias.push("error_recurrente");
            hipotesis.push("El error parece repetirse en ejercicios recientes.");
            severidad = Math.min(1, severidad + 0.15);
        }

        return {
            correcto: false,
            categoriaPrincipal,
            categorias,
            severidad,
            indicadores: {
                acertoFundamental: coincidencias.fundamental,
                acertoTipo: coincidencias.tipo,
                acertoInversion: coincidencias.inversion,
                acertoGradoRomano: coincidencias.gradoRomano,
                coincidenciaParcialNotas: coincidencias.notas,
                totalNotasEsperadas: esperado.notasBase.length,
                bajoEsperado: esperado.bajo,
                bajoRespuesta: respuesta.bajo,
                acertoAlteraciones: coincidencias.notas === esperado.notasBase.length
            },
            hipotesis,
            retroalimentacion: construirRetroalimentacion(categoriaPrincipal),
            ajustePedagogico: {
                bajarDificultad: categoriaPrincipal === "error_general",
                reforzarInversiones: categorias.includes("inversion"),
                reforzarTipos: categorias.includes("calidad"),
                reforzarAlteraciones: categorias.includes("lectura_visual_parcial"),
                reforzarFuncionTonal: categorias.includes("funcion_tonal")
            }
        };
    }

    function construirRetroalimentacion(categoria) {
        const mapa = {
            fundamental: {
                breve: "Falló la fundamental.",
                tecnica: "La raíz identificada no coincide con la estructura real del acorde.",
                sugerenciaEjercicio: "Practicar reconocimiento de raíz."
            },
            calidad: {
                breve: "Falló la cualidad.",
                tecnica: "La raíz es correcta, pero el tipo de acorde no coincide.",
                sugerenciaEjercicio: "Practicar comparación entre tipos cercanos."
            },
            inversion: {
                breve: "Falló la inversión.",
                tecnica: "El acorde fue reconocido, pero no el bajo correcto.",
                sugerenciaEjercicio: "Practicar inversiones y lectura del bajo."
            },
            error_general: {
                breve: "Respuesta incorrecta.",
                tecnica: "La respuesta no coincide con varios rasgos estructurales del acorde.",
                sugerenciaEjercicio: "Reducir dificultad y reforzar lectura básica."
            }
        };

        return mapa[categoria] || mapa.error_general;
    }

    return {
        analizar
    };
})();