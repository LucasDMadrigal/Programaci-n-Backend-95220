// Etapa 4 (Semana 2): server.js ya no usa http nativo. Ahora importamos
// la app de Express (armada en app.js) y la levantamos con app.listen,
// que internamente crea el servidor http por nosotros.
// Recordá: en ESM los imports locales necesitan la extensión ".js".
//
// Etapa 8 (Semana 7): volvemos a crear el servidor HTTP "a mano" con
// node:http, porque Socket.io necesita engancharse al server HTTP CRUDO
// (no a la app de Express). Express sigue atendiendo las peticiones
// HTTP normales (API y vistas) y Socket.io atiende las conexiones
// WebSocket, los dos sobre el MISMO puerto.
import { createServer } from 'node:http';
import { Server } from 'socket.io';

import { app } from './app.js';
import { config } from './config/config.js';
import { connectDB } from './config/database.config.js';
import { ServiceService } from './services/services.service.js';

// Instanciamos el service UNA sola vez a nivel de módulo, y no dentro de
// cada evento: todos los sockets comparten la misma instancia. Los
// sockets, igual que las vistas y la API, pasan por la capa de service
// (validaciones incluidas), nunca van directo a Mongo.
const serviceService = new ServiceService();

// Etapa 7 (Semana 6): antes de levantar el servidor HTTP, nos conectamos
// a MongoDB. startServer() es async porque connectDB() usa await por
// dentro: si la conexión falla, connectDB() corta el proceso y
// el servidor ni siquiera llega a escuchar.
const startServer = async () => {
  await connectDB();

  // createServer(app): un server HTTP que le delega cada petición a
  // Express. Es lo mismo que hacía app.listen por dentro, pero ahora
  // tenemos la referencia al server para dársela a Socket.io.
  const httpServer = createServer(app);

  // io es el servidor de WebSockets, montado sobre el server HTTP.
  // Además, sirve automáticamente el cliente en /socket.io/socket.io.js.
  const io = new Server(httpServer);

  // "connection" se dispara cada vez que un navegador se conecta. El
  // parámetro socket representa a ESE cliente en particular.
  //
  // IMPORTANTE: res.render NO va dentro de un evento de socket. Acá no
  // hay req/res: los sockets mandan DATOS (JSON) y es el cliente
  // (src/public/js/realtime.js) el que actualiza el DOM.
  io.on('connection', async (socket) => {
    console.log(`🟢 Cliente conectado: ${socket.id}`);

    // Apenas se conecta, le mandamos SOLO A ÉL la lista actual.
    socket.emit('servicesUpdated', await serviceService.getServices());

    // El cliente nos pide crear un servicio.
    socket.on('newService', async (data) => {
      try {
        // Misma regla de negocio que POST /api/services: si faltan
        // campos o el precio es negativo, createService lanza AppError.
        await serviceService.createService(data);

        // io.emit -> a TODOS los clientes conectados (incluido el que
        // lo creó). Así todas las pestañas ven el servicio nuevo.
        io.emit('servicesUpdated', await serviceService.getServices());
      } catch (error) {
        // socket.emit -> solo a ESTE cliente: el error es solo suyo.
        socket.emit('errorMessage', error.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔴 Cliente desconectado: ${socket.id}`);
    });
  });

  // Usamos config.port, que ya viene validado (fail-fast) y convertido a
  // Number desde config.js. Levantamos con httpServer.listen y NO con
  // app.listen: app.listen crearía OTRO server HTTP distinto, sin
  // Socket.io enganchado.
  httpServer.listen(config.port, () => {
    console.log(`Servidor escuchando en http://localhost:${config.port} (HTTP + Socket.io)`);
  });
};

startServer();
