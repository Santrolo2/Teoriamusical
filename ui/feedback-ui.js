window.FeedbackUI = {
    limpiar(elemento) {
        if (!elemento) return;

        elemento.classList.remove('show', 'correct', 'incorrect', 'hint');
        elemento.innerHTML = '';
    },

    mostrarResultado(elemento, esCorrecto, mensaje) {
        if (!elemento) return;

        elemento.className = `feedback show ${esCorrecto ? 'correct' : 'incorrect'}`;
        elemento.innerHTML = mensaje;
    },

    mostrarPista(elemento, mensaje) {
        if (!elemento) return;

        elemento.className = 'feedback show hint';
        elemento.innerHTML = mensaje;
    },

    mostrarError(elemento, mensaje) {
        if (!elemento) return;

        elemento.className = 'feedback show incorrect';
        elemento.innerHTML = mensaje;
    }
};