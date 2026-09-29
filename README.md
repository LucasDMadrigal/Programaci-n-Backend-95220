# backend-turnos-reservas

## Qué hace la app

`backend-turnos-reservas` es el backend de un Sistema de Turnos y
Reservas sobre **MongoDB**. En la Semana 8 suma **consultas avanzadas**
(`GET /api/services` con filtros por categoría y disponibilidad,
**paginación** con `mongoose-paginate-v2` y **orden por precio**),
**validación de entrada con Zod** mediante un middleware que corta con
`400` antes de tocar la base, y **relaciones con `populate`**: las
reservas devuelven los datos completos de cada servicio en vez de su
`ObjectId`. Mantiene lo de la Semana 7: **vistas Handlebars** y **tiempo
real con Socket.io** (`/realtime-services`), que siguen usando la lista
completa de servicios.

La API está construida con **Express** y organizada en **capas**, cada una
con una única responsabilidad: `route → controller → service →
repository → DAO → base de datos`. Expone dos recursos: `services`
(servicios ofrecidos, con **CRUD completo**) y `bookings` (reservas, que
se relacionan con servicios guardando **solo la referencia** al
`_id`), con persistencia en **MongoDB Atlas** vía **Mongoose**. Los DAOs
de FileSystem de la etapa anterior se conservan en el repo como
alternativa: gracias a la capa de repository, intercambiar la
persistencia es cuestión de qué DAO se instancia por defecto, no de
reescribir services/controllers/routes. La configuración (puerto, URL
de base de datos) se carga desde variables de entorno con `dotenv` y se
valida con el patrón **fail-fast**: si falta algo, la app avisa por
consola y no arranca.

## Requisitos

- Node.js **24** (mínimo **20**, por el soporte de `--watch` y ESM estable).
- git.
- `MONGO_URI` configurado en el `.env`: una cuenta de **MongoDB Atlas** (o un `MONGO_URI` ya provisto por tu profesor/equipo).

## Setup de MongoDB Atlas

1. Creá una cuenta en [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) y un cluster **M0 (gratuito)**.
2. En **Database Access**, creá un usuario de base de datos con contraseña.
3. En **Network Access**, agregá la IP `0.0.0.0/0` (permite conexión desde cualquier IP; sirve para desarrollo, no para producción).
4. En **Database → Connect → Drivers**, copiá el connection string (formato `mongodb+srv://...`).
5. Reemplazá `<password>` por la contraseña real del usuario, y agregá el nombre de la base al final de la URL: `/booking_system`.
6. Pegá ese string completo en la variable `MONGO_URI` de tu `.env` (nunca en `.env.example`, y nunca lo commitees).

## Instalación paso a paso

```bash
npm install             # express, dotenv, mongoose, mongoose-paginate-v2, zod,
                        # express-handlebars y socket.io
cp .env.example .env    # completar PORT=8080 y pegar tu MONGO_URI (ver Atlas arriba)
npm run dev
```

Si la conexión es correcta, vas a ver en consola:

```
✅ Conexión a MongoDB establecida correctamente
Servidor escuchando en http://localhost:8080 (HTTP + Socket.io)
```

> El cliente de Socket.io **no se instala** con npm: lo sirve el propio
> servidor en `/socket.io/socket.io.js`.

También podés levantarlo sin reinicio automático con:

```bash
npm start
```

## Estructura del proyecto

