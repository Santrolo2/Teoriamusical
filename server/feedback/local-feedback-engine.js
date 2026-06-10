import { contextoModulo } from "./module-rules.js";

export function detectarCategoriaError(evaluacion = {}) {
  const comparacion = evaluacion?.comparacion || {};
  const aciertos = [comparacion.raiz, comparacion.tipo, comparacion.inversion].filter((v) => v === true).length;

  if (comparacion.raiz === true && comparacion.tipo === false) return { categoria: "tipo", severidad: 1 };
  if (comparacion.raiz === true && comparacion.tipo === true && comparacion.inversion === false) return { categoria: "inversion", severidad: 0 };
  if (comparacion.raiz === false) return { categoria: "raiz", severidad: aciertos === 0 ? 2 : 1 };
  if (comparacion.tipo === false && comparacion.inversion === false) return { categoria: "mixto", severidad: 2 };
  return { categoria: "general", severidad: 1 };
}

export function nivelComplejidad(body = {}, diagnostico = {}) {
  const historial = Array.isArray(body.historialReciente) ? body.historialReciente : [];
  const erroresRecientes = historial.filter((h) => h && h.correcto === false).length;
  const base = diagnostico.severidad ?? 1;
  return Math.min(2, base + (erroresRecientes >= 3 ? 1 : 0));
}

function construirPistaTecnica(body = {}, diagnostico = {}, complejidad = 1) {
  const modulo = contextoModulo(body);

  if (diagnostico.categoria === "inversion") {
    return complejidad === 0
      ? "Tu lectura esta muy cerca. El detalle a revisar no es el color del acorde, sino la nota estructural que quedo en el bajo y como reordena la disposicion vertical."
      : "Tu lectura del acorde esta casi resuelta. El punto fino esta en la inversion: no cambies la cualidad todavia; confirma primero que nota sostiene realmente la base sonora y preguntate si el bajo pertenece a la raiz o a otra nota estructural del acorde.";
  }

  if (diagnostico.categoria === "tipo") {
    return complejidad === 1
      ? "La raiz parece bien encaminada; el desajuste esta en el color del acorde. En vez de volver a nombrarlo desde cero, compara con cuidado la tercera respecto del bajo y escucha si el acorde se abre con brillo o se recoge con un color mas oscuro."
      : "La base de tu analisis no va mal, pero el error esta en la cualidad del acorde. Conviene centrarte en la tercera y en la quinta, porque ahi se define el color: si esas relaciones cambian, el nombre puede sonar parecido, pero la funcion y el caracter del acorde ya no son los mismos.";
  }

  if (diagnostico.categoria === "raiz") {
    return complejidad === 2
      ? "Aqui conviene reconstruir el razonamiento desde la base. No intentes decidir primero el nombre completo: localiza la nota que organiza el acorde, observa como se apilan las demas voces sobre ella y separa lo que pertenece al bajo real de lo que solo parece sobresalir por registro o brillo."
      : "El punto a corregir esta en la fundamental. Antes de pensar en el nombre del acorde, detente en la nota que realmente organiza la sonoridad y evita confundir la voz mas llamativa con la base armonica.";
  }

  if (diagnostico.categoria === "mixto") {
    return "Aqui no conviene corregir todo a la vez. Vuelve a un procedimiento ordenado: primero define la base del acorde, despues revisa su color y solo al final confirma la disposicion. Ese orden suele aclarar el error con mas rapidez que intentar adivinar el nombre final.";
  }

  return `Hay una parte del razonamiento que todavia no esta firme. Revisa ${modulo.foco} y reduce el analisis a un solo criterio por paso, en lugar de decidir todo al mismo tiempo.`;
}

