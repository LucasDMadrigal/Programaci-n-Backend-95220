// Etapa 4 (Semana 2): migramos de http nativo a Express.
//
// Express es un framework que nos da un router, manejo de middlewares y
// helpers para responder (res.json, res.status, etc.), así dejamos de
// comparar req.method / req.url "a mano" como hacíamos con http nativo.

import express from 'express';
import { ServiceManager } from './managers/ServiceManager.js';

// Etapa 5 (Semana 3): reemplazamos el array en memoria por persistencia
// real en un archivo JSON (src/data/services.json). Todo el manejo del
// archivo (leer, parsear, escribir) queda encapsulado dentro de
// ServiceManager: las rutas de acá abajo ya no tocan el FileSystem
// directamente, solo le piden datos al manager y responden según lo
// que reciben.
const serviceManager = new ServiceManager();

// app es la aplicación de Express. La exportamos para que server.js la
// use al levantar el servidor con app.listen(...).
export const app = express();

// express.json() es un middleware que parsea el body de las peticiones
// entrantes cuando vienen con Content-Type: application/json, y lo deja
// disponible como objeto JS en req.body. IMPORTANTE: sin este middleware,
// en un POST o PUT req.body llega undefined, aunque el cliente sí haya
// mandado JSON.
//
// El orden de app.use() importa: los middlewares se ejecutan en el
// orden en que se registran, y las rutas de más abajo solo ven el
// resultado de los middlewares que se registraron antes. Por eso
// express.json() va primero: así req.body ya está listo para cuando
// llegue a cualquier ruta.
app.use(express.json());

// Middleware logger casero: se ejecuta en TODAS las peticiones (no tiene
// método ni path, así que Express lo aplica siempre) y solo imprime en
// consola el método y la URL pedidos.
//
// Un middleware recibe (req, res, next). Es OBLIGATORIO llamar a next()
// cuando termina su trabajo: eso le dice a Express "seguí con el próximo
// middleware o ruta". Si no lo llamamos, la petición queda colgada para
// siempre (el cliente nunca recibe respuesta).
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.status(200).json({
    mensaje: 'Backend de Turnos y Reservas',
    status: 'activo',
  });
});

app.get('/health', (req, res) => {
  // process.uptime() devuelve, en segundos, cuánto tiempo lleva
  // corriendo el proceso de Node. Es un chequeo típico para saber
  // si el servidor sigue "vivo".
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
  });
});

// ---------------------------------------------------------------------
// CRUD de /api/services
//
// Convención de respuestas de toda la API:
//   éxito -> { status: 'success', payload }
//   error -> { status: 'error', message }
// ---------------------------------------------------------------------

// GET /api/services
// Lista todos los servicios. Acepta un filtro opcional por query string:
// /api/services?category=salud
//
// req.query contiene los parámetros que van después del "?" en la URL
// (acá, category). Es distinto de req.params, que contiene los valores
// capturados de la propia ruta (por ejemplo, :sid más abajo).
//
// Las rutas ahora son async porque leer el archivo (fs/promises) es una
// operación asincrónica: usamos await para esperar el resultado del
// ServiceManager antes de responder.
app.get('/api/services', async (req, res) => {
  const { category } = req.query;

  const allServices = await serviceManager.getServices();

  const payload = category
    ? allServices.filter((service) => service.category === category)
    : allServices;

  res.status(200).json({ status: 'success', payload });
});

// GET /api/services/:sid
// Busca un servicio puntual por id.
app.get('/api/services/:sid', async (req, res) => {
  const service = await serviceManager.getServiceById(req.params.sid);

  if (!service) {
    // 404 Not Found: el recurso pedido no existe. Esta decisión (qué
    // código HTTP corresponde a un null) queda en la ruta, no en el
    // manager: el manager solo dice "no está" devolviendo null.
    return res
      .status(404)
      .json({ status: 'error', message: 'Servicio no encontrado' });
  }

  // 200 OK: la petición se procesó con éxito y devolvemos el recurso.
  res.status(200).json({ status: 'success', payload: service });
});

// POST /api/services
// Crea un servicio nuevo a partir del body de la petición.
app.post('/api/services', async (req, res) => {
  const { name, duration, price, category } = req.body;

  // Validación mínima: si falta algún campo obligatorio, no seguimos.
  // Esto se queda acá, en la ruta: el ServiceManager no valida nada, solo
  // persiste lo que le llega.
  if (!name || !duration || !price || !category) {
    // 400 Bad Request: la petición está mal formada (culpa del cliente),
    // a diferencia del 404 que es "no encontré lo que pediste".
    return res
      .status(400)
      .json({ status: 'error', message: 'Faltan campos obligatorios' });
  }

  const newService = await serviceManager.addService(req.body);

  // 201 Created: la petición creó un recurso nuevo. Por convención REST,
  // devolvemos el recurso recién creado en el payload.
  res.status(201).json({ status: 'success', payload: newService });
});

// PUT /api/services/:sid
// Actualiza (reemplaza campos de) un servicio existente.
app.put('/api/services/:sid', async (req, res) => {
  const updatedService = await serviceManager.updateService(req.params.sid, req.body);

  if (!updatedService) {
    return res
      .status(404)
      .json({ status: 'error', message: 'Servicio no encontrado' });
  }

  res.status(200).json({ status: 'success', payload: updatedService });
});

// PATCH /api/services/:sid
// Igual que PUT en esta implementación (actualización parcial): la
// diferencia semántica es que PATCH se usa típicamente para mandar solo
// los campos que cambian, mientras que PUT sugiere un reemplazo más
// completo del recurso.
app.patch('/api/services/:sid', async (req, res) => {
  const updatedService = await serviceManager.updateService(req.params.sid, req.body);

  if (!updatedService) {
    return res
      .status(404)
      .json({ status: 'error', message: 'Servicio no encontrado' });
  }

  res.status(200).json({ status: 'success', payload: updatedService });
});

// DELETE /api/services/:sid
// Elimina un servicio del archivo de datos.
app.delete('/api/services/:sid', async (req, res) => {
  const deletedService = await serviceManager.deleteService(req.params.sid);

  if (!deletedService) {
    return res
      .status(404)
      .json({ status: 'error', message: 'Servicio no encontrado' });
  }

  res.status(200).json({ status: 'success', payload: deletedService });
});