```
src/
  app.js                        # Config: express.json/urlencoded, Handlebars, static, logger, monta routers
  server.js                     # startServer(): connectDB, server HTTP + Socket.io, httpServer.listen
  config/
    config.js                   # Carga y valida variables de entorno (dotenv + fail-fast)
    database.config.js          # connectDB(): mongoose.connect(config.mongoUri)
  views/
    layouts/
      main.handlebars           # Esqueleto HTML compartido ({{{body}}})
    services.handlebars         # Listado de servicios
    service-detail.handlebars   # Detalle de un servicio
    booking-detail.handlebars   # Detalle de una reserva
    realtime-services.handlebars # Form + lista actualizada por WebSocket
  public/
    js/
      realtime.js               # Cliente de Socket.io (corre en el navegador)
  routes/
    services.router.js          # express.Router(): endpoints de /api/services -> controller
                                 #   (POST valida el body con validateBody(serviceSchema))
    bookings.router.js          # express.Router(): endpoints de /api/bookings -> controller
                                 #   (POST valida con validateBody(bookingSchema) + /report/status)
    views.router.js             # Vistas HTML (res.render) -> usa ServiceService/BookingService
  middlewares/
    validate.middleware.js      # validateBody(schema): safeParse de Zod -> 400 con errors o next()
  validations/
    service.validation.js       # Schema de Zod para crear un servicio
    booking.validation.js       # Schema de Zod para crear una reserva
  controllers/
    services.controller.js      # Solo HTTP: lee req, llama al service, mapea error.statusCode
    bookings.controller.js      # Solo HTTP: lee req, llama al service, mapea error.statusCode
  services/
    services.service.js         # Reglas de negocio de services; getServicesPaginated arma
                                 #   filtro/orden/paginación a partir de req.query
    bookings.service.js         # Reglas de negocio de bookings: valida el servicio (compone
                                 #   ServiceRepository) y aplica la regla de quantity
  repositories/
    services.repository.js      # Puente hacia el DAO de services; hoy instancia ServiceMongoDao
    bookings.repository.js      # Puente hacia el DAO de bookings; hoy instancia BookingMongoDao
  dao/
    models/
      service.model.js          # Schema + model de "services" (con plugin mongoose-paginate-v2)
      booking.model.js          # Schema + model de Mongoose para "bookings" (con hook pre('save'))
      message.model.js          # Schema + model de Mongoose para "messages" (preparado a futuro)
    mongo/
      services.mongo.dao.js     # Persistencia pura de services (getAll + getPaginated)
      bookings.mongo.dao.js     # Persistencia pura de bookings (getById con populate,
                                 #   countByStatus con aggregate)
    fileSystem/
      services.fs.dao.js        # Persistencia pura de services en FileSystem (fs/promises)
      bookings.fs.dao.js        # Persistencia pura de bookings en FileSystem (fs/promises)
  utils/
    AppError.js                 # Error de dominio con statusCode, para que el service lo lance
                                 #   y el controller lo mapee a la respuesta HTTP
  data/
    services.json               # Datos de ejemplo de la etapa FileSystem (ya no se usan en runtime)
    bookings.json                # Datos de ejemplo de la etapa FileSystem (ya no se usan en runtime)
```

## Flujo de una petición y capas

```
Cliente -> Ruta -> Controller -> Service -> Repository -> DAO -> MongoDB
```

| Capa | Responsabilidad |
|---|---|
| **route** | Conecta un endpoint (método + path) con una función del controller. |
| **controller** | SOLO HTTP: lee `req`, llama al service y traduce el resultado (o el `AppError` capturado) a status + cuerpo JSON. No conoce repositories ni DAOs. |
| **service** | Reglas de **negocio**: qué es válido, cómo se combinan los datos. Lanza `AppError(mensaje, statusCode)` cuando algo falla. No conoce `req`/`res` ni instancia un DAO directamente: solo conoce a su **repository**. |
| **repository** | Puente hacia el DAO, con **inyección de dependencias** (recibe el DAO por constructor, con un valor por defecto). No aplica reglas de negocio, solo delega. |
| **dao** | Persistencia **pura**: hoy habla con MongoDB a través de un model de Mongoose (`ServiceModel`/`BookingModel`). Devuelve datos o `null`. |

Cada capa devuelve su resultado a la que la llamó, hasta llegar de nuevo
al controller.

> **Cómo se hizo la migración a MongoDB.** Se agregaron `services.mongo.dao.js`
> / `bookings.mongo.dao.js` (misma interfaz que sus versiones de
> FileSystem: `getAll/getById/create/update[/delete]`) y se cambió, en el
> constructor de cada repository, qué DAO se instancia por defecto. Los
> controllers, las rutas y `services.service.js` **no cambiaron**;
> `bookings.service.js` solo se ajustó por el cambio de tipo de id
> (de `number` a `ObjectId`).

