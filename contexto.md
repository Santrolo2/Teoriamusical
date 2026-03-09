# Plataforma de Teoría Musical con Asistente de IA Pedagógica

## Visión general

Este proyecto consiste en el desarrollo de una **plataforma integral para el aprendizaje, análisis y experimentación en teoría musical**, centrada principalmente en **armonía tonal, construcción de acordes, análisis armónico y composición asistida**.

La plataforma combina:

- visualización musical interactiva mediante notación
- motores de análisis armónico
- entrenamiento pedagógico adaptativo
- un asistente de inteligencia artificial especializado en teoría musical

El objetivo es construir un entorno en el que el usuario pueda **aprender teoría musical, practicar reconocimiento armónico, analizar estructuras musicales y desarrollar ideas compositivas**, mientras el sistema registra su progreso y adapta la dificultad de los ejercicios.

La plataforma no busca sustituir el proceso creativo del usuario, sino **acompañar y fortalecer su pensamiento musical**.

---

# Enfoque pedagógico

El sistema se basa en un enfoque de **pedagogía adaptativa basada en diagnóstico de errores**.

En lugar de limitarse a indicar si una respuesta es correcta o incorrecta, el sistema analiza:

- qué parte del acorde fue mal identificada
- qué concepto musical está siendo confundido
- qué patrones de error aparecen de forma recurrente

Con base en ese análisis, el sistema puede:

- generar ejercicios dirigidos
- ajustar la dificultad
- reforzar conceptos específicos
- ofrecer pistas pedagógicas
- construir un perfil de aprendizaje del usuario

El objetivo es desarrollar **comprensión estructural de la música**, no simplemente memorización de respuestas.

---

# Motor de inteligencia artificial pedagógica

La plataforma integra un **motor de inteligencia artificial especializado en teoría musical** que funciona como un asistente analítico y pedagógico.

Este motor tiene tres funciones principales.

---

## Diagnóstico de aprendizaje

El sistema analiza las respuestas del usuario para detectar patrones como:

- confusión entre tipos de acordes
- errores en inversiones
- errores de identificación de fundamental
- dificultades con alteraciones
- errores de contexto tonal

Con esta información se construye un **perfil pedagógico dinámico**.

---

## Generación adaptativa de ejercicios

A partir del perfil pedagógico, el sistema puede ajustar automáticamente:

- tipos de acordes presentados
- tonalidades utilizadas
- inversiones
- complejidad armónica
- frecuencia de refuerzos

El objetivo es dirigir la práctica hacia **las áreas donde el usuario presenta más dificultades**.

---

## Asistencia conceptual

El asistente también puede funcionar como guía conceptual.

Puede:

- explicar estructuras armónicas
- sugerir análisis
- proponer ejercicios
- ofrecer pistas conceptuales
- ayudar al usuario a desarrollar razonamiento musical

La IA actúa como un **compañero de estudio musical**, no como un solucionador automático de ejercicios.

---

# Arquitectura general del sistema

La plataforma está organizada en varios motores internos y módulos de interfaz.

---

# Motores del sistema

## Motor de teoría musical

Gestiona la lógica fundamental de la teoría musical:

- notas
- intervalos
- escalas
- tonalidades
- tipos de acordes
- inversiones
- construcción armónica

Este motor es la base de todos los demás sistemas.

---

## Motor armónico

Encargado de la generación y análisis de estructuras armónicas:

- progresiones armónicas
- funciones tonales
- relaciones entre acordes
- análisis funcional

---

## Motor de notación musical

Se encarga de representar gráficamente la música mediante **VexFlow**.

Permite mostrar:

- acordes en pentagrama
- progresiones armónicas
- estructuras musicales

---

## Motor pedagógico

Este motor gestiona el aprendizaje del usuario.

Incluye:

- análisis de errores
- generación de ejercicios
- perfil pedagógico
- adaptación de dificultad

---

## Motor de inteligencia musical

Este componente actúa como asistente de alto nivel.

Puede:

- analizar decisiones armónicas
- sugerir alternativas
- ofrecer explicaciones conceptuales
- ayudar en procesos de composición

---

# Módulos de la plataforma

La interfaz está organizada en módulos independientes.

---

# Fundamentos de teoría musical

Este módulo permite estudiar los conceptos básicos:

- intervalos
- escalas
- tonalidades
- construcción de acordes
- relaciones armónicas

Incluye visualizaciones y ejercicios interactivos.

---

# Identificación de acordes

Módulo de entrenamiento donde el usuario debe identificar acordes mostrados en notación.

Funciones principales:

- generación automática de acordes
- visualización en pentagrama
- selección entre múltiples opciones
- análisis detallado de errores
- pistas pedagógicas
- estadísticas de desempeño

Este módulo constituye la base del **sistema de entrenamiento adaptativo**.

---

# Laboratorio de acordes

Herramienta interactiva para explorar la construcción de acordes.

Permite:

- construir acordes manualmente
- visualizar notas
- explorar inversiones
- analizar relaciones armónicas

Este módulo favorece el aprendizaje exploratorio.

---

# Progresiones armónicas

Herramienta para el estudio de progresiones.

Permite:

- generar progresiones
- analizar funciones armónicas
- estudiar movimientos tonales
- experimentar con sustituciones armónicas

---

# Transposición

Herramienta para:

- transponer acordes
- transponer progresiones
- estudiar cambios tonales

Esto permite comprender la **estructura relativa de la armonía**.

---

# Piano y digitación

Módulo visual para representar acordes en teclado.

Incluye:

- visualización en piano
- estudio de inversiones
- digitación básica

Permite conectar la teoría con la ejecución instrumental.

---

# Composición asistida

Entorno creativo donde el sistema puede ayudar al usuario a desarrollar ideas musicales.

Funciones posibles:

- sugerencias de progresiones
- análisis armónico de ideas
- exploración de estilos armónicos
- generación de variaciones

El sistema no busca generar música automáticamente, sino **estimular la creatividad del usuario**.

---

# Objetivo final del proyecto

El objetivo final es construir una plataforma que integre en un mismo entorno:

- aprendizaje de teoría musical
- entrenamiento armónico
- análisis estructural
- exploración compositiva
- asistencia inteligente

De esta forma, el usuario puede **estudiar música, analizarla y crearla dentro de un mismo sistema interactivo**.