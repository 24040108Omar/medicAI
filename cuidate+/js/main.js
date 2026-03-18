/* -------------------------------
   BUSCADOR DE BIENVENIDA
-------------------------------- */

const buscadorInput = document.getElementById("buscador");
const buscadorLabel = document.querySelector('label[for="buscador"]');
const sugerenciasBox = document.getElementById("buscador-sugerencias");

const enfermedadesDisponibles = [
    { nombre: "Migraña", link: "topics/migrana.html" },
    { nombre: "Gastritis", link: "topics/gastritis.html" },
    { nombre: "Hipertiroidismo", link: "topics/hipertiroidismo.html" },
    { nombre: "Asma", link: "topics/asma.html" },
    { nombre: "Anemia", link: "topics/anemia.html" },
    { nombre: "Diabetes", link: "topics/diabetes.html" },
    { nombre: "Apendicitis", link: "topics/apendicitis.html" },
    { nombre: "Gripe", link: "topics/gripe.html" },
    { nombre: "Hipertensión", link: "topics/hipertension.html" },
    { nombre: "Neumonía", link: "topics/neumonia.html" },
    { nombre: "Resfriado", link: "topics/resfriado.html" }
];

function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function mostrarSugerencias(valor) {
    const texto = normalizarTexto(valor);

    if (!texto) {
        sugerenciasBox.innerHTML = "";
        sugerenciasBox.classList.remove("show");
        return;
    }

    const coincidencias = enfermedadesDisponibles.filter(item =>
        normalizarTexto(item.nombre).includes(texto)
    );

    if (coincidencias.length > 0) {
        sugerenciasBox.innerHTML = coincidencias
            .slice(0, 6)
            .map(item => `
                <div class="sugerencia-item" data-link="${item.link}">
                    <strong>${item.nombre}</strong>
                </div>
            `)
            .join("");

        sugerenciasBox.classList.add("show");

        document.querySelectorAll(".sugerencia-item").forEach(item => {
            item.addEventListener("click", () => {
                window.location.href = item.dataset.link;
            });
        });

        return;
    }

    sugerenciasBox.innerHTML = `
        <div class="sugerencia-empty">
            No encontramos una card exacta para "<strong>${valor}</strong>".
            <br>
            <button class="sugerencia-ia-btn" id="preguntar-ia-btn">
                Preguntar a la IA
            </button>
        </div>
    `;

    sugerenciasBox.classList.add("show");

    const iaBtn = document.getElementById("preguntar-ia-btn");
    if (iaBtn) {
        iaBtn.addEventListener("click", () => {
            if (typeof openChatWithMessage === "function") {
                openChatWithMessage(valor);
            }
            sugerenciasBox.classList.remove("show");
            sugerenciasBox.innerHTML = "";
            buscadorInput.value = "";
            buscadorLabel.textContent = "Buscar síntomas, enfermedades o molestias...";
        });
    }
}

if (buscadorInput && buscadorLabel) {
    buscadorInput.addEventListener("focus", () => {
        buscadorLabel.textContent = "En búsqueda";
        if (buscadorInput.value.trim() !== "") {
            mostrarSugerencias(buscadorInput.value);
        }
    });

    buscadorInput.addEventListener("input", () => {
        buscadorLabel.textContent = "En búsqueda";
        mostrarSugerencias(buscadorInput.value);
    });

    buscadorInput.addEventListener("blur", () => {
        setTimeout(() => {
            if (buscadorInput.value.trim() === "") {
                buscadorLabel.textContent = "Buscar síntomas, enfermedades o molestias...";
            }
            sugerenciasBox.classList.remove("show");
        }, 180);
    });
}

/* -------------------------------
   SCROLL DE TARJETAS
-------------------------------- */

const cardsScroll = document.getElementById("cards-scroll");
const scrollLeftBtn = document.getElementById("scroll-left");
const scrollRightBtn = document.getElementById("scroll-right");

if (cardsScroll && scrollLeftBtn && scrollRightBtn) {
    scrollLeftBtn.addEventListener("click", () => {
        cardsScroll.scrollBy({ left: -340, behavior: "smooth" });
    });

    scrollRightBtn.addEventListener("click", () => {
        cardsScroll.scrollBy({ left: 340, behavior: "smooth" });
    });
}

/* -------------------------------
   ANIMACIONES DE ENTRADA
-------------------------------- */

const observeCards = () => {
    const cards = document.querySelectorAll('.card-info, .card-enfermedad');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    cards.forEach(card => observer.observe(card));
};

document.addEventListener('DOMContentLoaded', observeCards);