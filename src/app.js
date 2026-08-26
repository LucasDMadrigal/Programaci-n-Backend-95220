// Etapa 4 (Semana 2): migramos de http nativo a Express.
//
// Express es un framework que nos da un router, manejo de middlewares y
// helpers para responder (res.json, res.status, etc.), así dejamos de
// comparar req.method / req.url "a mano" como hacíamos con http nativo.

import express from 'express';

// Datos de ejemplo. Más adelante, en una clase futura, esto podría venir
// de una base de datos (por eso el proyecto ya tiene carpetas para
// repositories, dao, models, etc., aunque hoy estén vacías).
const servicios = [
  { id: 1, nombre: 'Corte de pelo', duracionMin: 30 },
  { id: 2, nombre: 'Manicura', duracionMin: 45 },
  { id: 3, nombre: 'Masaje descontracturante', duracionMin: 60 },
];

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

app.get('/api/servicios', (req, res) => {
  res.status(200).json(servicios);
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
