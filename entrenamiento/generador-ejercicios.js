const GeneradorEjercicios = (() => {
    "use strict";

    const RAICES = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "G", "G#", "Ab", "A", "A#", "Bb", "B"];
    const TONALIDADES_MAYORES = ["C", "G", "D", "A", "E", "B", "F#", "C#", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];

    function elegir(lista) {
        return lista[Math.floor(Math.random() * lista.length)];
    }

    function indice(max) {
        return Math.floor(Math.random() * max);
    }

    function obtenerTipos() {
        if (TIPOS_ACORDE && typeof TIPOS_ACORDE.listar === "function") {
            return TIPOS_ACORDE.listar().map(t => t.id);
        }
        return ["major", "minor", "diminished", "augmented", "sus2", "sus4", "maj7", "dom7", "min7", "halfDim7", "dim7", "minMaj7"];
    }

    function inversionesValidas(tipoId) {
        const tipo = TIPOS_ACORDE.obtener(tipoId);
        const max = Math.max(0, tipo.cardinalidad - 1);
        return Array.from({ length: max + 1 }, (_, i) => i);
    }

    function construirEjercicio({
        raiz,
        tipo,
        inversion = 0,
        tonalidad = "C",
        origen = "normal",
        meta = {},
        config = {}
    }) {
        const octavaBase = config.octava || (Math.floor(Math.random() * 4) + 2); // Rango 2 a 5

        const acorde = TEORIA.acordes.construir(raiz, tipo, inversion, octavaBase);

        acorde.tonalidadId = tonalidad;
        acorde.gradoRomano = null;

        return {
            id: `ej_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
            modo: "identificacion",
            origen,
            tonalidad,
            acorde,
            meta: {
                octava: octavaBase,
                dificultad: meta.dificultad || 1,
                focoCategoria: meta.focoCategoria || null,
                focoValor: meta.focoValor || null
            },
            respuestaCorrecta: {
                fundamental: acorde.raiz,
                tipoId: acorde.tipo,
                inversion: acorde.inversion,
                nombre: acorde.nombre,
                notasBase: acorde.notasBase,
                gradoRomano: acorde.gradoRomano || null,
                tonalidadId: tonalidad || null,
                bajo: acorde.bajo
            }
        };
    }

    function resolverConfig(config = {}) {
        const tipos = obtenerTipos();

        let raiz = config.raiz;
        let tonalidad = config.tonalidad;
        let tipo = config.tipo;
        let inversion = config.inversion;

        // Adaptatividad: inyectar debilidades específicas
        if (!raiz && !tonalidad && !tipo && !Number.isInteger(inversion) && window.PerfilUsuario) {
            const debilidades = PerfilUsuario.detectarDebilidades();
            if (debilidades && debilidades.length > 0 && Math.random() < 0.6) {
                // 60% de probabilidad de forzar una de las peores debilidades
                const d = elegir(debilidades.slice(0, 3));
                if (d.categoria === "tipo") tipo = d.clave;
                if (d.categoria === "tonalidad") tonalidad = d.clave;
                if (d.categoria === "raiz") raiz = d.clave;
                if (d.categoria === "inversion") inversion = parseInt(d.clave.replace("inv_", ""), 10);
            }
        }

        raiz = raiz || elegir(RAICES);
        tonalidad = tonalidad || elegir(TONALIDADES_MAYORES);

        const tiposPermitidos = Array.isArray(config.tiposPermitidos) && config.tiposPermitidos.length
            ? config.tiposPermitidos.filter(t => tipos.includes(t))
            : tipos;

        tipo = tipo || elegir(tiposPermitidos);

        if (!tiposPermitidos.includes(tipo)) {
            tipo = elegir(tiposPermitidos);
        }

        if (Number.isInteger(inversion)) {
            const validas = inversionesValidas(tipo);
            inversion = validas.includes(inversion) ? inversion : validas[0];
        } else {
            inversion = elegir(inversionesValidas(tipo));
        }

        return { raiz, tonalidad, tipo, inversion };
    }

    function generar(config = {}) {
        const perfil = (window.PerfilUsuario && typeof PerfilUsuario.obtenerPerfilPedagogico === 'function')
            ? PerfilUsuario.obtenerPerfilPedagogico()
            : (typeof PerfilPedagogico !== 'undefined' ? PerfilPedagogico.obtenerPerfil() : { focoActual: null });
        const base = resolverConfig(config);

        const foco = config.foco || (perfil.focoActual ? perfil.focoActual.categoria : null);

        if (foco === "inversion" && !Number.isInteger(config.inversion)) {
            const validas = inversionesValidas(base.tipo);
            base.inversion = elegir(validas.slice(1).length ? validas.slice(1) : validas);
        }

        return construirEjercicio({
            raiz: base.raiz,
            tipo: base.tipo,
            inversion: base.inversion,
            tonalidad: base.tonalidad,
            origen: config.raiz || config.tonalidad || Number.isInteger(config.inversion) ? "manual" : "adaptativo",
            meta: {
                dificultad: config.dificultad || 1,
                focoCategoria: foco,
                focoValor: foco
            },
            config: config
        });
    }

    return {
        generar
    };
})();

window.GeneradorEjercicios = GeneradorEjercicios;
