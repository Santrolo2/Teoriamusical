/**
 * Perfil unificado del usuario: estadísticas, historial y diagnóstico pedagógico.
 * Sustituye la lógica que antes estaba repartida entre perfil.js y perfil-pedagogico.js.
 */
const PerfilUsuario = {
    datos: {
        ejercicios: 0,
        correctas: 0,
        racha: 0,
        mejorRacha: 0,
        tiempos: [],
        estadisticas: {},
        errores: [],
        historial: [],
        porTonalidad: {},
        porInversion: {},
        porGrado: {},
        porRaiz: {},
        confusiones: {},
        /* Diagnóstico pedagógico (compatible con AnalizadorError / IdentificacionAcordes) */
        erroresPorCategoriaDiagnostico: {},
        historialDiagnostico: []
    },

    init: function(tiposAcordes) {
        tiposAcordes.forEach(tipo => {
            if (!this.datos.estadisticas[tipo.nombre]) {
                this.datos.estadisticas[tipo.nombre] = {
                    correctas: 0,
                    total: 0,
                    tiempos: []
                };
            }
        });

        this.cargar();
    },

    asegurarCategoria: function(obj, clave) {
    if (!obj[clave] || typeof obj[clave] !== 'object') {
        obj[clave] = {};
    }

    if (typeof obj[clave].correctas !== 'number') {
        obj[clave].correctas = 0;
    }

    if (typeof obj[clave].total !== 'number') {
        obj[clave].total = 0;
    }

    if (!Array.isArray(obj[clave].tiempos)) {
        obj[clave].tiempos = [];
    }
},

    /**
     * Mapea categoriaError (IdentificacionAcordes) a categoriaPrincipal (AnalizadorError).
     */
    mapearCategoriaDiagnostico: function(categoriaError) {
        const mapa = {
            raiz: 'fundamental',
            tipo: 'calidad',
            inversion: 'inversion',
            raiz_tipo: 'fundamental',
            raiz_inversion: 'fundamental',
            tipo_inversion: 'calidad',
            global: 'error_general'
        };
        return mapa[categoriaError] || categoriaError || 'error_general';
    },

    registrarEjercicio: function(acorde, esCorrecto, tiempo, respondido = null, diagnostico = null) {
        this.datos.ejercicios++;
        this.datos.tiempos.push(tiempo);

        const tipoNombre = acorde.tipo || 'Desconocido';
        const tonalidad = acorde.tonalidadId || 'Sin tonalidad';
        const inversion = `inv_${acorde.inversion ?? 0}`;
        const grado = acorde.gradoRomano || 'Sin grado';
        const raiz = acorde.raiz || 'Sin raíz';

        this.asegurarCategoria(this.datos.estadisticas, tipoNombre);
        this.asegurarCategoria(this.datos.porTonalidad, tonalidad);
        this.asegurarCategoria(this.datos.porInversion, inversion);
        this.asegurarCategoria(this.datos.porGrado, grado);
        this.asegurarCategoria(this.datos.porRaiz, raiz);

        const grupos = [
            this.datos.estadisticas[tipoNombre],
            this.datos.porTonalidad[tonalidad],
            this.datos.porInversion[inversion],
            this.datos.porGrado[grado],
            this.datos.porRaiz[raiz]
        ];

        grupos.forEach(g => {
            g.total++;
            g.tiempos.push(tiempo);
            if (esCorrecto) {
                g.correctas++;
            }
        });

        if (esCorrecto) {
            this.datos.correctas++;
            this.datos.racha++;

            if (this.datos.racha > this.datos.mejorRacha) {
                this.datos.mejorRacha = this.datos.racha;
            }
        } else {
            this.datos.racha = 0;

            const claveConfusion = `${acorde.nombre} -> ${respondido || 'Sin respuesta'}`;
            this.datos.confusiones[claveConfusion] = (this.datos.confusiones[claveConfusion] || 0) + 1;

            /* Registrar categoría diagnóstica para generación adaptativa */
            if (diagnostico) {
                const cat = diagnostico.categoriaPrincipal ||
                    this.mapearCategoriaDiagnostico(diagnostico.categoriaError);
                this.datos.erroresPorCategoriaDiagnostico[cat] =
                    (this.datos.erroresPorCategoriaDiagnostico[cat] || 0) + 1;

                this.datos.historialDiagnostico.unshift({
                    acorde: acorde.nombre,
                    categoria: cat,
                    tiempo,
                    fecha: new Date().toLocaleString()
                });
                if (this.datos.historialDiagnostico.length > 200) {
                    this.datos.historialDiagnostico.pop();
                }
            }
        }

        this.datos.historial.unshift({
            acorde: acorde.nombre,
            tipo: tipoNombre,
            tonalidad: tonalidad,
            inversion: inversion,
            grado: grado,
            raiz: raiz,
            correcto: esCorrecto,
            tiempo: tiempo,
            respondido: respondido,
            fecha: new Date().toLocaleString()
        });

        if (this.datos.historial.length > 300) {
            this.datos.historial.pop();
        }

        this.guardar();
    },

    registrarError: function(acordeCorrecto, respondido, tiempo) {
        this.datos.errores.unshift({
            acorde: acordeCorrecto.nombre || acordeCorrecto,
            respondido: respondido,
            tiempo: tiempo,
            tipo: acordeCorrecto.tipo || '',
            tonalidad: acordeCorrecto.tonalidadId || '',
            inversion: acordeCorrecto.inversion ?? 0,
            grado: acordeCorrecto.gradoRomano || '',
            fecha: new Date().toLocaleString()
        });

        if (this.datos.errores.length > 80) {
            this.datos.errores.pop();
        }

        this.guardar();
    },

    promedio: function(lista) {
        if (!lista || !lista.length) return '--';
        return (lista.reduce((a, b) => a + b, 0) / lista.length).toFixed(1);
    },

    resumenCategoria: function(obj) {
        return Object.entries(obj).map(([clave, valor]) => {
            const precision = valor.total > 0
                ? Math.round((valor.correctas / valor.total) * 100)
                : 0;

            return {
                clave,
                total: valor.total,
                correctas: valor.correctas,
                precision,
                tiempoPromedio: this.promedio(valor.tiempos)
            };
        });
    },

    detectarDebilidades: function() {
        const grupos = [
            ...this.resumenCategoria(this.datos.estadisticas).map(x => ({ ...x, categoria: 'tipo' })),
            ...this.resumenCategoria(this.datos.porTonalidad).map(x => ({ ...x, categoria: 'tonalidad' })),
            ...this.resumenCategoria(this.datos.porInversion).map(x => ({ ...x, categoria: 'inversion' })),
            ...this.resumenCategoria(this.datos.porGrado).map(x => ({ ...x, categoria: 'grado' })),
            ...this.resumenCategoria(this.datos.porRaiz).map(x => ({ ...x, categoria: 'raiz' }))
        ];

        return grupos
            .filter(x => x.total >= 3)
            .sort((a, b) => {
                if (a.precision !== b.precision) return a.precision - b.precision;
                return parseFloat(b.tiempoPromedio || 0) - parseFloat(a.tiempoPromedio || 0);
            })
            .slice(0, 8);
    },

    detectarFortalezas: function() {
        const grupos = [
            ...this.resumenCategoria(this.datos.estadisticas).map(x => ({ ...x, categoria: 'tipo' })),
            ...this.resumenCategoria(this.datos.porTonalidad).map(x => ({ ...x, categoria: 'tonalidad' })),
            ...this.resumenCategoria(this.datos.porInversion).map(x => ({ ...x, categoria: 'inversion' })),
            ...this.resumenCategoria(this.datos.porGrado).map(x => ({ ...x, categoria: 'grado' })),
            ...this.resumenCategoria(this.datos.porRaiz).map(x => ({ ...x, categoria: 'raiz' }))
        ];

        return grupos
            .filter(x => x.total >= 3)
            .sort((a, b) => {
                if (a.precision !== b.precision) return b.precision - a.precision;
                return parseFloat(a.tiempoPromedio || 999) - parseFloat(b.tiempoPromedio || 999);
            })
            .slice(0, 8);
    },

    /**
     * Detecta debilidades por categoría diagnóstica (fundamental, calidad, inversión).
     * Usado por GeneradorEjercicios para ejercicios adaptativos.
     */
    detectarDebilidadesDiagnostico: function() {
        const obj = this.datos.erroresPorCategoriaDiagnostico || {};
        const total = this.datos.ejercicios || 1;

        return Object.entries(obj)
            .map(([categoria, count]) => ({
                categoria,
                valor: categoria,
                peso: count / total
            }))
            .sort((a, b) => b.peso - a.peso)
            .slice(0, 5);
    },

    /**
     * Devuelve el perfil pedagógico para generación adaptativa.
     * Compatible con la API de PerfilPedagogico.obtenerPerfil().
     */
    obtenerPerfilPedagogico: function() {
        const debilidades = this.detectarDebilidadesDiagnostico();
        return {
            debilidades,
            fortalezas: [], /* Las fortalezas por diagnóstico se pueden añadir luego */
            focoActual: debilidades.length ? debilidades[0] : null
        };
    },

    obtenerRecomendacion: function() {
        const debilidades = this.detectarDebilidades();

        if (!debilidades.length) {
            return "Aún no hay suficiente historial. Conviene practicar un poco más para detectar patrones reales.";
        }

        const d = debilidades[0];

        const nombres = {
            tipo: 'tipos de acorde',
            tonalidad: 'tonalidades',
            inversion: 'inversiones',
            grado: 'grados',
            raiz: 'raíces'
        };

        return `Conviene insistir en ${nombres[d.categoria] || d.categoria}: ${d.clave}. Precisión ${d.precision}% y tiempo promedio ${d.tiempoPromedio}s.`;
    },

    obtenerEstadisticas: function() {
        const precision = this.datos.ejercicios > 0
            ? Math.round((this.datos.correctas / this.datos.ejercicios) * 100)
            : 0;

        const velocidad = this.promedio(this.datos.tiempos);

        return {
            ejercicios: this.datos.ejercicios,
            correctas: this.datos.correctas,
            racha: this.datos.racha,
            mejorRacha: this.datos.mejorRacha,
            precision: precision,
            velocidad: velocidad,
            estadisticas: this.datos.estadisticas,
            errores: this.datos.errores,
            historial: this.datos.historial,
            porTonalidad: this.resumenCategoria(this.datos.porTonalidad),
            porInversion: this.resumenCategoria(this.datos.porInversion),
            porGrado: this.resumenCategoria(this.datos.porGrado),
            porRaiz: this.resumenCategoria(this.datos.porRaiz),
            fortalezas: this.detectarFortalezas(),
            debilidades: this.detectarDebilidades(),
            debilidadesDiagnostico: this.detectarDebilidadesDiagnostico(),
            perfilPedagogico: this.obtenerPerfilPedagogico(),
            recomendacion: this.obtenerRecomendacion(),
            confusiones: this.datos.confusiones
        };
    },

    guardar: function() {
        localStorage.setItem('bitacoraArmonica', JSON.stringify(this.datos));
    },

    cargar: function() {
        const datos = localStorage.getItem('bitacoraArmonica');
        if (datos) {
            try {
                const parsed = JSON.parse(datos);
                this.datos = { ...this.datos, ...parsed };
            } catch (e) {
                console.error('Error cargando perfil:', e);
            }
        }
    },

    normalizarDatos: function() {
    if (!Array.isArray(this.datos.tiempos)) this.datos.tiempos = [];
    if (!Array.isArray(this.datos.errores)) this.datos.errores = [];
    if (!Array.isArray(this.datos.historial)) this.datos.historial = [];

    if (!this.datos.estadisticas || typeof this.datos.estadisticas !== 'object') {
        this.datos.estadisticas = {};
    }

    if (!this.datos.porTonalidad || typeof this.datos.porTonalidad !== 'object') {
        this.datos.porTonalidad = {};
    }

    if (!this.datos.porInversion || typeof this.datos.porInversion !== 'object') {
        this.datos.porInversion = {};
    }

    if (!this.datos.porGrado || typeof this.datos.porGrado !== 'object') {
        this.datos.porGrado = {};
    }

    if (!this.datos.porRaiz || typeof this.datos.porRaiz !== 'object') {
        this.datos.porRaiz = {};
    }

    if (!this.datos.confusiones || typeof this.datos.confusiones !== 'object') {
        this.datos.confusiones = {};
    }
    if (!this.datos.erroresPorCategoriaDiagnostico || typeof this.datos.erroresPorCategoriaDiagnostico !== 'object') {
        this.datos.erroresPorCategoriaDiagnostico = {};
    }
    if (!Array.isArray(this.datos.historialDiagnostico)) {
        this.datos.historialDiagnostico = [];
    }

    Object.keys(this.datos.estadisticas).forEach(clave => {
        this.asegurarCategoria(this.datos.estadisticas, clave);
    });

    Object.keys(this.datos.porTonalidad).forEach(clave => {
        this.asegurarCategoria(this.datos.porTonalidad, clave);
    });

    Object.keys(this.datos.porInversion).forEach(clave => {
        this.asegurarCategoria(this.datos.porInversion, clave);
    });

    Object.keys(this.datos.porGrado).forEach(clave => {
        this.asegurarCategoria(this.datos.porGrado, clave);
    });

    Object.keys(this.datos.porRaiz).forEach(clave => {
        this.asegurarCategoria(this.datos.porRaiz, clave);
    });
    },

    registrarIntento: function({ modulo, ejercicio, evaluacion }) {
        const acorde = ejercicio?.acorde || (ejercicio?.respuestaCorrecta ? {
            tipo: ejercicio.respuestaCorrecta.tipoId,
            tonalidadId: ejercicio.tonalidad || ejercicio.respuestaCorrecta?.tonalidadId,
            inversion: ejercicio.respuestaCorrecta?.inversion ?? 0,
            gradoRomano: ejercicio.respuestaCorrecta?.gradoRomano,
            raiz: ejercicio.respuestaCorrecta?.fundamental,
            nombre: ejercicio.respuestaCorrecta?.nombre
        } : {});
        const correcto = evaluacion?.correcto ?? false;
        const tiempo = Number(evaluacion?.tiempoRespuesta ?? 0);
        const resp = evaluacion?.respuestaUsuario;
        const respondido = resp && typeof resp === 'object'
            ? this._construirNombreAcorde(resp.raiz, resp.tipo, resp.inversion)
            : null;
        const diagnostico = evaluacion?.diagnostico || null;

        this.registrarEjercicio(acorde, correcto, tiempo, respondido, diagnostico);
    },

    _construirNombreAcorde: function(raiz, tipoId, inversion) {
        if (!raiz || !tipoId) return null;
        const tipo = window.TIPOS_ACORDE?.obtener?.(tipoId);
        const sufijo = tipo?.simbolo ?? tipoId;
        const base = raiz + (sufijo && sufijo !== 'major' ? sufijo : '');
        if (Number.isInteger(inversion) && inversion > 0) {
            return base + '/' + (inversion === 1 ? '3' : inversion === 2 ? '5' : '');
        }
        return base;
    },

};

window.PerfilUsuario = PerfilUsuario;