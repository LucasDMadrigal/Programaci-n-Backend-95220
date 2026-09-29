// Etapa 4 (Semana 2): migramos de http nativo a Express.
//
// Express es un framework que nos da un router, manejo de middlewares y
// helpers para responder (res.json, res.status, etc.), así dejamos de
// comparar req.method / req.url "a mano" como hacíamos con http nativo.
//
// Etapa 6 (Semana 4): MODULARIZAMOS la API. Antes app.js tenía TODAS las
// rutas de /api/services apiladas acá. Ahora app.js solo hace lo que le
// corresponde: configurar Express (middlewares), exponer un par de
// endpoints de estado y MONTAR los routers de cada recurso. La lógica de
// cada recurso vive en su propia carpeta (routes/ + controllers/ +
// managers/).

import express from 'express';

// Etapa 8 (Semana 7): motor de plantillas Handlebars para renderizar
// vistas HTML desde el servidor (Server Side Rendering).
import { engine } from 'express-handlebars';

// Cada recurso trae su propio router (un "mini-app" de Express con sus
// rutas ya configuradas). app.js solo decide bajo qué prefijo se monta.
import servicesRouter from './routes/services.router.js';
import bookingsRouter from './routes/bookings.router.js';
// Router de VISTAS: devuelve HTML renderizado (no JSON).
import viewsRouter from './routes/views.router.js';

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

// express.urlencoded() parsea los bodies que llegan desde un <form> HTML
// clásico (Content-Type: application/x-www-form-urlencoded). extended:
// true permite objetos anidados en los campos del formulario.
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------
// Configuración del motor de vistas (Semana 7)
//
// app.engine registra Handlebars como motor para los archivos con
// extensión ".handlebars".
//
// runtimeOptions: por seguridad, Handlebars NO deja leer propiedades que
// vienen del "prototipo" de un objeto. Los documentos de Mongoose no son
// objetos planos: sus campos (name, price, etc.) se exponen como
// getters del prototipo. Sin estas dos opciones, en la vista veríamos
// todos los campos vacíos. (Alternativa: devolver objetos planos con
// .lean() en el DAO, pero preferimos no tocar la capa de persistencia.)
// ---------------------------------------------------------------------
app.engine(
  'handlebars',
  engine({
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
  })
);

// Qué motor usar por defecto en res.render(...) y dónde buscar las
// vistas. Las rutas son relativas a donde se ejecuta "npm run dev"
// (la raíz del proyecto).
app.set('view engine', 'handlebars');
app.set('views', './src/views');

// Archivos estáticos: todo lo que esté en src/public se sirve tal cual.
// Por ejemplo, src/public/js/realtime.js queda disponible en
// http://localhost:8080/js/realtime.js
app.use(express.static('./src/public'));

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

// Endpoints de estado del servidor (no son un recurso de la API, por eso
// se quedan acá y no en un router).
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
// Montaje de los routers de recursos.
//
// app.use(prefijo, router) le dice a Express: "toda petición cuya URL
// empiece con este prefijo, pasásela a este router". El prefijo se
// define UNA sola vez acá; dentro de cada router las rutas se escriben
// relativas (por ejemplo router.get('/') es GET /api/services).
// ---------------------------------------------------------------------
app.use('/api/services', servicesRouter);
app.use('/api/bookings', bookingsRouter); // TODO: agregar usuarios

// Las vistas se montan en la raíz: /services, /services/:sid, etc. No
// chocan con la API porque la API vive bajo el prefijo /api.
app.use('/', viewsRouter);
// TODO: rutas y capa de usuarios
