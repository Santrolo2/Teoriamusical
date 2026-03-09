/**
 * Wrapper de compatibilidad para PerfilPedagogico.
 * Delega a PerfilUsuario cuando está disponible.
 * Mantener este archivo solo si hay referencias externas; en nuevo código usar PerfilUsuario.obtenerPerfilPedagogico().
 */
(function () {
    "use strict";

    function obtenerPerfil() {
        if (window.PerfilUsuario && typeof PerfilUsuario.obtenerPerfilPedagogico === "function") {
            return PerfilUsuario.obtenerPerfilPedagogico();
        }
        return { debilidades: [], fortalezas: [], focoActual: null };
    }

    function registrar(acordeCorrecto, diagnostico, tiempoSegundos) {
        if (!window.PerfilUsuario || !diagnostico) return;
        const acorde = typeof acordeCorrecto === "object" ? acordeCorrecto : { nombre: acordeCorrecto };
        PerfilUsuario.registrarEjercicio(
            acorde,
            diagnostico.correcto ?? false,
            tiempoSegundos || 0,
            null,
            diagnostico
        );
    }

    function obtenerHistorial() {
        if (window.PerfilUsuario && Array.isArray(PerfilUsuario.datos?.historialDiagnostico)) {
            return PerfilUsuario.datos.historialDiagnostico.slice(0, 20);
        }
        return [];
    }

    window.PerfilPedagogico = {
        registrar,
        obtenerPerfil,
        obtenerHistorial
    };
})();
