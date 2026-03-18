// Coordenadas por defecto (Ramos Arizpe)
const defaultLocation = {
    lat: 25.5407,
    lng: -100.9472,
    label: "Ramos Arizpe, Coahuila"
};


// AQUÍ VA LA API
const TOMTOM_API_KEY = 'FnzkMx0lqYTIHyiEtUuQDyA4MtkmD7RV'; 


let geoMap;
let mainMarker;
let serviceMarkers = [];
let currentLayerType = "hospital";

let currentLat = defaultLocation.lat;
let currentLng = defaultLocation.lng;
let isRadiusRestricted = true; // Empieza buscando solo a 3km

/* FUNCIÓN ESCUDO: Evita que el JS explote si borras algo en el HTML */
function setTextElement(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

/* ICONOS PERSONALIZADOS */
function createEmojiIcon(emoji, extraClass = "") {
    return L.divIcon({
        className: "custom-emoji-marker",
        html: `<div class="emoji-marker ${extraClass}">${emoji}</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -34]
    });
}

const hospitalIcon = createEmojiIcon("🏥", "marker-hospital");
const pharmacyIcon = createEmojiIcon("💊", "marker-pharmacy");
const userLocationIcon = createEmojiIcon("📍", "marker-user");

function initGeoSaludMap() {
    const mapElement = document.getElementById("geo-map");
    if (!mapElement) return;

    geoMap = L.map("geo-map").setView([currentLat, currentLng], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(geoMap);

    mainMarker = L.marker([currentLat, currentLng], {
        icon: userLocationIcon
    }).addTo(geoMap).bindPopup("Ubicación actual").openPopup();

    setFixedLocationInfo();
    bindGeoButtons();
    
    buscarServiciosTomTom(currentLayerType);
}


// BÚSQUEDA CON API DE TOMTOM (3KM o RM/SLT)

async function buscarServiciosTomTom(tipo) {
    serviceMarkers.forEach(marker => geoMap.removeLayer(marker));
    serviceMarkers = [];

    setTextElement("geo-status-text", "Buscando servicios con TomTom...");

    let termino = "";
    if (tipo === "hospital") termino = "hospital clinic";
    else if (tipo === "pharmacy") termino = "farmacia pharmacy";
    else if (tipo === "nearby") termino = "hospital farmacia clinic";

    // Decidimos el radio dependiendo de si el botón está activo o no
    const radio = isRadiusRestricted ? 3000 : 30000; 
    const limite = isRadiusRestricted ? 30 : 200; 

    const url = `https://api.tomtom.com/search/2/poiSearch/${encodeURIComponent(termino)}.json?key=${TOMTOM_API_KEY}&lat=${currentLat}&lon=${currentLng}&radius=${radio}&limit=${limite}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            data.results.forEach(lugar => {
                const categorias = lugar.poi.categories ? lugar.poi.categories.join("").toLowerCase() : "";
                const esFarmacia = categorias.includes("pharmacy") || categorias.includes("farmacia");
                
                const iconToUse = esFarmacia ? pharmacyIcon : hospitalIcon;
                const nombre = lugar.poi.name;
                const direccion = lugar.address.freeformAddress || "Dirección no disponible";

                const marker = L.marker([lugar.position.lat, lugar.position.lon], { icon: iconToUse })
                    .addTo(geoMap)
                    .bindPopup(`<strong>${nombre}</strong><br><small style="color:#666;">${direccion}</small>`);

                serviceMarkers.push(marker);
            });

            setTextElement("geo-status-text", `Se encontraron ${data.results.length} resultados.`);
        } else {
            setTextElement("geo-status-text", "No se encontraron servicios en este radio.");
        }

    } catch (error) {
        console.error("Error al buscar en TomTom:", error);
        setTextElement("geo-status-text", "Error al conectar con el servidor de TomTom.");
    }
}


// EVENTOS Y BOTONES

