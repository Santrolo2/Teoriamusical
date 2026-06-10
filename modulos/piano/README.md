# Entrenador de Piano

Módulo de entrenamiento para pianistas que proporciona sugerencias de digitación y análisis de partituras mediante OCR/OMR.

## Características

### 1. Modo de Digitación
- **Sugerencias de Digitación Inteligentes**: Sistema que propone digitaciones ergonómicas para cualquier acorde
- **Visualización en Pentagrama**: Muestra el acorde en notación musical estándar
- **Reproducción de Audio**: Escucha el acorde o arpégiado
- **Configuración Flexible**: Selecciona nota raíz, tipo de acorde e inversión
- **Constructor manual por notas**: Permite escribir `C4,E4,G4` para render inmediato en pentagrama
- **Generación Aleatoria**: Practica con acordes aleatorios

### 2. Modo de Ejercicios (pedagógico progresivo)
- **Etapas didácticas**: tríadas en fundamental → tríadas con inversión → acordes de séptima
- **Objetivo visible** por etapa y progreso en sidebar
- **Evaluación guiada** usando el evaluador del proyecto (`IdentificacionAcordes`)
- **Pistas y feedback** con foco formativo

### 3. Modo OCR/OMR (Reconocimiento Óptico de Partitura)
- **Análisis de Partituras**: Sube imágenes de partituras para analizarlas
- **Detección de Notas**: Identifica notas musicales en la imagen
- **Reproducción de Pasajes**: Escucha los pasajes detectados
- **Sugerencias de Digitación**: Obtiene digitaciones para los acordes detectados
- **Feedback de Confianza**: Muestra la confianza del análisis OCR
- **Selector de motor**: Automático / Audiveris (especializado) / Tesseract (fallback)

## Arquitectura del Módulo

### Archivos Principales

```
modulos/piano/
├── piano-trainer.html      # Interfaz de usuario
├── piano-trainer.js        # Lógica principal del módulo
├── estilo.css              # Estilos del módulo
└── README.md               # Esta documentación

core/piano/
├── digitaciones.js         # Sistema de sugerencias de digitación
└── ocr-sheet-music.js     # Motor OCR para partituras
```

### Dependencias

- **Tone.js**: Motor de audio para reproducción de piano
- **VexFlow**: Renderizado de notación musical
- **Audiveris** (backend, opcional): OMR especializado para notación musical (MusicXML)
- **Tesseract.js** (frontend): fallback cuando OMR especializado no está disponible
- **Módulos de Teoría**: ACORDES, NOTAS, TIPOS_ACORDE, etc.
- **AudioEngine**: Sistema de audio compartido

## Uso del Módulo

### Modo de Digitación

1. **Seleccionar o Generar Acorde**:
   - Usa los controles para configurar nota raíz, tipo e inversión
   - O haz clic en "Generar Acorde Aleatorio"

2. **Visualizar el Acorde**:
   - El acorde se muestra en el pentagrama
   - El nombre del acorde aparece arriba

3. **Obtener Digitación**:
   - Haz clic en "Mostrar Digitación"
   - Verás la sugerencia para mano izquierda y derecha
   - Formato: `I: notas (dedos) | D: notas (dedos)`

4. **Reproducir**:
   - "Escuchar": Reproduce el acorde completo
   - "Arpegiar": Reproduce las notas en secuencia ascendente

### Modo OCR

1. **Subir Imagen**:
   - Haz clic en "Seleccionar Imagen"
   - Elige una imagen de una partitura de piano
   - La imagen se mostrará en vista previa

2. **Analizar**:
   - Haz clic en "Analizar Partitura"
   - Espera mientras se procesa la imagen
   - Verás los resultados del análisis

3. **Resultados**:
   - Notas detectadas
   - Claves identificadas
   - Compás detectado
   - Sugerencias de interpretación

4. **Reproducir y Digitación**:
   - "Reproducir": Escucha las notas detectadas
   - Si se detectaron notas, verás sugerencias de digitación

## Sistema de Digitación

### Algoritmo de Sugerencia

El sistema utiliza patrones estándar de digitación pianística:

1. **Triadas (3 notas)**:
   - Posición fundamental: 1-3-5 (derecha), 5-3-1 (izquierda)
   - 1ra inversión: 1-2-5 (derecha), 5-3-1 (izquierda)
   - 2da inversión: 1-3-5 (derecha), 5-2-1 (izquierda)

2. **Acordes de Séptima (4 notas)**:
   - Posición fundamental: 1-2-3-5 (derecha), 5-4-2-1 (izquierda)
   - Inversiones con ajustes ergonómicos

