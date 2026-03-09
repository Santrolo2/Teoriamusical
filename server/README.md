# Maestro de Música con IA

Backend que usa **OpenAI** para dar retroalimentación pedagógica personalizada basada en la experiencia del usuario.

## Requisitos

- Node.js 18+
- Cuenta en [OpenAI](https://platform.openai.com/) y API key

## Instalación

```bash
cd pagina-principal/server
npm install
```

## Configuración

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```

2. Edita `.env` y añade tu clave de OpenAI:
   ```
   OPENAI_API_KEY=sk-tu-clave-aqui
   OPENAI_MODEL=gpt-4o-mini
   ```

   - `gpt-4o-mini`: más económico, buena calidad
   - `gpt-4o`: mejor calidad, más coste

## Ejecutar

```bash
npm start
```

El servidor escuchará en `http://localhost:3001`.

## Uso en la página

La página llama a `POST /api/maestro` con el perfil del usuario, ejercicio actual y evaluación. El backend devuelve retroalimentación personalizada generada por el modelo.

Si la página está en otro puerto (ej. abierta directamente como HTML), configurar CORS está habilitado para `localhost`.

## Cambiar la URL del backend

En el HTML, antes de cargar `llm-maestro.js`:

```html
<script>window.MAESTRO_IA_URL = "http://tu-servidor:3001";</script>
<script src="../../../entrenamiento/llm-maestro.js"></script>
```