function bindGeoButtons() {
    const useLocationBtn = document.getElementById("btn-use-location");
    const fixedLocationBtn = document.getElementById("btn-fixed-location");
    const toggleRadiusBtn = document.getElementById("btn-toggle-radius");

    if (useLocationBtn) useLocationBtn.addEventListener("click", useCurrentLocation);
    if (fixedLocationBtn) fixedLocationBtn.addEventListener("click", setFixedLocationInfo);

    // Botón de 3km vs 25km
    if (toggleRadiusBtn) {
        toggleRadiusBtn.addEventListener("click", () => {
            isRadiusRestricted = !isRadiusRestricted;
            
            if (isRadiusRestricted) {
                toggleRadiusBtn.textContent = "📍 Solo a 3km";
                toggleRadiusBtn.style.color = "#56CCF2";
                toggleRadiusBtn.style.borderColor = "#56CCF2";
            } else {
                toggleRadiusBtn.textContent = "🌍 Ramos y Saltillo (25km)";
                toggleRadiusBtn.style.color = "#fff";
                toggleRadiusBtn.style.borderColor = "rgba(255,255,255,0.14)";
            }
            buscarServiciosTomTom(currentLayerType);
        });
    }

    // Botones de filtro (Hospital, farmacia, etc)
    document.querySelectorAll(".geo-filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".geo-filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            currentLayerType = btn.dataset.type;
            buscarServiciosTomTom(currentLayerType); 
        });
    });
}

function useCurrentLocation() {
    const statusDot = document.getElementById("geo-status-dot");
    if (!navigator.geolocation) {
        setTextElement("geo-status-text", "Tu navegador no soporta geolocalización.");
        return;
    }

    setTextElement("geo-status-text", "Obteniendo tu ubicación exacta...");
    if(statusDot) statusDot.classList.remove("active");

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            currentLat = position.coords.latitude;
            currentLng = position.coords.longitude;
            const accuracy = Math.round(position.coords.accuracy);

            // ACTUALIZACIONES SEGURAS DEL HTML
            setTextElement("geo-lat", currentLat.toFixed(6));
            setTextElement("geo-lng", currentLng.toFixed(6));
            setTextElement("geo-coords", `${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`);
            setTextElement("geo-accuracy", `${accuracy} m`);
            setTextElement("geo-source", "GPS / navegador");

            if(statusDot) statusDot.classList.add("active");

            if (geoMap && mainMarker) {
                geoMap.setView([currentLat, currentLng], 14);
                mainMarker.setLatLng([currentLat, currentLng])
                          .bindPopup("Estás aquí")
                          .openPopup();
            }

            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${currentLat}&lon=${currentLng}`);
                const data = await response.json();
                setTextElement("geo-address", data.display_name || "Ubicación detectada");
            } catch (error) {
                setTextElement("geo-address", "Ubicación detectada");
            }

            buscarServiciosTomTom(currentLayerType);
        },
        () => {
            setTextElement("geo-status-text", "No se pudo obtener tu ubicación. Verifica los permisos.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function setFixedLocationInfo() {
    currentLat = defaultLocation.lat;
    currentLng = defaultLocation.lng;

    // ACTUALIZACIONES SEGURAS DEL HTML
    setTextElement("geo-address", defaultLocation.label);
    setTextElement("geo-coords", `${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`);
    setTextElement("geo-lat", currentLat.toFixed(6));
    setTextElement("geo-lng", currentLng.toFixed(6));
    setTextElement("geo-accuracy", "--");
    setTextElement("geo-source", "Ubicación base");
    
    const statusDot = document.getElementById("geo-status-dot");
    if(statusDot) statusDot.classList.remove("active");

    if (geoMap && mainMarker) {
        geoMap.setView([currentLat, currentLng], 14);
        mainMarker.setLatLng([currentLat, currentLng]).bindPopup("Ubicación base").openPopup();
    }

    buscarServiciosTomTom(currentLayerType);
}

document.addEventListener("DOMContentLoaded", () => {
    initGeoSaludMap();
});