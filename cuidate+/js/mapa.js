let map;
let userLat;
let userLon;

let markers = [];


navigator.geolocation.getCurrentPosition(function(position){

userLat = position.coords.latitude;
userLon = position.coords.longitude;

map = L.map('map').setView([userLat,userLon],13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
maxZoom:19
}).addTo(map);

L.marker([userLat,userLon])
.addTo(map)
.bindPopup("Tu ubicación")
.openPopup();

});

function limpiarMarcadores(){

markers.forEach(marker=>{
map.removeLayer(marker);
});

markers=[];

}

async function buscarHospitales(){

limpiarMarcadores();

let query = `
[out:json];
(
node["amenity"="hospital"](around:3000,${userLat},${userLon});
node["amenity"="clinic"](around:3000,${userLat},${userLon});
);
out;
`;

buscar(query);

}

async function buscarFarmacias(){

limpiarMarcadores();

let query = `
[out:json];
(
node["amenity"="pharmacy"](around:3000,${userLat},${userLon});
);
out;
`;

buscar(query);

}

async function buscarTodo(){

limpiarMarcadores();

let query = `
[out:json];
(
node["amenity"="hospital"](around:3000,${userLat},${userLon});
node["amenity"="clinic"](around:3000,${userLat},${userLon});
node["amenity"="pharmacy"](around:3000,${userLat},${userLon});
);
out;
`;

buscar(query);

}

async function buscar(query){

let url = "https://overpass-api.de/api/interpreter";

let response = await fetch(url,{
method:"POST",
body:query
});

let data = await response.json();

data.elements.forEach(lugar=>{

let marker = L.marker([lugar.lat,lugar.lon])
.addTo(map)
.bindPopup(lugar.tags.name || "Centro médico");

markers.push(marker);

});

}