function construirPreguntasGuiadas(body = {}, diagnostico = {}) {
  const modulo = contextoModulo(body);

  if (diagnostico.categoria === "tipo") {
    return [
      "La tercera que oyes sobre la base te suena mas abierta o mas contenida?",
      modulo.preguntas[1]
    ];
  }

  if (diagnostico.categoria === "inversion") {
    return [
      "Si mantienes el mismo acorde pero cambias solo el bajo, cambia el nombre o solo la disposicion?",
      "Que nota esta sosteniendo realmente la base del acorde en este instante?"
    ];
  }

  if (diagnostico.categoria === "raiz") {
    return [
      modulo.preguntas[0],
      "Que nota seguiria sintiendose estable aunque redistribuyeras las voces superiores?"
    ];
  }

  return modulo.preguntas;
}

export function respuestaLocalRetroalimentacion(body = {}) {
  const diagnostico = detectarCategoriaError(body.evaluacion);
  const complejidad = nivelComplejidad(body, diagnostico);
  const modulo = contextoModulo(body);

  const apertura = [
    "Vas por un camino util; ahora solo conviene afinar un punto concreto.",
    "Hay una intuicion buena en tu intento, pero todavia falta ajustar el razonamiento tecnico.",
    "No estas lejos: el error parece mas de enfoque que de falta de trabajo."
  ][Math.min(complejidad, 2)];

  const tecnica = construirPistaTecnica(body, diagnostico, complejidad);
  const preguntas = construirPreguntasGuiadas(body, diagnostico);

  return [
    apertura,
    tecnica,
    `${preguntas[0]} ${preguntas[1]}`,
    `Como practica inmediata, trabaja asi: ${modulo.practica}`
  ].join("\n\n");
}

export function respuestaLocalResumen(body = {}) {
  const perfil = body.perfil || {};
  const precision = perfil.precision ?? "sin datos";
  const precisionFamilia = perfil.precisionFamilia;
  const precisionPatron = perfil.precisionPatron;
  const debilidad = perfil.debilidades?.[0]?.clave || perfil.debilidades?.[0]?.valor || "un aspecto aun inestable";
  const fortaleza = perfil.fortalezas?.[0]?.clave || perfil.fortalezas?.[0]?.valor || "la constancia en el trabajo";

  const detalleEtapas = (typeof precisionFamilia === "number" || typeof precisionPatron === "number")
    ? `En progresiones, la precision por etapas va en familia: ${typeof precisionFamilia === "number" ? `${precisionFamilia}%` : "sin datos"}, patron exacto: ${typeof precisionPatron === "number" ? `${precisionPatron}%` : "sin datos"}.`
    : null;

  return [
    `Tu sesion muestra una base de trabajo util. La precision actual ronda ${precision}${typeof precision === "number" ? "%" : ""}, y eso ya permite detectar con bastante claridad donde conviene afinar.`,
    detalleEtapas,
    `Lo mas estable por ahora parece ser ${fortaleza}, mientras que el punto que pide mas atencion es ${debilidad}. No hace falta ampliar el repertorio de problemas todavia; conviene consolidar primero ese nucleo.`,
    "Como siguiente paso, mantendria ejercicios breves y comparativos: un mismo patron, una sola variable que cambie y escucha muy consciente del bajo, del color o de la funcion, segun el modulo que estes trabajando."
  ].filter(Boolean).join("\n\n");
}

export function respuestaLocalRecomendacion(body = {}) {
  const diagnostico = detectarCategoriaError(body.evaluacion);
  const mapa = {
    raiz: "Trabaja ejercicios donde debas localizar primero la fundamental antes de nombrar el acorde.",
    tipo: "Conviene comparar acordes con la misma raiz pero distinta cualidad para afinar el color.",
    inversion: "Te ayudaria una serie corta de acordes iguales con inversiones distintas, enfocandote solo en el bajo.",
    mixto: "Lo mejor ahora es reducir variables: misma tonalidad, pocos acordes y un paso de decision por vez.",
    general: "Sigue con ejercicios cortos y retroalimentacion inmediata, priorizando un solo criterio por intento."
  };

  return [
    "La siguiente practica debe ser concreta y economica, no mas dificil por sistema.",
    mapa[diagnostico.categoria] || mapa.general,
    "En cuanto lo estabilices, vuelve a integrar los elementos del modulo completo para comprobar que la mejora ya se sostiene en contexto."
  ].join("\n\n");
}
