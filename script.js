const IVA = 0.19;
const INCREMENTO_INSTALACION = 0.2;
const PRECIO_TABLERO = 100000;
const PRECIO_CANALIZACION_METRO = 12000;
const MANO_OBRA_BASE = 300000;
const INCREMENTO_MANO_OBRA = 50000;
const TRAMO_MANO_OBRA = 5;
const WHATSAPP_NUMBER = "56934848007";

const CARGADORES = [
  {
    id: "abb-7kw",
    nombre: "ABB Cargador de Vehículo Eléctrico 7.4 kW",
    potencia: "7.4 kW",
    precio: 1200000,
    imagen: "img/ABB CARGADOR DE VEHICULO ELECTRICO 7.4 kw.png",
  },
  {
    id: "robot-home",
    nombre: "Cargador Auto Eléctrico ROBOT Home AC Charger",
    potencia: "AC Charger",
    precio: 630000,
    imagen: "img/Cargador auto eléctrico ROBOT Home AC Charger.png",
  },
  {
    id: "huawei-7ks",
    nombre: "Cargador Vehículo Eléctrico Huawei SCharger-7KS-S0",
    potencia: "7 kW",
    precio: 740000,
    imagen: "img/Cargador Vehiculo Electrico Huawei SCharger-7KS-S0.png",
  },
  {
    id: "goodwe-gw7k",
    nombre: "GoodWe GW7K-HCA",
    potencia: "7 kW",
    precio: 580000,
    imagen: "img/GoodWe GW7K-HCA.png",
  },
  {
    id: "livoltek-7-3",
    nombre: "LIVOLTEK Smart EV 7.3 kW",
    potencia: "7.3 kW",
    precio: 630000,
    imagen: "img/LIVOLTEK Smart EV 7.3 kW.png",
  },
  {
    id: "victron",
    nombre: "Victron Estación de Carga Vehículo Eléctrico",
    potencia: "",
    precio: 650000,
    imagen: "img/Victron Estación de Carga Vehículo Electrico 7kW Monofásico 22kW Trifásico.png",
  },
];

const state = {
  selectedProductId: null,
  distance: null,
  step: 1,
};

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    renderCatalog();
    bindEvents();
    showStep(1);
  });
}

function bindEvents() {
  document.querySelector("#catalogo-cargadores").addEventListener("click", (event) => {
    const button = event.target.closest(".select-button");
    if (!button) {
      return;
    }

    const productId = button.dataset.productId;
    handleProductSelection(productId);
  });

  document.querySelector("#btn-continuar-cargador").addEventListener("click", () => {
    if (!state.selectedProductId) {
      setError(
        "#error-cargador",
        "Debes seleccionar un cargador para continuar con la cotización."
      );
      return;
    }

    clearError("#error-cargador");
    showStep(2);
  });

  document.querySelector("#btn-volver-distancia").addEventListener("click", () => {
    showStep(1);
  });

  document.querySelector("#btn-volver-resumen").addEventListener("click", () => {
    showStep(2);
  });

  document.querySelector("#btn-calcular").addEventListener("click", () => {
    const distanciaInput = document.querySelector("#distancia-input");
    const valor = Number(distanciaInput.value);

    if (!Number.isFinite(valor) || valor <= 0) {
      setError("#error-distancia", "Ingresa una distancia mayor a 0 en metros.");
      return;
    }

    clearError("#error-distancia");
    state.distance = valor;
    showStep(3);
    renderSummary();
  });

  document.querySelector("#distancia-input").addEventListener("input", (event) => {
    const rawValue = event.target.value.trim();

    if (rawValue === "") {
      state.distance = null;
      clearError("#error-distancia");
      return;
    }

    const valor = Number(rawValue);
    if (!Number.isFinite(valor) || valor <= 0) {
      state.distance = null;
      setError("#error-distancia", "La distancia debe ser un número mayor a 0.");
      return;
    }

    clearError("#error-distancia");
    state.distance = valor;

    if (state.step === 3 && state.selectedProductId) {
      renderSummary();
    }
  });

  document.querySelector("#btn-pdf").addEventListener("click", generatePDF);
  document.querySelector("#btn-whatsapp").addEventListener("click", (event) => {
    event.preventDefault();
    openWhatsApp();
  });
}

function renderCatalog() {
  const catalog = document.querySelector("#catalogo-cargadores");

  catalog.innerHTML = CARGADORES.map((producto) => {
    const selected = state.selectedProductId === producto.id;

    return `
      <article class="product-card ${selected ? "selected" : ""}">
        ${producto.potencia ? `<span class="product-badge">${producto.potencia}</span>` : ""}
        <div class="product-visual">
          <img src="${producto.imagen}" alt="${producto.nombre}" />
        </div>
        <div>
          <h3>${producto.nombre}</h3>
        </div>
        <div class="product-price">${formatCLP(producto.precio)}</div>
        <div class="product-iva">Precio incluye IVA</div>
        <button class="select-button" type="button" data-product-id="${producto.id}">
          ${selected ? "Seleccionado" : "Seleccionar cargador"}
        </button>
      </article>
    `;
  }).join("");
}