## Por qué la reserva guarda solo el `_id` del servicio

En `booking.services` **no** se guarda el objeto completo del servicio,
solo su referencia: `{ service: <ObjectId>, quantity: <n> }`. Motivos:

- **Sin duplicación**: el nombre, precio y duración del servicio viven
  en un único lugar (la colección `services`). Si mañana cambia el
  precio, no quedan copias viejas desperdigadas dentro de cada reserva.
- **Sin inconsistencias**: una sola fuente de verdad. Para mostrar el
  detalle, se "resuelve" la referencia con `.populate()` (ver abajo).

Esta regla (validar el servicio + decidir entre incrementar `quantity`
o agregar `{ service, quantity: 1 }`) vive en `bookings.service.js`. El
`BookingMongoDao` solo persiste la lista ya resuelta.

Cuando se agrega un servicio que **ya estaba** en la reserva, se
incrementa su `quantity` en vez de hacer un segundo `push`: así la lista
tiene una entrada por servicio más un contador, más simple de leer y de
mostrar que varias entradas repetidas del mismo `id`.

## Convención de respuestas

```
éxito -> { status: 'success', payload: <dato> }
error -> { status: 'error',   message: <texto> }
```

## Consultas avanzadas, validación y populate (Semana 8)

### `GET /api/services`: filtros, paginación y orden

Parámetros opcionales de la query string:

| Parámetro | Ejemplo | Efecto |
|---|---|---|
| `category` | `salud` | Solo servicios de esa categoría |
| `available` | `true` / `false` | Solo disponibles / no disponibles |
| `page` | `2` | Número de página (default `1`) |
| `limit` | `5` | Servicios por página (default `10`) |
| `sort` | `asc` / `desc` | Orden por precio ascendente / descendente |

> ⚠️ **El shape de la respuesta cambió.** Hasta la Semana 7, `payload`
> era el array completo. Ahora `payload` es el array **de la página
> pedida**, y alrededor viene la metadata de paginación:
>
> ```json
> {
>   "status": "success",
>   "payload": [ { "_id": "...", "name": "...", "price": 9000 } ],
>   "totalPages": 2, "page": 1,
>   "hasPrevPage": false, "hasNextPage": true,
>   "prevPage": null, "nextPage": 2,
>   "prevLink": null, "nextLink": "/api/services?page=2&limit=2"
> }
> ```
>
> Las vistas (`/services`) y los sockets (`/realtime-services`) **no
> cambian**: siguen usando `getServices()`, con la lista completa.

### Validación con Zod

`POST /api/services` y `POST /api/bookings` pasan primero por el
middleware `validateBody(schema)`. Si el body no cumple el schema de
Zod, se responde `400` **sin llegar al controller ni a la base**:

```json
{
  "status": "error",
  "message": "Datos inválidos",
  "errors": ["price: Invalid input: expected number, received string"]
}
```

Zod **no convierte tipos**: `"price": "8000"` (string) es inválido;
tiene que ser `8000` (número). Los services quedan solo con las reglas
de negocio (por ejemplo, precio no negativo).

### Populate

En la base, cada reserva sigue guardando solo `{ service: <ObjectId>,
quantity }`. Al leerla, el DAO hace `.populate('services.service')` y
Mongoose reemplaza cada `ObjectId` por el documento completo del
servicio (algo parecido a un `JOIN` de SQL).

## Cómo probar la API con Postman

Cada recurso trae un `_id` de MongoDB (un `ObjectId`). Con el servidor
corriendo (por defecto en `http://localhost:8080`, salvo que hayas
cambiado `PORT` en tu `.env`):

**Novedades de la Semana 8**

