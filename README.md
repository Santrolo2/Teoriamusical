# TeoriaMusical

Sistema de entrenamiento de progresiones armónicas basado en reglas de teoría musical. Permite generar ejercicios, consultar progresiones y visualizar acordes en pentagrama.

---

## Arquitectura

* **Backend:** Node.js + Express
* **Base de datos:** SQLite
* **Renderizado musical:** VexFlow
* **Estructura:** separación de lógica de negocio, acceso a datos y generación de ejercicios

El sistema está diseñado para ser extensible en catálogo armónico y adaptable a distintos modos de entrenamiento.

---

## Funcionalidades

* Generación de ejercicios armónicos basada en reglas
* Consulta de progresiones por tonalidad, modo y patrón
* Visualización de acordes en pentagrama
* Manejo de estado de sesión para entrenamiento interactivo
* Clasificación estructurada de información musical

---

## Modelo de datos

La base de datos está organizada en múltiples entidades relacionadas:

* **Progressions:** secuencias armónicas
* **Degrees:** grados dentro de la progresión
* **Harmonic Functions:** función tonal de cada grado
* **Realizations:** posibles ejecuciones de la progresión
* **Tags / Metadata:** clasificación adicional

Diseño orientado a normalización y reutilización.

---

## API

Ejemplos de endpoints:

* `GET /api/progressions`
* `GET /api/progressions/:id`
* `GET /api/progressions/:id/degrees`
* `GET /api/progressions/:id/realizations`
* `GET /api/composers`
* `GET /api/keys`

La API permite acceso estructurado a la información armónica para generación de ejercicios o análisis.

---

## Lógica del sistema

* Separación entre generación de ejercicios y datos base
* Uso de reglas armónicas para construir progresiones válidas
* Estado de sesión para seguimiento del entrenamiento
* Renderizado visual independiente de la lógica

---

## Uso

```bash
npm install
npm start
```

Acceder a los endpoints desde navegador o cliente HTTP.

---

## Objetivo

Construir un sistema escalable para entrenamiento de teoría musical que permita:

* Expandir el catálogo de progresiones
* Integrar nuevos modelos de generación
* Aplicarse en contextos de aprendizaje o análisis automatizado

---

## Notas

Proyecto en desarrollo. La estructura está pensada para escalar hacia sistemas más complejos de generación y evaluación musical.
