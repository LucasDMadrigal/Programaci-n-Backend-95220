// Etapa 4 (Semana 2): migramos de http nativo a Express.
//
// Express es un framework que nos da un router, manejo de middlewares y
// helpers para responder (res.json, res.status, etc.), así dejamos de
// comparar req.method / req.url "a mano" como hacíamos con http nativo.

import express from 'express';

// Datos de ejemplo del recurso "services", guardados EN MEMORIA (un
// simple array a nivel de módulo). Esto significa que cualquier cambio
// (crear, editar, borrar) se pierde apenas reiniciamos el servidor: no
// hay nada persistido en disco ni en una base de datos todavía. Eso
// llega en la próxima clase, cuando incorporemos FileSystem.
const services = [
  {
    id: 1,
    name: 'Corte de pelo',
    duration: 30,
    price: 3500,
    category: 'estetica',
    available: true,
  },
  {
    id: 2,
    name: 'Masaje descontracturante',
    duration: 60,
    price: 9000,
    category: 'salud',
    available: true,
  },
];

// Contador auxiliar para generar ids incrementales al crear un servicio
// nuevo. Como services ya trae datos de ejemplo, arrancamos el próximo
// id en base al mayor id existente.
let nextId = services.length + 1;

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
app.get('/api/services', (req, res) => {
  const { category } = req.query;

  const payload = category
    ? services.filter((service) => service.category === category)
    : services;

  res.status(200).json({ status: 'success', payload });
});

// GET /api/services/:sid
// Busca un servicio puntual por id.
app.get('/api/services/:sid', (req, res) => {
  // req.params.sid siempre llega como string (así viajan los segmentos
  // de una URL), así que lo convertimos a Number para poder compararlo
  // con los ids numéricos que guardamos en el array.
  const id = Number(req.params.sid);
  const service = services.find((s) => s.id === id);

  if (!service) {
    // 404 Not Found: el recurso pedido no existe.
    return res
      .status(404)
      .json({ status: 'error', message: 'Servicio no encontrado' });
  }

  // 200 OK: la petición se procesó con éxito y devolvemos el recurso.
  res.status(200).json({ status: 'success', payload: service });
});

// POST /api/services
// Crea un servicio nuevo a partir del body de la petición.
app.post('/api/services', (req, res) => {
  const { name, duration, price, category } = req.body;

  // Validación mínima: si falta algún campo obligatorio, no seguimos.
  if (!name || !duration || !price || !category) {
    // 400 Bad Request: la petición está mal formada (culpa del cliente),
    // a diferencia del 404 que es "no encontré lo que pediste".
    return res
      .status(400)
      .json({ status: 'error', message: 'Faltan campos obligatorios' });
  }

  const newService = {
    id: nextId++,
    name,
    duration,
    price,
    category,
    available: true,
  };

  services.push(newService);

  // 201 Created: la petición creó un recurso nuevo. Por convención REST,
  // devolvemos el recurso recién creado en el payload.
  res.status(201).json({ status: 'success', payload: newService });
});

// PUT /api/services/:sid
// Actualiza (reemplaza campos de) un servicio existente.
app.put('/api/services/:sid', (req, res) => {
  const id = Number(req.params.sid);
  const index = services.findIndex((s) => s.id === id);

  if (index === -1) {
    return res
      .status(404)
      .json({ status: 'error', message: 'Servicio no encontrado' });
  }

  // Mezclamos el servicio existente con lo que vino en el body, pero
  // forzamos id: el id original nunca se pisa con lo que mande el
  // cliente (evita que alguien "cambie" el id de un recurso por error).
  services[index] = { ...services[index], ...req.body, id };

  res.status(200).json({ status: 'success', payload: services[index] });
});

// PATCH /api/services/:sid
// Igual que PUT en esta implementación en memoria (actualización
// parcial): la diferencia semántica es que PATCH se usa típicamente
// para mandar solo los campos que cambian, mientras que PUT sugiere un
// reemplazo más completo del recurso.
app.patch('/api/services/:sid', (req, res) => {
  const id = Number(req.params.sid);
  const index = services.findIndex((s) => s.id === id);

  if (index === -1) {
    return res
      .status(404)
      .json({ status: 'error', message: 'Servicio no encontrado' });
  }

  services[index] = { ...services[index], ...req.body, id };

  res.status(200).json({ status: 'success', payload: services[index] });
});

// DELETE /api/services/:sid
// Elimina un servicio del array en memoria.
app.delete('/api/services/:sid', (req, res) => {
  const id = Number(req.params.sid);
  const index = services.findIndex((s) => s.id === id);

  if (index === -1) {
    return res
      .status(404)
      .json({ status: 'error', message: 'Servicio no encontrado' });
  }

  // splice(index, 1) elimina 1 elemento en esa posición y devuelve un
  // array con lo eliminado; nos quedamos con el primer (y único) item.
  const [deletedService] = services.splice(index, 1);

  res.status(200).json({ status: 'success', payload: deletedService });
});