| Método | URL | Body (raw JSON) | Respuesta esperada |
|---|---|---|---|
| GET | `http://localhost:8080/api/services?category=salud&page=1&limit=2&sort=desc` | — | `200` · `payload` con hasta 2 servicios de `salud`, del más caro al más barato, + metadata de paginación |
| GET | `http://localhost:8080/api/services` | — | `200` · listado paginado por defecto (`page=1`, `limit=10`) |
| GET | `http://localhost:8080/api/services?available=true&sort=asc` | — | `200` · solo disponibles, del más barato al más caro |
| POST | `http://localhost:8080/api/services` | `{ "name": "" }` | `400` · `Datos inválidos` + `errors` (name, duration, price, category) |
| POST | `http://localhost:8080/api/services` | `{ "name":"Masajes","duration":60,"price":"8000","category":"estetica" }` | `400` · `errors: ["price: ... expected number, received string"]` |
| POST | `http://localhost:8080/api/services` | `{ "name":"Masajes","duration":60,"price":8000,"category":"estetica" }` | `201` · servicio creado con `_id` |
| POST | `http://localhost:8080/api/bookings` | `{ "clientName":"Ana","clientEmail":"no-es-email" }` | `400` · `errors: ["clientEmail: El email no es válido"]` |
| GET | `http://localhost:8080/api/bookings/<bid>` | — | `200` · reserva con `services: [{ service: { _id, name, duration, price, ... }, quantity }]` (objeto completo, no `ObjectId`) |
| GET | `http://localhost:8080/api/bookings/report/status` | — | `200` · `payload: [{ "_id": "pending", "total": 3 }, ...]` (conteo por estado con `aggregate`, el `GROUP BY` de Mongo) |

**Resto de los endpoints**

| Método | URL | Body (raw JSON) | Respuesta esperada |
|---|---|---|---|
| GET | `http://localhost:8080/api/services/<_id>` | — | `200` · servicio |
| GET | `http://localhost:8080/api/services/<_id-inexistente>` | — | `404` · `{ message: 'Servicio no encontrado' }` |
| GET | `http://localhost:8080/api/services/no-es-un-id` | — | `404` · `{ message: 'Servicio no encontrado' }` (id mal formado) |
| PUT | `http://localhost:8080/api/services/<_id>` | `{ "price":6000 }` | `200` · servicio actualizado |
| PUT | `http://localhost:8080/api/services/<_id-inexistente>` | `{ "price":6000 }` | `404` · `{ message: 'Servicio no encontrado' }` |
| DELETE | `http://localhost:8080/api/services/<_id>` | — | `200` · servicio eliminado (borrado lógico) |
| DELETE | `http://localhost:8080/api/services/<_id-inexistente>` | — | `404` · `{ message: 'Servicio no encontrado' }` |
| POST | `http://localhost:8080/api/bookings` | `{ "clientName":"Ana","clientEmail":"ana@test.com","date":"2026-09-01" }` | `201` · reserva con `status:"pending"` y `services:[]` |
| GET | `http://localhost:8080/api/bookings/<_id-inexistente>` | — | `404` · `{ message: 'Reserva no encontrada' }` |
| POST | `http://localhost:8080/api/bookings/<bid>/services/<sid>` | — | `200` · reserva con el servicio agregado (`quantity:1`), ya poblado |
| POST | `http://localhost:8080/api/bookings/<bid>/services/<sid>` (otra vez) | — | `200` · ahora `quantity:2` |
| POST | `http://localhost:8080/api/bookings/<bid>/services/<sid-inexistente>` | — | `404` · `{ message: 'Servicio no encontrado' }` |
| POST | `http://localhost:8080/api/bookings/<bid-inexistente>/services/<sid>` | — | `404` · `{ message: 'Reserva no encontrada' }` |

> Para agregar un servicio a una reserva, ese servicio tiene que existir
> primero (`POST /api/services`), y hay que usar los `_id` reales que
> devuelve Mongo (no números).

También están disponibles `GET /` (estado del servidor) y `GET /health`
(`{ status: 'ok', uptime }`).

