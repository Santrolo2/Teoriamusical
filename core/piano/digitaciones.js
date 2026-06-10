// ============================================
// MODULO: DIGITACIONES DE PIANO
// Sistema de sugerencias de digitación para acordes
// ============================================

const DIGITACIONES = (() => {
    "use strict";

    // Mapeo de notas a números MIDI para cálculos de distancia
    const NOTAS_MIDI = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
        'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
        'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };

    // Patrones de digitación estándar para acordes
    const PATRONES_DIGITACION = {
        // Acordes triádicos (3 notas)
        triada: {
            posicion_fundamental: [
                { mano: 'derecha', dedos: [1, 3, 5] },
                { mano: 'izquierda', dedos: [5, 3, 1] }
            ],
            primera_inversion: [
                { mano: 'derecha', dedos: [1, 2, 5] },
                { mano: 'izquierda', dedos: [5, 3, 1] }
            ],
            segunda_inversion: [
                { mano: 'derecha', dedos: [1, 3, 5] },
                { mano: 'izquierda', dedos: [5, 2, 1] }
            ]
        },
        // Acordes de séptima (4 notas)
        septima: {
            posicion_fundamental: [
                { mano: 'derecha', dedos: [1, 2, 3, 5] },
                { mano: 'izquierda', dedos: [5, 4, 2, 1] }
            ],
            primera_inversion: [
                { mano: 'derecha', dedos: [1, 2, 3, 5] },
                { mano: 'izquierda', dedos: [5, 3, 2, 1] }
            ],
            segunda_inversion: [
                { mano: 'derecha', dedos: [1, 2, 4, 5] },
                { mano: 'izquierda', dedos: [5, 3, 2, 1] }
            ],
            tercera_inversion: [
                { mano: 'derecha', dedos: [1, 2, 3, 5] },
                { mano: 'izquierda', dedos: [5, 4, 2, 1] }
            ]
        },
        // Acordes extendidos (5+ notas)
        extendido: {
            posicion_fundamental: [
                { mano: 'derecha', dedos: [1, 2, 3, 4, 5] },
                { mano: 'izquierda', dedos: [5, 4, 3, 2, 1] }
            ]
        }
    };

    // Convertir nota literal a MIDI
    function notaAMidi(nota) {
        const match = nota.match(/^([A-G])(#|b)?(\d+)$/);
        if (!match) return null;
        
        const [, letra, accidental, octava] = match;
        const semitonos = NOTAS_MIDI[letra + (accidental || '')];
        return (parseInt(octava) + 1) * 12 + semitonos;
    }

    // Calcular distancia entre notas en semitonos
    function distanciaEntreNotas(nota1, nota2) {
        const midi1 = notaAMidi(nota1);
        const midi2 = notaAMidi(nota2);
        return Math.abs(midi2 - midi1);
    }

    // Determinar tipo de acorde basado en número de notas
    function determinarTipoAcorde(numeroNotas) {
        if (numeroNotas === 3) return 'triada';
        if (numeroNotas === 4) return 'septima';
        return 'extendido';
    }

    // Determinar inversión basado en la nota más grave
    function determinarInversion(notas, raiz) {
        const midiRaiz = notaAMidi(raiz);
        const midiBajo = notaAMidi(notas[0]);
        
        // Normalizar a la misma octava para comparar
        const raizNormalizada = midiRaiz % 12;
        const bajoNormalizado = midiBajo % 12;
        
        if (raizNormalizada === bajoNormalizado) return 'posicion_fundamental';
        
        // Buscar qué nota del acorde está en el bajo
        const intervalos = [0, 4, 7, 11, 14, 17]; // 3ra, 5ta, 7ma, 9na, 11ava
        for (let i = 1; i < intervalos.length; i++) {
            if ((raizNormalizada + intervalos[i]) % 12 === bajoNormalizado) {
                const nombresInversion = ['primera_inversion', 'segunda_inversion', 'tercera_inversion', 'cuarta_inversion'];
                return nombresInversion[i - 1] || 'posicion_fundamental';
            }
        }
        
        return 'posicion_fundamental';
    }

    // Verificar si la digitación es ergonómica (distancias razonables)
    function esErgonomica(notas, dedos) {
        for (let i = 0; i < notas.length - 1; i++) {
            const distancia = distanciaEntreNotas(notas[i], notas[i + 1]);
            const diferenciaDedos = Math.abs(dedos[i + 1] - dedos[i]);
            
            // Reglas ergonómicas básicas
            if (distancia > 12 && diferenciaDedos < 2) {
                return false; // Intervalo muy grande con dedos muy cercanos
            }
            if (distancia < 2 && diferenciaDedos > 2) {
                return false; // Intervalo muy pequeño con dedos muy separados
            }
        }
        return true;
    }

    // Generar digitación óptima para una mano
    function generarDigitacionMano(notas, mano, tipoAcorde, inversion) {
        const patron = PATRONES_DIGITACION[tipoAcorde]?.[inversion];
        if (!patron) return null;

        const configMano = patron.find(c => c.mano === mano);
        if (!configMano) return null;

        let dedos = [...configMano.dedos];
        
        // Ajustar si el número de notas no coincide
        if (notas.length !== dedos.length) {
            if (notas.length < dedos.length) {
                // Eliminar dedos del extremo opuesto a la mano
                if (mano === 'derecha') {
                    dedos = dedos.slice(0, notas.length);
                } else {
                    dedos = dedos.slice(dedos.length - notas.length);
                }
            } else {
                // Añadir dedos para notas extra
                while (dedos.length < notas.length) {
                    if (mano === 'derecha') {
                        dedos.push(dedos[dedos.length - 1] + 1);
                    } else {
                        dedos.unshift(dedos[0] - 1);
                    }
                }
            }
        }

        // Verificar ergonomía y ajustar si es necesario
        if (!esErgonomica(notas, dedos)) {
            dedos = ajustarDigitacion(notas, dedos, mano);
        }

        return dedos;
    }

    // Ajustar digitación para mejorar ergonomía
    function ajustarDigitacion(notas, dedos, mano) {
        const nuevosDedos = [...dedos];
        
        for (let i = 0; i < notas.length - 1; i++) {
            const distancia = distanciaEntreNotas(notas[i], notas[i + 1]);
            
            // Ajustar basado en distancia
            if (distancia >= 12) {
                // Intervalo de octava o más
                if (mano === 'derecha') {
                    nuevosDedos[i + 1] = Math.min(5, nuevosDedos[i] + 1);
                } else {
                    nuevosDedos[i] = Math.max(1, nuevosDedos[i + 1] - 1);
                }
            } else if (distancia >= 7) {
                // Intervalo de quinta o más
                if (mano === 'derecha') {
                    nuevosDedos[i + 1] = Math.min(5, nuevosDedos[i] + 1);
                } else {
                    nuevosDedos[i] = Math.max(1, nuevosDedos[i + 1] - 1);
                }
            }
        }
        
        return nuevosDedos;
    }

    // Dividir notas entre manos (grand staff)
    function dividirEntreManos(notas) {
        const SPLIT_MIDI = 60; // C4 (Do central)
        
        const manoIzquierda = notas.filter(n => notaAMidi(n) < SPLIT_MIDI);
        const manoDerecha = notas.filter(n => notaAMidi(n) >= SPLIT_MIDI);
        
        // Si todas las notas están en una mano, dividir equitativamente
        if (manoIzquierda.length === 0 || manoDerecha.length === 0) {
            const mitad = Math.floor(notas.length / 2);
            return {
                izquierda: notas.slice(0, mitad),
                derecha: notas.slice(mitad)
            };
        }
        
        return { izquierda: manoIzquierda, derecha: manoDerecha };
    }

    // Generar digitación completa para un acorde
    function generarDigitacion(acorde) {
        if (!acorde || !acorde.notas || !acorde.notas.length) {
            return null;
        }

        const tipoAcorde = determinarTipoAcorde(acorde.notas.length);
        const inversion = determinarInversion(acorde.notas, acorde.raiz);
        const division = dividirEntreManos(acorde.notas);

        const resultado = {
            tipo: tipoAcorde,
            inversion: inversion,
            manos: {}
        };

        // Generar digitación para cada mano
        if (division.izquierda.length > 0) {
            resultado.manos.izquierda = {
                notas: division.izquierda,
                dedos: generarDigitacionMano(division.izquierda, 'izquierda', tipoAcorde, inversion)
            };
        }

        if (division.derecha.length > 0) {
            resultado.manos.derecha = {
                notas: division.derecha,
                dedos: generarDigitacionMano(division.derecha, 'derecha', tipoAcorde, inversion)
            };
        }

        return resultado;
    }

    // Formatear digitación para visualización
    function formatearDigitacion(digitacion) {
        if (!digitacion) return '';
        
        let resultado = '';
        
        if (digitacion.manos.izquierda) {
            resultado += 'Mano Izquierda:\n';
            digitacion.manos.izquierda.notas.forEach((nota, i) => {
                resultado += `  ${nota}: dedo ${digitacion.manos.izquierda.dedos[i]}\n`;
            });
        }
        
        if (digitacion.manos.derecha) {
            resultado += '\nMano Derecha:\n';
            digitacion.manos.derecha.notas.forEach((nota, i) => {
                resultado += `  ${nota}: dedo ${digitacion.manos.derecha.dedos[i]}\n`;
            });
        }
        
        return resultado;
    }

    // Obtener sugerencia de digitación en formato compacto
    function obtenerSugerenciaCompacta(digitacion) {
        if (!digitacion) return '';
        
        let resultado = '';
        
        if (digitacion.manos.izquierda) {
            const notas = digitacion.manos.izquierda.notas.join('-');
            const dedos = digitacion.manos.izquierda.dedos.join('-');
            resultado += `I: ${notas} (${dedos})`;
        }
        
        if (digitacion.manos.derecha) {
            if (resultado) resultado += ' | ';
            const notas = digitacion.manos.derecha.notas.join('-');
            const dedos = digitacion.manos.derecha.dedos.join('-');
            resultado += `D: ${notas} (${dedos})`;
        }
        
        return resultado;
    }

    return {
        generarDigitacion,
        formatearDigitacion,
        obtenerSugerenciaCompacta,
        notaAMidi,
        distanciaEntreNotas
    };

})();

if (typeof window !== 'undefined') {
    window.DIGITACIONES = DIGITACIONES;
}