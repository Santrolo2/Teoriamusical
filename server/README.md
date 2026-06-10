# Maestro de Musica con IA

Backend que usa **Ollama** para dar retroalimentacion pedagogica personalizada basada en la experiencia del usuario.

## Requisitos

- Node.js 20+
- [Ollama](https://ollama.com/download) instalado y abierto
- Modelo local descargado, recomendado: `llama3.2:latest`
- **Opcional (OMR especializado para partituras):** [Audiveris](https://audiveris.github.io/audiveris/) instalado

## Instalacion

```bash
cd pagina-principal/server
npm install
```

## Biblioteca SQL de progresiones (SQLite)

El backend ahora incluye una base SQLite para progresiones historicas.

1. Inicializa la base desde `schema_progressions.sql`:

```bash
npm run db:init
```

2. Esto crea `progressiones.db` en la raiz del proyecto.

3. Aplica la extension Fase 1 (migracion + seed incremental):

```bash
npm run db:phase1
```

4. (Opcional recomendado) Aplica curacion Fase 2 (mas realizaciones, variantes y ejemplos):

```bash
npm run db:seed:phase2
```

Tambien puedes ejecutar por separado:

```bash
npm run db:migrate:phase1
npm run db:seed:phase1
npm run db:seed:phase2
```

Flujo completo (base + Fase 1 + Fase 2):

```bash
npm run db:phase2
```

Variables opcionales:

```env
PROGRESSIONS_DB_PATH=../../progressiones.db
PROGRESSIONS_SCHEMA_PATH=../../schema_progressions.sql
PROGRESSIONS_PHASE1_MIGRATION_PATH=./sql/progressions-phase1-migration.sql
PROGRESSIONS_PHASE1_SEED_PATH=./sql/progressions-phase1-seed.sql
PROGRESSIONS_PHASE2_SEED_PATH=./sql/progressions-phase2-seed.sql
```

## Preparar Ollama

Instala el modelo recomendado:

```bash
ollama pull llama3.2:latest
```

Puedes probarlo con:

```bash
ollama run llama3.2:latest
```

## Configuracion

1. Copia el archivo de ejemplo:
   ```bash
   copy .env.example .env
   ```

2. Ajusta `.env` si lo necesitas:
   ```
   OLLAMA_URL=http://127.0.0.1:11434
   OLLAMA_MODEL=llama3.2:latest
   PORT=3001
   AUDIVERIS_ENABLED=true
   AUDIVERIS_BIN=audiveris
   ```

### OCR/OMR de partituras (módulo piano)

El módulo de piano soporta dos motores:

- **Audiveris (OMR especializado, recomendado):** vía `POST /api/omr/analyze`.
- **Tesseract (fallback):** se ejecuta del lado frontend si Audiveris no está disponible.

Si Audiveris no está instalado o falla, el frontend cae automáticamente a Tesseract.

En Windows, si `audiveris` no está en el PATH, configura `AUDIVERIS_BIN` con ruta absoluta, por ejemplo:

```env
AUDIVERIS_BIN=C:\\Program Files\\Audiveris\\bin\\audiveris.bat
OEMER_PYTHON_BIN=C:\\ruta\\a\\python.exe
```

## Ejecutar

```bash
npm start
```

El servidor escuchara en `http://localhost:3001`.

## Verificacion

Con Ollama abierto y el modelo instalado:

```bash
curl http://localhost:3001/api/maestro/health
```

Debe indicar que el maestro esta listo.

Verificacion rapida de la API de progresiones:

```bash
curl http://localhost:3001/api/composers
curl "http://localhost:3001/api/progressions?mode=major"
curl http://localhost:3001/api/progressions/1
curl http://localhost:3001/api/progressions/1/degrees
curl http://localhost:3001/api/progressions/1/realizations
```

Prueba rápida del endpoint OMR (sin imagen real, solo para validar ruta):

```bash
curl -X POST http://localhost:3001/api/omr/analyze -H "Content-Type: application/json" -d "{\"imageBase64\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB\",\"engine\":\"audiveris\"}"
```

## Uso en la pagina

La pagina llama a `POST /api/maestro` con el perfil del usuario, ejercicio actual y evaluacion. El backend devuelve retroalimentacion generada por el modelo local.

### Endpoints SQL disponibles

- `GET /api/composers`
- `GET /api/keys`
- `GET /api/progressions`
- `GET /api/progressions/:id`
- `GET /api/progressions/:id/degrees`
- `GET /api/progressions/:id/realizations`
- `GET /api/progressions/:id/pedagogy` (si Fase 1 esta aplicada)
- `GET /api/progressions/:id/errors` (si Fase 1 esta aplicada)
- `GET /api/realizations/:id/variants` (si Fase 1 esta aplicada)
- `GET /api/coverage/summary` (si Fase 1 esta aplicada)

Filtros soportados en `/api/progressions`:
- `composer` o `compositor`
- `key` o `tonalidad`
- `mode` o `modo`
- `roman_pattern` (tambien `roman`, `patron_romano`, `patron`, `pattern`)
- `level` o `nivel`
- `core_only` o `is_core`
- `has_audio`
- `has_notation`
- `has_examples`

## Cambiar la URL del backend

En el HTML, antes de cargar `llm-maestro.js`:

```html
<script>window.MAESTRO_IA_URL = "http://tu-servidor:3001";</script>
<script src="../../../entrenamiento/llm-maestro.js"></script>
```