Para las peticiones **POST** y **PUT** en Postman, hay que ir a la
pestaña **Body → raw → JSON** y escribir ahí el objeto a enviar. Eso
funciona gracias a `app.use(express.json())`, el middleware que parsea
el body JSON de la petición y lo deja disponible en `req.body`; sin él,
`req.body` llegaría `undefined`.

## Cómo probar las vistas y el tiempo real (en el navegador)

Postman **no sirve** para esto: las vistas devuelven HTML pensado para
un navegador, y el tiempo real usa WebSockets manejados por el cliente
de Socket.io que corre en la página. Con `npm run dev` corriendo:

1. **Listado renderizado**: abrí `http://localhost:8080/services`. Cada
   nombre es un link al detalle.
2. **Detalle**:
   - `http://localhost:8080/services/<_id>` → datos del servicio y link
     para volver al listado.
   - `http://localhost:8080/bookings/<_id>` → datos de la reserva y sus
     servicios. **Semana 8:** gracias a `populate`, cada servicio se
     muestra con su **nombre, duración y precio** + la cantidad (antes se
     veía solo el `ObjectId`).
   - Con un `_id` inexistente, ambas responden `404` con un texto simple.
3. **Tiempo real**: abrí `http://localhost:8080/realtime-services` en
   **dos pestañas**. Completá el formulario en una y apretá "Agregar
   servicio": el servicio aparece en la lista de **las dos** pestañas sin
   recargar. Si falta un campo o el precio es negativo, solo la pestaña
   que lo envió recibe un `alert` con el error.
4. **Confirmá que quedó guardado en Mongo**: recargá
   `http://localhost:8080/services`, pedí `GET /api/services` en
   Postman, o mirá la colección `services` en Atlas.

### Cómo funciona el tiempo real

```
Pestaña A --emit('newService')--> server --createService()--> MongoDB
                                    |
                                    +--io.emit('servicesUpdated', lista)--> Pestaña A y B
```

- Socket.io necesita el **server HTTP crudo**, por eso `server.js` crea
  `createServer(app)` y levanta con `httpServer.listen` (no `app.listen`).
- El servidor manda **datos** por el socket; el que actualiza el DOM es
  el cliente (`src/public/js/realtime.js`). `res.render` no se usa
  dentro de un evento de socket.
- `io.emit` le envía a **todos** los clientes; `socket.emit`, solo al
  que disparó el evento (así se mandan los errores).

## Dónde se guardan los datos

Ahora los datos viven en tu cluster de **MongoDB Atlas**, en la base
`booking_system` (o el nombre que hayas puesto al final de tu
`MONGO_URI`), en dos colecciones: `services` y `bookings`. Se pueden ver
y editar a mano desde la pestaña **Collections** del cluster en Atlas.

Los archivos `src/data/services.json` y `src/data/bookings.json` quedan
en el repo como referencia histórica de la etapa FileSystem, pero ya no
los lee ni los escribe la app.

## Próximo paso

Con consultas avanzadas, validación y relaciones cerramos el bloque de
**backend**: la API ya lee, filtra, pagina, valida y relaciona datos
sobre MongoDB. Lo que sigue típicamente es **autenticación** (login y
sesiones o tokens **JWT**), **roles y autorización** (qué puede hacer
un admin y qué un cliente) y el **deploy** de la aplicación a un
servidor en la nube.

## Demo de fail-fast

Este proyecto valida, apenas arranca, que existan todas las variables de
entorno obligatorias (`PORT` y `MONGO_URI`). Probá lo siguiente:

1. Abrí tu `.env`.
2. Borrá la línea `MONGO_URI=...` (o dejala vacía).
3. Corré `npm run dev` o `npm start`.

La app **no va a arrancar**: imprime por consola qué variable falta y
termina el proceso inmediatamente, en vez de arrancar "a medias" y
fallar más adelante con un error confuso.

Si `MONGO_URI` está presente pero apunta a un cluster inalcanzable (mal
escrito, IP no habilitada en Network Access, credenciales incorrectas),
`connectDB()` loguea el error de conexión y también corta el proceso
con `process.exit(1)`: la app nunca queda escuchando peticiones sin una
base de datos detrás.
