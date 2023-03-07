import Feature from "ol/Feature.js";
import "./style.css";
import { Map, View } from "ol";
import { XYZ } from "ol/source";
import Point from "ol/geom/Point.js";
import { fromLonLat } from "ol/proj";
import Geolocation from "ol/Geolocation.js";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style.js";
import { OSM, Vector as VectorSource } from "ol/source.js";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer.js";
import { getVectorContext } from "ol/render.js";
import { easeOut } from "ol/easing.js";
import { unByKey } from "ol/Observable.js";
import JSAlert from "js-alert";

/* ===== Map ======== */

const source = new VectorSource({
  wrapX: false,
});

const vector = new VectorLayer({
  source: source,
});

const tileLayer = new TileLayer({
  source: new XYZ({
    url: "https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}",
  }),
});

const view = new View({
  center: fromLonLat([-101.67374, 21.12908]),
  zoom: 12.7,
});

const map = new Map({
  target: "map",
  view: view,
  layers: [tileLayer, vector],
});

/* ===== My Location ====== */
const geolocation = new Geolocation({
  // enableHighAccuracy must be set to true to have the heading value.
  trackingOptions: {
    enableHighAccuracy: true,
  },
  projection: view.getProjection(),
});

function el(id) {
  return document.getElementById(id);
}

geolocation.on("change", function () {
  const currentPosition = geolocation.getPosition();
  const lat = currentPosition[0];
  const lon = currentPosition[1];
  el("lat").innerText = lat + ", ";
  el("lon").innerText = lon;
});

// handle geolocation error.
geolocation.on("error", function (error) {
  console.log(error.message);
});

const accuracyFeature = new Feature();
geolocation.on("change:accuracyGeometry", function () {
  accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
});

const positionFeature = new Feature();

positionFeature.setStyle(
  new Style({
    image: new CircleStyle({
      radius: 12,
      fill: new Fill({
        color: "#FFFFFF",
      }),
      stroke: new Stroke({
        color: "#7E56DA",
        width: 6,
      }),
    }),
  })
);

geolocation.on("change:position", function () {
  const coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
});

/* Con esto se muestra el vector en pantalla */
new VectorLayer({
  map: map,
  source: new VectorSource({
    features: [accuracyFeature, positionFeature],
  }),
});

/* ===== New Location ====== */

function addFixedFeature(lat, lon) {
  const x = lon;
  const y = lat;
  const geom = new Point(fromLonLat([x, y]));
  const feature = new Feature(geom);
  source.addFeature(feature);
}

const duration = 3000;
function flash(feature) {
  const start = Date.now();
  const flashGeom = feature.getGeometry().clone();

  const listenerKey = tileLayer.on("postrender", animate);

  function animate(event) {
    const frameState = event.frameState;
    const elapsed = frameState.time - start;
    if (elapsed >= duration) {
      unByKey(listenerKey);
      return;
    }
    const vectorContext = getVectorContext(event);
    const elapsedRatio = elapsed / duration;
    // radius will be 5 at start and 30 at end.
    const radius = easeOut(elapsedRatio) * 25 + 5;
    const opacity = easeOut(1 - elapsedRatio);

    const style = new Style({
      image: new CircleStyle({
        radius: radius,
        stroke: new Stroke({
          color: "rgba(0, 136, 22, " + opacity + ")",
          width: 0.25 + opacity,
        }),
        fill: new Fill({
          color: "rgba(152, 217, 162, " + 0.15 + ")",
        }),
      }),
    });

    vectorContext.setStyle(style);
    vectorContext.drawGeometry(flashGeom);
    // tell OpenLayers to continue postrender animation
    map.render();
  }
}

/* Añade las ondas de la función flash */
source.on("addfeature", function (e) {
  flash(e.feature);
});

let intervalId = null;

el("mapForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const latitud = Number(el("formLat").value);
  const longitud = Number(el("formLon").value);
  const nombre = el("name").value;
  if (!isNaN(latitud) && !isNaN(longitud)) {
    if (
      latitud > 21.069 &&
      latitud < 21.19678 &&
      longitud > -101.74913 &&
      longitud < -101.5762
    ) {
      displayMap()
      geolocation.setTracking(this.click);
      el("nombre").innerText = nombre;
      clearSource(intervalId); // Borrar las features existentes
      addFixedFeature(latitud, longitud); // Añadir la primera feature
      intervalId = setInterval(function () {
        addFixedFeature(latitud, longitud); // Añadir una nueva feature cada  segundos
      }, 3000);
    }
    else {
      JSAlert.alert(
        "Ingresa un rango de coordendas válido para León Gto.",
        "Datos incorrectos",
        JSAlert.Icons.Warning,
        "Cerrar"
      );
    }
  } else {
    JSAlert.alert(
      "Los datos de que ingresaste no son válidos.",
      "Datos inválidos",
      JSAlert.Icons.Warning,
      "Cerrar"
    );
  }
});

function clearSource(intervalId) {
  clearInterval(intervalId);
  source.clear();
}


/* ===== Display Map ======== */
function displayMap(){
  el('no-data').style.display = "none"
}