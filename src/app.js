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