function handleProductSelection(productId) {
  state.selectedProductId = productId;
  renderCatalog();
  clearError("#error-cargador");

  if (state.step === 3 && state.distance) {
    renderSummary();
  }
}

function showStep(step) {
  state.step = step;

  document.querySelectorAll(".step-panel").forEach((panel) => {
    panel.classList.toggle("active", Number(panel.dataset.step) === step);
  });

  document.querySelectorAll(".step-item").forEach((item) => {
    const itemStep = Number(item.dataset.step);
    item.classList.toggle("active", itemStep === step);
    item.classList.toggle("complete", itemStep < step);
  });
}

function calcularManoObra(distancia) {
  const bloquesAdicionales = Math.max(0, Math.ceil((distancia - 5) / TRAMO_MANO_OBRA));
  return MANO_OBRA_BASE + bloquesAdicionales * INCREMENTO_MANO_OBRA;
}

function obtenerTramoManoObra(distancia) {
  const bloque = Math.max(1, Math.ceil(distancia / TRAMO_MANO_OBRA));
  const desde = (bloque - 1) * TRAMO_MANO_OBRA + 1;
  const hasta = bloque * TRAMO_MANO_OBRA;

  return `${desde}–${hasta} metros`;
}

function calcularCotizacion(producto, distancia) {
  const tableroNeto = PRECIO_TABLERO * (1 + INCREMENTO_INSTALACION);
  const canalizacionNeta = distancia * PRECIO_CANALIZACION_METRO * (1 + INCREMENTO_INSTALACION);
  const manoObraNeta = calcularManoObra(distancia);
  const subtotalInstalacionNeto = tableroNeto + canalizacionNeta + manoObraNeta;
  const ivaInstalacion = subtotalInstalacionNeto * IVA;
  const totalInstalacion = subtotalInstalacionNeto + ivaInstalacion;
  const totalCotizacion = producto.precio + totalInstalacion;

  return {
    productoPrecio: producto.precio,
    tableroNeto,
    canalizacionNeta,
    manoObraNeta,
    subtotalInstalacionNeto,
    ivaInstalacion,
    totalInstalacion,
    totalCotizacion,
  };
}

function renderSummary() {
  if (!state.selectedProductId || !state.distance) {
    return;
  }

  const producto = CARGADORES.find((item) => item.id === state.selectedProductId);
  const cotizacion = calcularCotizacion(producto, state.distance);

  document.querySelector("#res-product-name").textContent = producto.nombre;
  document.querySelector("#tag-product").textContent = producto.potencia;
  document.querySelector("#res-cargador").textContent = formatCLP(producto.precio);
  document.querySelector("#res-tablero").textContent = formatCLP(cotizacion.tableroNeto);
  document.querySelector("#res-canalizacion").textContent = formatCLP(cotizacion.canalizacionNeta);
  document.querySelector("#res-manoobra").textContent = formatCLP(cotizacion.manoObraNeta);
  document.querySelector("#res-subtotal").textContent = formatCLP(cotizacion.subtotalInstalacionNeto);
  document.querySelector("#res-iva").textContent = formatCLP(cotizacion.ivaInstalacion);
  document.querySelector("#res-total").textContent = formatCLP(cotizacion.totalCotizacion);

  const detalle = [
    `Cargador: ${producto.nombre}`,
    `Distancia: ${formatDistance(state.distance)} metros`,
    `Tablero eléctrico: 1 unidad`,
    `Canalización: ${formatDistance(state.distance)} metros`,
    `Mano de obra: ${formatDistance(state.distance)} metros`,
  ];

  document.querySelector("#detalle-cotizacion").innerHTML = detalle
    .map((item) => `<li>${item}</li>`)
    .join("");
}