3. **Acordes Extendidos (5+ notas)**:
   - Digitación completa 1-2-3-4-5

### Ergonomía

El sistema verifica que las digitaciones sean ergonómicas:
- Intervalos grandes requieren dedos más separados
- Intervalos pequeños requieren dedos cercanos
- Ajustes automáticos para mejorar la ejecución

## Sistema OCR/OMR

### Proceso de Análisis

1. **Carga de Imagen**: La imagen se carga en el navegador.
2. **Motor Automático**:
   - Intenta primero **Audiveris** por backend (`/api/omr/analyze`) para OMR real.
   - Si no está disponible, cae automáticamente a **Tesseract**.
3. **Normalización de notas**: Se convierten notas detectadas a formato interno.
4. **Conversión a MIDI**: Las notas se convierten a valores MIDI.
5. **Análisis Estructural**: Se determina el tipo de estructura (acorde, frase, pasaje).

### Limitaciones

- La calidad de la imagen afecta la precisión.
- Para mejores resultados, usa imágenes claras, rectas y con buen contraste.
- Si usas Tesseract (fallback), la precisión musical baja frente a Audiveris.
- Se recomienda usar imágenes de un sistema o fragmento corto de partitura.

## Integración con la Aplicación

El módulo está integrado en el menú principal (`index.html`) y sigue los patrones establecidos:

- Usa el mismo sistema de audio (AudioEngine)
- Comparte módulos de teoría musical
- Sigue el estilo visual de la aplicación
- Compatible con el sistema de navegación

## Desarrollo y Extensión

### Agregar Nuevos Patrones de Digitación

Edita `core/piano/digitaciones.js`:

```javascript
const PATRONES_DIGITACION = {
    // Agrega nuevos patrones aquí
    nuevoTipo: {
        posicion_fundamental: [
            { mano: 'derecha', dedos: [1, 2, 3, 4, 5] },
            { mano: 'izquierda', dedos: [5, 4, 3, 2, 1] }
        ]
    }
};
```

### Mejorar el OCR

El sistema OCR puede mejorarse:
- Entrenar modelos personalizados de Tesseract
- Agregar más patrones de reconocimiento
- Implementar preprocesamiento de imágenes
- Usar bibliotecas especializadas en notación musical

## Requisitos del Navegador

- Navegador moderno con soporte ES6+
- Web Audio API (para Tone.js)
- Canvas API (para VexFlow)
- Soporte de FileReader API (para OCR)

## Rendimiento

- **Carga inicial**: ~2-3 segundos (Tone.js + VexFlow)
- **OCR**: 5-15 segundos dependiendo de la imagen
- **Generación de digitación**: <100ms
- **Reproducción de audio**: Latencia mínima

## Solución de Problemas

### El audio no suena
- Verifica que el navegador tenga permisos de audio
- Haz clic en cualquier parte de la página para activar el contexto de audio
- Revisa el control de volumen en la barra lateral

### El OCR no detecta notas
- Asegúrate de que la imagen sea clara y bien iluminada
- Usa imágenes de sistemas individuales, no páginas completas
- Intenta con diferentes resoluciones de imagen

### Las digitaciones parecen incorrectas
- El sistema usa patrones estándar, pero pueden no ser ideales para todos
- Considera tu anatomía y nivel técnico
- Las sugerencias son puntos de partida, no reglas absolutas

## Futuras Mejoras

- [ ] Modo de práctica con metrónomo
- [ ] Historial de acordes practicados
- [ ] Exportación de digitaciones a PDF
- [ ] Integración con MIDI para entrada/salida
- [ ] Modo de análisis de progresiones
- [ ] Reconocimiento de digitación desde video
- [ ] Sistema de retroalimentación personalizada

## Paleta visual del módulo

El módulo de piano usa ahora la misma paleta del proyecto:

- Fondo: `#f5f2eb`
- Primario azul: `#1a2b4c`
- Vino: `#722f37`
- Bordes/acento dorado: `#d4b68a`
- Superficies claras: `#fcfaf7`

## Créditos

- **Tone.js**: Motor de audio web
- **VexFlow**: Renderizado de notación musical
- **Audiveris**: OMR especializado para lectura de partitura
- **Tesseract.js**: OCR de fallback
- **Patrones de digitación**: Basados en técnicas pianísticas estándar

## Licencia

Este módulo es parte del proyecto "Maestro de Teoría Musical IA" y sigue las mismas licencias del proyecto principal.