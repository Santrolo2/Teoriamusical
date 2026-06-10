export function contextoModulo(body = {}) {
  const modulo = body.modulo || "identificacion_acordes";
  const etapa = body?.ejercicio?.contextoModulo?.etapa || body?.evaluacion?.etapa || null;

  if (modulo === "lectura_vertical") {
    return {
      foco: "voces, bajo y disposicion vertical",
      preguntas: [
        "Que voz te esta dando la sensacion de base real del acorde: el bajo o el conjunto completo?",
        "Si ordenas mentalmente las notas desde el bajo, que intervalo te define mejor el color?"
      ],
      practica: "Vuelve a mirar primero el bajo y luego la soprano; despues completa mentalmente la armonia interior."
    };
  }

  if (modulo === "identificacion_progresiones") {
    if (etapa === "familia") {
      return {
        foco: "familia funcional y perfil de tension-resolucion",
        preguntas: [
          "Escuchas una cadencia clara, un ciclo continuo o un patron de cancion?",
          "La energia del recorrido te suena estable, preparatoria o dominantemente tensa?"
        ],
        practica: "Antes de nombrar grados exactos, clasifica la familia funcional del recorrido completo."
      };
    }

    return {
      foco: "patron funcional exacto, direccion armonica y punto de reposo",
      preguntas: [
        "Que grado funcional abre la progresion y cual confirma la llegada?",
        "Hay algun giro predominante-dominante que diferencie esta opcion de otra muy parecida?"
      ],
      practica: "Escucha la progresion en bloques de dos acordes y marca donde aparece la dominante antes de decidir el patron."
    };
  }

  return {
    foco: "raiz, color del acorde e inversion",
    preguntas: [
      "Que nota te parece estructuralmente mas estable?",
      "El color que escuchas depende de la tercera o del bajo?"
    ],
    practica: "Separa primero raiz, despues cualidad y al final revisa el bajo para confirmar la inversion."
  };
}
