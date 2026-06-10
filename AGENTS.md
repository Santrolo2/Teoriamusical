# AGENTS.md

## Proyecto
Biblioteca y sistema de entrenamiento de teoría musical basado en:
- Node 20+
- Express
- SQLite (archivo local)
- Frontend JS vanilla

La base principal es `progressiones.db`.
El esquema inicial proviene de `schema_progressions.sql`.

## Objetivo actual
Expandir el MVP de la biblioteca para volverlo pedagógicamente útil, sin romper compatibilidad hacia atrás.

## Reglas de arquitectura
- No usar ORM.
- Mantener SQL directo + Express.
- Mantener SQLite como base principal.
- No reemplazar la arquitectura existente.
- No hacer refactor general del proyecto salvo que sea imprescindible para corregir algo puntual.
- Priorizar cambios pequeños, verificables y de bajo riesgo.

## Compatibilidad
- No eliminar endpoints existentes.
- No renombrar endpoints existentes.
- No quitar campos existentes en respuestas JSON.
- Solo agregar campos opcionales nuevos.
- No romper el flujo actual del frontend.
- Si hay duda entre limpieza interna y compatibilidad, priorizar compatibilidad.

## Prioridad editorial de contenido
La prioridad de esta base no es exhaustividad musicológica total en esta iteración.
La prioridad es utilidad pedagógica.

### Orden de trabajo
1. Completar las progresiones existentes.
2. Agregar perfil pedagógico a todas las progresiones activas.
3. Agregar pistas pedagógicas.
4. Expandir realizaciones por tonalidad.
5. Agregar assets placeholder coherentes.
6. Exponer los datos nuevos por API.
7. Mostrar esos datos en frontend con cambios mínimos.
8. Solo después considerar agregar nuevas progresiones.

## Reglas para poblar contenido
- No inventar citas falsas de compases.
- Si no hay compás exacto o sección exacta, dejar `measure_start` y `measure_end` en NULL.
- Se aceptan progresiones estilísticamente plausibles si quedan descritas como modelo estilístico y no como cita literal documental.
- Distinguir siempre entre:
  - función armónica
  - color armónico
  - modelo estilístico
  - ejemplo de obra

## Convenciones analíticas
- Usar números romanos claros: `I`, `ii`, `V7`, `bVI`, `N6`, `I6/4`, etc.
- En modo menor tonal, usar dominante mayor cuando sea funcionalmente correcto.
- Tratar `I6/4` cadencial como función cadencial, no como tónica estable.
- Etiquetar mezcla modal como `Modal Mixture` cuando corresponda.
- No forzar progresiones coloristas de Debussy a teleología funcional fuerte si el modelo es claramente modal o colorista.
- Separar progresiones funcionales de progresiones de color.
- Mantener coherencia entre `canonical_roman`, `progression_degrees` y `harmonic_functions`.

## Prioridades por compositor
Orden de prioridad para enriquecer contenido:
1. Rossini
2. Poulenc
3. Debussy
4. Mozart
5. Beethoven
6. Chopin
7. Verdi
8. Bellini
9. Donizetti
10. Tchaikovsky
11. Rachmaninoff
12. Schumann
13. Brahms

## Objetivos mínimos por iteración
Para la iteración actual, cada progresión existente debe terminar con:
- perfil pedagógico
- al menos 2 pistas pedagógicas
- al menos 4 realizaciones
- idealmente 6 realizaciones
- al menos un indicador de material disponible o placeholder razonable

## Prioridad de tonalidades para realizaciones
Primero cubrir tonalidades pedagógicamente comunes.

### Mayores prioritarias
- C major
- G major
- F major
- D major
- Bb major
- Eb major

### Menores prioritarias
- A minor
- D minor
- E minor
- G minor
- C minor
- F minor

No intentar cubrir las 24 tonalidades en una sola pasada si eso reduce la calidad de los datos.

## Cambios de base de datos
- Preferir tablas nuevas periféricas antes que alterar agresivamente tablas centrales.
- Si SQLite requiere validar columnas antes de `ALTER TABLE`, comprobar primero con `PRAGMA table_info`.
- Mantener migraciones seguras e idempotentes en la medida de lo posible.
- Si una migración no puede ser 100% idempotente solo con SQL de SQLite, resolver la parte condicional en el runner de Node.

## Backend
- Mantener rutas existentes intactas.
- Agregar endpoints nuevos solo cuando aporten valor claro.
- Usar SQL parametrizado con placeholders.
- Evitar joins que dupliquen registros sin necesidad.
- Si una respuesta puede crecer mucho, permitir incluir datos pesados solo con query params opcionales.
- Preferir endpoints agregados útiles como `study-pack` para evitar demasiadas llamadas del frontend.

## Frontend
- No rediseñar toda la interfaz.
- Reutilizar HTML y CSS existentes.
- Agregar bloques nuevos solo dentro de contenedores ya existentes si es posible.
- Priorizar mostrar:
  - dificultad
  - realizaciones disponibles
  - pedagogía
  - pistas
  - material
- Mantener la experiencia actual de filtros.

## Definición de terminado para esta fase
El trabajo se considera completo cuando:
1. Existen migración y seed nuevos.
2. La base puede actualizarse sin romper datos previos.
3. Los endpoints actuales siguen respondiendo.
4. Existen endpoints nuevos para pedagogía/cobertura/study-pack.
5. El frontend muestra pedagogía, pistas y material.
6. Cada progresión actual tiene perfil pedagógico.
7. Cada progresión actual tiene al menos 4 realizaciones o queda claramente reportado qué faltó.
8. Se entrega validación final con archivos modificados, comandos ejecutados y pendientes reales.

## Validación obligatoria
Antes de cerrar una tarea:
- arrancar servidor
- verificar que no se rompan endpoints existentes
- probar endpoints nuevos
- ejecutar queries de control de calidad
- reportar resultados concretos
- no afirmar que algo funciona sin haberlo verificado

## Forma de trabajar
- Primero inspeccionar el código relevante.
- Luego proponer cambios breves.
- Después implementar.
- Finalmente validar.
- No entregar pseudocódigo cuando se pidió implementación.
- No introducir complejidad innecesaria.