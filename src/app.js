// Etapa 2: separamos la lógica de "qué responder" (app.js) de la lógica
// de "levantar el servidor" (server.js). Esto es un primer paso hacia
// una arquitectura más ordenada, aunque el proyecto sea chico.
//
// Este archivo exporta una función handler(req, res) que sabe rutear
// "a mano" las peticiones según el método HTTP y la URL. No usamos
// Express ni ningún router externo: comparamos strings nosotros mismos.

// Datos de ejemplo. Más adelante, en una clase futura, esto podría venir
// de una base de datos (por eso el proyecto ya tiene carpetas para
// repositories, dao, models, etc., aunque hoy estén vacías).
const servicios = [
  { id: 1, nombre: 'Corte de pelo', duracionMin: 30 },
  { id: 2, nombre: 'Manicura', duracionMin: 45 },
  { id: 3, nombre: 'Masaje descontracturante', duracionMin: 60 },
];

// Función auxiliar para no repetir el mismo código en cada ruta:
// arma la respuesta con el status, el header JSON y el body ya serializado.
function responderJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// handler(req, res) es la función que server.js le va a pasar a
// http.createServer. Acá vive todo el ruteo manual: miramos req.method
// (GET, POST, etc.) y req.url (la ruta pedida) para decidir qué contestar.
export function handler(req, res) {
  const { method, url } = req;

  if (method === 'GET' && url === '/') {
    return responderJSON(res, 200, {
      mensaje: 'Backend de Turnos y Reservas',
      status: 'activo',
    });
  }

  if (method === 'GET' && url === '/api/servicios') {
    return responderJSON(res, 200, servicios);
  }

  if (method === 'GET' && url === '/health') {
    // process.uptime() devuelve, en segundos, cuánto tiempo lleva
    // corriendo el proceso de Node. Es un chequeo típico para saber
    // si el servidor sigue "vivo".
    return responderJSON(res, 200, {
      status: 'ok',
      uptime: process.uptime(),
    });
  }

  // Si ninguna ruta anterior matcheó, respondemos 404.
  return responderJSON(res, 404, { error: 'Ruta no encontrada' });
}
