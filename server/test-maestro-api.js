async function testMaestro() {
    const payload = {
        tipo: "retroalimentacion_error",
        modulo: "identificacion_acordes",
        ejercicio: {
            acorde: { nombre: "C mayor", raiz: "C", tipo: "major", inversion: 0 },
            tonalidad: "C"
        },
        evaluacion: {
            correcto: false,
            comparacion: { raiz: true, tipo: false, inversion: true },
            diagnostico: { categoriaError: "tipo" }
        }
    };

    try {
        console.log("Consultando /api/maestro...");
        const res = await fetch("http://localhost:3001/api/maestro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log("Respuesta del servidor:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error en el test:", e.message);
    }
}

testMaestro();