function formatCLP(value) {
  return Number(value).toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

function formatDistance(value) {
  return Number(value).toLocaleString("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function setError(selector, message) {
  const element = document.querySelector(selector);
  if (!element) {
    return;
  }

  element.textContent = message;
}

function clearError(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    return;
  }

  element.textContent = "";
}

function openWhatsApp() {
  if (!state.selectedProductId || !state.distance) {
    setError("#error-distancia", "Completa la selección del cargador y la distancia antes de coordinar la visita.");
    return;
  }

  const producto = CARGADORES.find((item) => item.id === state.selectedProductId);
  const cotizacion = calcularCotizacion(producto, state.distance);

  const mensaje = [
    "Hola Solarflare, quiero coordinar una visita para la instalación de un cargador de vehículo eléctrico.",
    "",
    `Cargador: ${producto.nombre}`,
    `Distancia estimada: ${formatDistance(state.distance)} metros`,
    `Total estimado: ${formatCLP(cotizacion.totalCotizacion)}`,
    "Quisiera coordinar una visita técnica.",
  ].join("\n");

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank", "noopener");
}

function generatePDF() {
  if (!state.selectedProductId || !state.distance) {
    setError("#error-distancia", "Debes completar el cargador y la distancia antes de descargar la cotización.");
    return;
  }

  const producto = CARGADORES.find((item) => item.id === state.selectedProductId);
  const cotizacion = calcularCotizacion(producto, state.distance);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 14;
  const right = pageWidth - 14;
  const contentWidth = right - left;

  doc.setFillColor(0, 107, 161);
  doc.rect(0, 0, pageWidth, 26, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  const logoWidth = 42;
  const logoHeight = 12;
  const logoX = (pageWidth - logoWidth) / 2;
  const logoY = 7;

  try {
    const img = new Image();
    img.src = "img/logo.png";
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 260;
    canvas.height = 80;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    doc.addImage(dataUrl, "PNG", logoX, logoY, logoWidth, logoHeight, undefined, "FAST");
  } catch (error) {
    doc.text("SOLARFLARE", pageWidth / 2, 15, { align: "center" });
  }

  doc.setTextColor(18, 49, 47);
  doc.setFontSize(16);
  doc.text("Cotización instalación cargador vehículo eléctrico", pageWidth / 2, 42, { align: "center" });

  doc.setFontSize(9.5);
  doc.setTextColor(88, 103, 120);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-CL")}`, left, 50);

  doc.setTextColor(18, 49, 47);
  doc.setFontSize(10.5);
  doc.text("Datos empresa", left, 62);
  doc.setFontSize(9.5);
  doc.setTextColor(65, 80, 96);

  const empresaLines = [
    "78.053574-1",
    "Munozav SPA",
    "Antonio Bellet 193 P. F. 1210",
    "+56 9 3484 8007",
    "contacto@solarflare.cl",
  ];

  let y = 68;
  empresaLines.forEach((line) => {
    doc.text(line, left, y);
    y += 5.5;
  });

  y += 4;
  doc.setTextColor(18, 49, 47);
  doc.setFontSize(10.5);
  doc.text("Detalle de cotización", left, y + 8);

  y += 18;
  const detailLines = [
    `Cargador: ${producto.nombre}`,
    `Distancia de instalación: ${formatDistance(state.distance)} metros`,
    `Tablero eléctrico: 1 unidad`,
    `Canalización: ${formatDistance(state.distance)} metros`,
    `Mano de obra: ${formatDistance(state.distance)} metros`,
  ];

  doc.setTextColor(70, 84, 99);
  detailLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, contentWidth - 6);
    wrapped.forEach((part) => {
      doc.text(part, left, y);
      y += 5.5;
    });
  });

  doc.setDrawColor(220, 229, 236);
  doc.line(left, y + 6, right, y + 6);

  const summaryY = y + 16;
  doc.setTextColor(18, 49, 47);
  doc.setFontSize(10.5);
  doc.text("Resumen", left, summaryY);

  const totals = [
    ["Cargador", formatCLP(producto.precio)],
    ["Tablero eléctrico", formatCLP(cotizacion.tableroNeto)],
    ["Canalización + cableado", formatCLP(cotizacion.canalizacionNeta)],
    ["Mano de obra", formatCLP(cotizacion.manoObraNeta)],
    ["Subtotal instalación", formatCLP(cotizacion.subtotalInstalacionNeto)],
    ["IVA instalación", formatCLP(cotizacion.ivaInstalacion)],
    ["TOTAL", formatCLP(cotizacion.totalCotizacion)],
  ];

  let totalY = summaryY + 8;
  doc.setFontSize(9.5);
  totals.forEach(([label, value]) => {
    doc.setTextColor(65, 80, 96);
    doc.text(label, left, totalY);
    doc.setTextColor(18, 49, 47);
    doc.text(value, right, totalY, { align: "right" });
    totalY += 6.5;
  });

  totalY += 8;
  doc.setDrawColor(220, 229, 236);
  doc.line(left, totalY, right, totalY);

  totalY += 10;
  doc.setTextColor(65, 80, 96);
  doc.setFontSize(8.8);
  const aviso1 = "Esta cotización es referencial y está sujeta a confirmación técnica en terreno.";
  const aviso2 = "La distancia ingresada corresponde a una estimación. La instalación definitiva será validada por nuestro equipo técnico.";

  doc.text(doc.splitTextToSize(aviso1, contentWidth), left, totalY);
  totalY += 9;
  doc.text(doc.splitTextToSize(aviso2, contentWidth), left, totalY);

  totalY += 18;
  doc.setTextColor(18, 49, 47);
  doc.setFontSize(9.5);
  doc.text("Contacto Solarflare", left, totalY);
  totalY += 6;
  doc.text("+56 9 3484 8007", left, totalY);
  totalY += 6;
  doc.text("contacto@solarflare.cl", left, totalY);
  totalY += 6;
  doc.text("solarflare.cl", left, totalY);

  doc.save(`cotizacion-solarflare-${producto.id}.pdf`);
}

if (typeof module !== "undefined") {
  module.exports = {
    IVA,
    INCREMENTO_INSTALACION,
    PRECIO_TABLERO,
    PRECIO_CANALIZACION_METRO,
    MANO_OBRA_BASE,
    INCREMENTO_MANO_OBRA,
    TRAMO_MANO_OBRA,
    CARGADORES,
    calcularManoObra,
    calcularCotizacion,
    obtenerTramoManoObra,
  };
}
