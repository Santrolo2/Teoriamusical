/**
 * Backend del Maestro de Musica con IA
 * Usa Ollama para consultas libres y un motor local para feedback instantaneo.
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import { mkdtemp, readFile, rm, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import {
  respuestaLocalRecomendacion,
  respuestaLocalResumen,
  respuestaLocalRetroalimentacion
} from "./feedback/local-feedback-engine.js";
import progressionsRouter from "./routes/progressions-routes.js";

const app = express();
const PORT = process.env.PORT || 3001;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:latest";
const AUDIVERIS_BIN = process.env.AUDIVERIS_BIN || "audiveris";
const AUDIVERIS_ENABLED = (process.env.AUDIVERIS_ENABLED || "true").toLowerCase() === "true";
const OEMER_PYTHON_BIN = process.env.OEMER_PYTHON_BIN || process.env.PYTHON_BIN || "";
const OEMER_TIMEOUT_RAW = Number.parseInt(process.env.OEMER_TIMEOUT_MS || "", 10);
const OEMER_TIMEOUT_MS = Number.isFinite(OEMER_TIMEOUT_RAW) && OEMER_TIMEOUT_RAW > 0 ? OEMER_TIMEOUT_RAW : 1200000;
const execFileAsync = promisify(execFile);

app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use("/api", progressionsRouter);

const SYSTEM_PROMPT = `/no_think
Eres un maestro de musica experto y pedagogico, integrado en una plataforma web de teoria musical. Tu rol es acompanar al usuario en su aprendizaje de armonia, identificacion de acordes, inversiones y teoria tonal.

Responde de forma directa y visible para el alumno.
No muestres razonamiento interno, notas privadas, cadena de pensamiento ni proceso oculto.
No uses etiquetas como <think> ni explicaciones meta sobre como llegaste a la respuesta.
Ve directo a la retroalimentacion pedagogica final.

## Tu personalidad
- Cercano pero riguroso: explicas con claridad sin simplificar en exceso.
- Usas ejemplos concretos (notas, acordes) cuando son utiles.
- Te adaptas al nivel implicito del usuario segun su historial.
- Nunca das la respuesta directa en ejercicios; guias hacia ella.
- Respondes siempre en espanol.
- Corriges como un buen maestro: senalas el error con sutileza y conviertes la correccion en una oportunidad de razonamiento.
- Hablas como un director de orquesta atento: escuchas, orientas, afinas detalles y haces notar lo importante sin humillar ni imponer.

## Reglas
- No reveles la respuesta final de un ejercicio activo.
- No afirmes como obvio algo que el alumno todavia debe descubrir.
- Usa lenguaje tecnicamente correcto, pero natural y musical.
- Si el usuario hace una pregunta teorica general, puedes responder con mas claridad conceptual.
- Si el usuario esta dentro de un ejercicio, manten el enfoque socratico y guiado.`;

function construirMensajeUsuario(body) {
  const { tipo, modulo, perfil, ejercicio, evaluacion, historialReciente, consulta } = body;
  const partes = [];

  partes.push(`**Modulo actual:** ${modulo || "identificacion de acordes"}`);
  partes.push(`**Tipo de consulta:** ${tipo || "retroalimentacion_error"}`);

  if (perfil && typeof perfil === "object") {
    partes.push("\n**Perfil del usuario:**");
    if (perfil.ejercicios != null) partes.push(`- Ejercicios totales: ${perfil.ejercicios}`);
    if (perfil.correctas != null) partes.push(`- Aciertos: ${perfil.correctas}`);
    if (perfil.precision != null) partes.push(`- Precision: ${perfil.precision}%`);
    if (perfil.debilidades?.length) {
      partes.push("- Debilidades: " + perfil.debilidades.slice(0, 3).map((d) =>
        `${d.clave || d.categoria || d.valor} (${d.precision ?? d.peso ?? "?"}%)`
      ).join("; "));
    }
    if (perfil.fortalezas?.length) {
      partes.push("- Fortalezas: " + perfil.fortalezas.slice(0, 3).map((f) =>
        f.clave || f.categoria || f.valor
      ).join(", "));
    }
  }

  if (ejercicio?.acorde) {
    partes.push("\n**Ejercicio actual:**");
    partes.push(`- Acorde correcto: ${ejercicio.acorde.nombre || "N/A"}`);
    partes.push(`- Tonalidad: ${ejercicio.tonalidad || ejercicio.acorde.tonalidadId || "N/A"}`);
    partes.push(`- Inversion: ${ejercicio.acorde.inversion ?? 0}`);
    partes.push(`- Bajo: ${ejercicio.acorde.bajo || "N/A"}`);
  }

  if (Array.isArray(ejercicio?.acordes) && ejercicio.acordes.length) {
    partes.push("\n**Ejercicio actual de progresion:**");
    partes.push(`- Tonalidad: ${ejercicio.tonalidad || "N/A"}`);
    partes.push(`- Numero de acordes: ${ejercicio.acordes.length}`);
    if (ejercicio.nombre) partes.push(`- Progresion correcta: ${ejercicio.nombre}`);
    if (ejercicio.progStr) partes.push(`- Grados o patron: ${ejercicio.progStr}`);
    if (ejercicio.composerId) partes.push(`- Compositor o estilo: ${ejercicio.composerId}`);
  }

  if (ejercicio?.contextoModulo && typeof ejercicio.contextoModulo === "object") {
    partes.push("\n**Contexto especifico del modulo:**");
    Object.entries(ejercicio.contextoModulo).forEach(([clave, valor]) => {
      if (valor == null || valor === "") return;
      partes.push(`- ${clave}: ${Array.isArray(valor) ? valor.join(", ") : valor}`);
    });
  }

  if (evaluacion) {
    partes.push("\n**Ultima evaluacion:**");
    partes.push(`- Correcto: ${evaluacion.correcto}`);
    if (evaluacion.comparacion) {
      const c = evaluacion.comparacion;
      partes.push(`- Acerto raiz: ${c.raiz}, tipo: ${c.tipo}, inversion: ${c.inversion}`);
    }
    if (evaluacion.respuestaUsuario) {
      partes.push(`- Respuesta del usuario: ${JSON.stringify(evaluacion.respuestaUsuario)}`);
    }
  }

  if (historialReciente?.length) {
    partes.push("\n**Historial reciente (ultimos 5):**");
    historialReciente.slice(0, 5).forEach((h, i) => {
      partes.push(`${i + 1}. ${h.acorde || "?"} - ${h.correcto ? "ok" : "x"} (${h.fecha || ""})`);
    });
  }

  if (consulta && typeof consulta === "string" && consulta.trim()) {
    partes.push("\n**Pregunta o consulta del usuario:**");
    partes.push(consulta.trim());
  }

  return partes.join("\n");
}

async function consultarOllama(userContent) {
  const response = await fetch(`${OLLAMA_URL.replace(/\/$/, "")}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: `${userContent}\n\n/no_think\n\nInstruccion final: responde solo con la respuesta final visible para el alumno, en espanol, sin mostrar razonamiento interno.`,
      system: SYSTEM_PROMPT,
      think: false,
      stream: false,
      options: {
        temperature: 0.4,
        num_predict: 180,
        top_p: 0.9
      }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Error ${response.status}`);
  }

  const texto = typeof data?.response === "string" ? data.response.trim() : "";
  if (!texto) {
    throw new Error("Ollama no devolvio texto.");
  }

  return texto;
}

function parseDataUrl(base64OrDataUrl) {
  if (!base64OrDataUrl || typeof base64OrDataUrl !== "string") return null;
  const match = base64OrDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (match) {
    return {
      mime: match[1],
      buffer: Buffer.from(match[2], "base64")
    };
  }
  return { mime: "image/png", buffer: Buffer.from(base64OrDataUrl, "base64") };
}

async function listFilesRecursively(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFilesRecursively(full);
    return [full];
  }));
  return files.flat();
}

function parseMusicXml(xmlContent) {
  const noteBlocks = xmlContent.match(/<note[\s\S]*?<\/note>/g) || [];
  const notas = [];

  for (const block of noteBlocks) {
    if (/<rest\s*\/>/.test(block) || /<rest>/.test(block)) continue;
    const step = block.match(/<step>([A-G])<\/step>/)?.[1];
    const alterRaw = block.match(/<alter>(-?\d+)<\/alter>/)?.[1];
    const octaveRaw = block.match(/<octave>(\d+)<\/octave>/)?.[1];
    if (!step || !octaveRaw) continue;

    const alter = Number(alterRaw || 0);
    const accidental = alter === 1 ? "#" : alter === -1 ? "b" : "";
    const octava = Number(octaveRaw);

    notas.push({
      nota: `${step}${accidental}${octava}`,
      letra: step,
      accidental,
      octava,
      confianza: 0.95
    });
  }

  const claves = [];
  if (/<sign>G<\/sign>/.test(xmlContent)) claves.push({ tipo: "treble", nombre: "Clave de Sol" });
  if (/<sign>F<\/sign>/.test(xmlContent)) claves.push({ tipo: "bass", nombre: "Clave de Fa" });

  const beats = xmlContent.match(/<beats>(\d+)<\/beats>/)?.[1];
  const beatType = xmlContent.match(/<beat-type>(\d+)<\/beat-type>/)?.[1];
  const compas = beats && beatType
    ? { numerador: Number(beats), denominador: Number(beatType), descripcion: `${beats}/${beatType}` }
    : null;

  return { notas, claves, compas };
}

async function analyzeWithOemer(imageDataUrl) {
  const parsed = parseDataUrl(imageDataUrl);
  if (!parsed?.buffer) throw new Error("Imagen invÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡lida para OMR.");

  const tempRoot = await mkdtemp(path.join(tmpdir(), "maestro-omr-"));
  const inputPath = path.join(tempRoot, "input.png");

  await writeFile(inputPath, parsed.buffer);

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const scriptPath = path.resolve(__dirname, "scripts", "run_oemer.py");

  const pythonCandidates = [
    OEMER_PYTHON_BIN,
    "py",
    "python",
    "python3"
  ].filter(Boolean);

  try {
    let stdout = "";
    let stderr = "";
    let executed = false;
    let lastExecError = null;

    for (const pythonExe of pythonCandidates) {
      try {
        const result = await execFileAsync(pythonExe, [scriptPath, inputPath, tempRoot], {
          windowsHide: true,
          timeout: OEMER_TIMEOUT_MS
        });
        stdout = result.stdout;
        stderr = result.stderr;
        executed = true;
        break;
      } catch (execErr) {
        lastExecError = execErr;
        const code = String(execErr?.code || "");
        if (code === "ENOENT" || code === "EPERM" || code === "EACCES") continue;
        const errMsg = (execErr.stderr || execErr.stdout || execErr.message || "Error desconocido al ejecutar script de Python (Oemer).").trim().slice(-500);
        throw new Error(`Oemer devolvio un error: ${errMsg}`);
      }
    }

    if (!executed) {
      const errMsg = (lastExecError?.message || "No se encontro un ejecutable de Python valido para lanzar Oemer.").trim();
      throw new Error(`No se pudo ejecutar Oemer porque no se encontro Python. Configura OEMER_PYTHON_BIN con una ruta valida. Detalle: ${errMsg}`);
    }

    const xmlPath = (stdout || "").trim();
    if (!xmlPath) {
      const errMsg = (stderr || "No output from Oemer wrapper").trim();
      throw new Error(`Oemer no generÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ MusicXML. Detalle: ${errMsg}`);
    }

    const xml = await readFile(xmlPath, "utf8");
    const parsedXml = parseMusicXml(xml);

    return {
      textoOriginal: "",
      textoLimpio: "",
      notas: parsedXml.notas,
      claves: parsedXml.claves,
      compas: parsedXml.compas,
      confianza: parsedXml.notas.length ? 90 : 0,
      motor: "oemer"
    };
  } finally {
    await rm(tempRoot, { recursive: true, force: true }).catch(() => {});
  }
}

app.post("/api/maestro", async (req, res) => {
  const body = req.body || {};
  const tipo = body.tipo || "retroalimentacion_error";
  const userContent = construirMensajeUsuario(body);

  console.log("--- Consulta al Maestro ---");
  console.log("Tipo:", tipo);

  if (!userContent.trim()) {
    return res.status(400).json({
      error: "Contexto insuficiente",
      mensaje: "Envia al menos perfil, ejercicio o consulta."
    });
  }

  if (tipo === "retroalimentacion_error") {
    return res.json({
      respuesta: respuestaLocalRetroalimentacion(body),
      modelo: "local-feedback-engine"
    });
  }

  if (tipo === "resumen_sesion") {
    return res.json({
      respuesta: respuestaLocalResumen(body),
      modelo: "local-feedback-engine"
    });
  }

  if (tipo === "recomendacion") {
    return res.json({
      respuesta: respuestaLocalRecomendacion(body),
      modelo: "local-feedback-engine"
    });
  }

  try {
    const texto = await consultarOllama(userContent);
    return res.json({ respuesta: texto, modelo: OLLAMA_MODEL });
  } catch (err) {
    console.error("Error en Maestro IA:", err);
    const msg = err?.message || String(err);
    const status = msg.includes("fetch failed") || msg.includes("ECONNREFUSED") || msg.includes("connect")
      ? 503
      : 500;

    return res.status(status).json({
      error: "Error de IA",
      mensaje: status === 503
        ? "No se pudo conectar a Ollama. Asegurate de que Ollama este abierto y de tener instalado el modelo configurado."
        : msg
    });
  }
});

app.post("/api/omr/analyze", async (req, res) => {
  const { imageBase64, engine = "auto" } = req.body || {};

  if (!imageBase64 || typeof imageBase64 !== "string") {
    return res.status(400).json({ mensaje: "Falta imageBase64 en el request." });
  }

  try {
    if (engine === "tesseract") {
      return res.status(422).json({
        mensaje: "El motor tesseract se ejecuta en frontend como fallback local.",
        motor: "tesseract"
      });
    }

    const result = await analyzeWithOemer(imageBase64);
    return res.json(result);
  } catch (error) {
    console.error("Error en Oemer OCR:", error);
    return res.status(503).json({
      mensaje: "No se pudo ejecutar OMR especializado (Oemer).",
      detalle: error?.message || String(error),
      motor: "oemer"
    });
  }
});


app.get("/api/maestro/health", async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL.replace(/\/$/, "")}/api/tags`);
    const data = await response.json().catch(() => ({}));
    const modelos = Array.isArray(data?.models) ? data.models : [];
    const modeloInstalado = modelos.some((m) => m?.name === OLLAMA_MODEL);

    return res.json({
      ok: response.ok && modeloInstalado,
      mensaje: response.ok
        ? (modeloInstalado
            ? "Maestro IA listo."
            : `Ollama responde, pero falta instalar el modelo ${OLLAMA_MODEL}.`)
        : "Ollama no responde correctamente.",
      proveedor: "ollama",
      modelo: OLLAMA_MODEL
    });
  } catch (_) {
    return res.status(503).json({
      ok: false,
      mensaje: "No se pudo conectar a Ollama.",
      proveedor: "ollama",
      modelo: OLLAMA_MODEL
    });
  }
});

app.listen(PORT, () => {
  console.log(`Maestro IA escuchando en http://localhost:${PORT}`);
  console.log(`Usando Ollama en ${OLLAMA_URL} con el modelo ${OLLAMA_MODEL}`);
});
