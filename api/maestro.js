/**
 * Backend del Maestro de Música con IA para Vercel Serverless
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(cors());
app.use(express.json({ limit: "500kb" }));

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const SYSTEM_PROMPT = `Eres un maestro de música experto y pedagógico, integrado en una plataforma web de teoría musical. Tu rol es acompañar al usuario en su aprendizaje de armonía, identificación de acordes, inversiones y teoría tonal.

## Tu personalidad
- Cercano pero riguroso: explicas con claridad sin simplificar en exceso.
- Usas ejemplos concretos (notas, acordes) cuando son útiles.
- Te adaptas al nivel implícito del usuario según su historial.
- Nunca das la respuesta directa en ejercicios; guías hacia ella.
- Respondes siempre en español.

## Contexto que recibirás
- Perfil del usuario: ejercicios realizados, precisión, fortalezas, debilidades, confusiones recurrentes.
- Historial reciente: últimos intentos con acordes, respuestas correctas/incorrectas.
- Ejercicio actual (si aplica): acorde mostrado, tonalidad, inversión.
- Evaluación del último intento (si aplica): qué acertó/falló (raíz, tipo, inversión).

## Tipos de consulta
- "retroalimentacion_error": El usuario acaba de fallar. Explica qué falló sin revelar la respuesta, sugiere cómo pensarlo mejor.
- "resumen_sesion": El usuario pide un resumen. Destaca progreso, debilidades principales y qué practicar después.
- "consulta_libre": El usuario hace una pregunta conceptual. Responde como maestro.
- "recomendacion": Pide qué practicar a continuación según su perfil.

## Reglas
- Máximo 3-5 párrafos. Sé conciso pero sustancioso.
- Si no hay suficiente contexto, indica que practique más para poder personalizar mejor.
- En retroalimentación de errores: menciona el patrón (ej. confusión fundamental/inversión) y da una pista conceptual.`;

function construirMensajeUsuario(body) {
  const { tipo, modulo, perfil, ejercicio, evaluacion, historialReciente, consulta } = body;

  const partes = [];

  partes.push(`**Módulo actual:** ${modulo || "identificación de acordes"}`);
  partes.push(`**Tipo de consulta:** ${tipo || "retroalimentacion_error"}`);

  if (perfil && typeof perfil === "object") {
    partes.push("\n**Perfil del usuario:**");
    if (perfil.ejercicios != null) partes.push(`- Ejercicios totales: ${perfil.ejercicios}`);
    if (perfil.correctas != null) partes.push(`- Aciertos: ${perfil.correctas}`);
    if (perfil.precision != null) partes.push(`- Precisión: ${perfil.precision}%`);
    if (perfil.debilidades?.length) {
      partes.push("- Debilidades: " + perfil.debilidades.slice(0, 3).map(d =>
        `${d.clave || d.categoria || d.valor} (${d.precision ?? d.peso ?? "?"}%)`
      ).join("; "));
    }
    if (perfil.fortalezas?.length) {
      partes.push("- Fortalezas: " + perfil.fortalezas.slice(0, 3).map(f =>
        f.clave || f.categoria || f.valor
      ).join(", "));
    }
    if (perfil.confusiones && Object.keys(perfil.confusiones).length) {
      partes.push("- Confusiones recurrentes: " + Object.entries(perfil.confusiones)
        .slice(0, 5)
        .map(([k, v]) => `${k} (${v}x)`)
        .join("; "));
    }
  }

  if (ejercicio?.acorde) {
    partes.push("\n**Ejercicio actual:**");
    partes.push(`- Acorde correcto: ${ejercicio.acorde.nombre || "N/A"}`);
    partes.push(`- Tonalidad: ${ejercicio.tonalidad || ejercicio.acorde.tonalidadId || "N/A"}`);
    partes.push(`- Inversión: ${ejercicio.acorde.inversion ?? 0}`);
    partes.push(`- Bajo: ${ejercicio.acorde.bajo || "N/A"}`);
  }

  if (evaluacion) {
    partes.push("\n**Última evaluación:**");
    partes.push(`- Correcto: ${evaluacion.correcto}`);
    if (evaluacion.comparacion) {
      const c = evaluacion.comparacion;
      partes.push(`- Acertó raíz: ${c.raiz}, tipo: ${c.tipo}, inversión: ${c.inversion}`);
    }
    if (evaluacion.respuestaUsuario) {
      partes.push(`- Respuesta del usuario: ${JSON.stringify(evaluacion.respuestaUsuario)}`);
    }
  }

  if (historialReciente?.length) {
    partes.push("\n**Historial reciente (últimos 5):**");
    historialReciente.slice(0, 5).forEach((h, i) => {
      partes.push(`${i + 1}. ${h.acorde || "?"} - ${h.correcto ? "✓" : "✗"} (${h.fecha || ""})`);
    });
  }

  if (consulta && typeof consulta === "string" && consulta.trim()) {
    partes.push("\n**Pregunta o consulta del usuario:**");
    partes.push(consulta.trim());
  }

  return partes.join("\n");
}

app.post("/api/maestro", async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      error: "IA no configurada",
      mensaje: "Falta GEMINI_API_KEY en el servidor. Crea un archivo .env con GEMINI_API_KEY=tu_clave"
    });
  }

  const userContent = construirMensajeUsuario(req.body || {});

  if (!userContent.trim()) {
    return res.status(400).json({
      error: "Contexto insuficiente",
      mensaje: "Envía al menos perfil, ejercicio o consulta."
    });
  }

  try {
    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const response = await ai.models.generateContent({
      model: model,
      contents: userContent,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 600,
      }
    });

    const texto = response.text;
    if (!texto) {
      return res.status(500).json({ error: "Sin respuesta", mensaje: "El modelo no devolvió texto." });
    }

    res.json({ respuesta: texto.trim(), modelo: model });
  } catch (err) {
    const msg = err?.message || String(err);
    const status = msg.includes("API_KEY") ? 401 : msg.includes("quota") ? 429 : 500;
    res.status(status).json({
      error: "Error de IA",
      mensaje: msg.includes("API key") ? "Clave API inválida o faltante." : msg
    });
  }
});

app.get("/api/maestro/health", (req, res) => {
  res.json({
    ok: !!ai,
    mensaje: ai ? "Maestro IA listo." : "GEMINI_API_KEY no configurada."
  });
});

// Vercel Serverless requires exporting the app configuration
export default app;
