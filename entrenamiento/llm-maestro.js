/**
 * Cliente del Maestro de Música con IA (LLM real)
 * Llama al backend que usa OpenAI para retroalimentación pedagógica.
 */
(function () {
    "use strict";

    const config = {
        baseUrl: typeof window !== "undefined" && window.MAESTRO_IA_URL
            ? window.MAESTRO_IA_URL
            : "", // Vercel API is local to the same domain now
        timeoutMs: 25000
    };

    function setBaseUrl(url) {
        config.baseUrl = url;
    }

    function getBaseUrl() {
        return config.baseUrl;
    }

    async function consultarMaestro(payload = {}) {
        const url = `${config.baseUrl.replace(/\/$/, "")}/api/maestro`;

        const body = {
            tipo: payload.tipo || "retroalimentacion_error",
            modulo: payload.modulo || "identificacion_acordes",
            perfil: payload.perfil || null,
            ejercicio: payload.ejercicio || null,
            evaluacion: payload.evaluacion || null,
            historialReciente: payload.historialReciente || null,
            consulta: payload.consulta || null
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const mensaje = data.mensaje || data.error || `Error ${res.status}`;
                return { ok: false, error: mensaje, respuesta: null };
            }

            return {
                ok: true,
                respuesta: data.respuesta || "",
                modelo: data.modelo || null,
                error: null
            };
        } catch (err) {
            clearTimeout(timeoutId);

            if (err.name === "AbortError") {
                return { ok: false, error: "La consulta tardó demasiado.", respuesta: null };
            }
            if (err.message && err.message.includes("fetch")) {
                return { ok: false, error: "No se pudo conectar al servidor. ¿Está corriendo el backend?", respuesta: null };
            }
            return { ok: false, error: err.message || "Error al consultar al maestro.", respuesta: null };
        }
    }

    async function comprobarDisponibilidad() {
        const url = `${config.baseUrl.replace(/\/$/, "")}/api/maestro/health`;
        try {
            const ctrl = new AbortController();
            const id = setTimeout(() => ctrl.abort(), 5000);
            const res = await fetch(url, { method: "GET", signal: ctrl.signal });
            clearTimeout(id);
            const data = await res.json().catch(() => ({}));
            return data.ok === true;
        } catch (e) {
            return false;
        }
    }

    if (typeof window !== "undefined") {
        window.LLMMaestro = {
            consultarMaestro,
            comprobarDisponibilidad,
            setBaseUrl,
            getBaseUrl
        };
    }
})();
