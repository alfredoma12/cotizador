const { CARGADORES, calcularCotizacion } = require('./script.js');
const distances = [1, 5, 6, 10, 11, 15, 20, 25];
for (const d of distances) {
  const p = CARGADORES[4];
  const c = calcularCotizacion(p, d);
  const expectedObra = d <= 5 ? 300000 : 300000 + Math.max(0, Math.ceil((d - 5) / 5)) * 50000;
  const expectedTotal = p.precio + (100000 + d * 12000 + expectedObra + (100000 + d * 12000 + expectedObra) * 0.19);
  console.log('dist=' + d + ' obra=' + c.manoObraNeta + ' expected=' + expectedObra + ' subtotal=' + c.subtotalInstalacionNeto + ' iva=' + c.ivaInstalacion + ' total=' + c.totalCotizacion + ' expectedTotal=' + expectedTotal);
}
console.log('cargador_precio=' + CARGADORES[4].precio);
