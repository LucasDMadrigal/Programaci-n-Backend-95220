# backend-turnos-reservas

## Qué hace la app

`backend-turnos-reservas` es una **API REST** de un Sistema de Turnos y
Reservas, construida con **Express** y organizada en **capas**, cada una
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
- Una cuenta de **MongoDB Atlas** (o un `MONGO_URI` ya provisto por tu profesor/equipo).

## Setup de MongoDB Atlas

1. Creá una cuenta en [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) y un cluster **M0 (gratuito)**.
2. En **Database Access**, creá un usuario de base de datos con contraseña.
3. En **Network Access**, agregá la IP `0.0.0.0/0` (permite conexión desde cualquier IP; sirve para desarrollo, no para producción).
4. En **Database → Connect → Drivers**, copiá el connection string (formato `mongodb+srv://...`).
5. Reemplazá `<password>` por la contraseña real del usuario, y agregá el nombre de la base al final de la URL: `/booking_system`.
6. Pegá ese string completo en la variable `MONGO_URI` de tu `.env` (nunca en `.env.example`, y nunca lo commitees).

## Instalación paso a paso

```bash
npm install             # express, dotenv y mongoose
cp .env.example .env    # completar PORT=8080 y MONGO_URI (ver Atlas arriba)
npm run dev
```

Si la conexión es correcta, vas a ver en consola:

```
✅ Conexión a MongoDB establecida correctamente
Servidor escuchando en http://localhost:8080
```

También podés levantarlo sin reinicio automático con:

```bash
npm start
```

## Estructura del proyecto

```
src/
  app.js                        # Solo config: express.json(), logger, GET / y /health, y monta los routers
  server.js                     # startServer(): conecta a Mongo (connectDB) y recién despues app.listen
  config/
    config.js                   # Carga y valida variables de entorno (dotenv + fail-fast)
    database.config.js          # connectDB(): mongoose.connect(config.mongoUri)
  routes/
    services.router.js          # express.Router(): endpoints de /api/services -> controller
    bookings.router.js          # express.Router(): endpoints de /api/bookings -> controller
  controllers/
    services.controller.js      # Solo HTTP: lee req, llama al service, mapea error.statusCode
    bookings.controller.js      # Solo HTTP: lee req, llama al service, mapea error.statusCode
  services/
    services.service.js         # Reglas de negocio de services (filtro por categoría, validaciones)
    bookings.service.js         # Reglas de negocio de bookings: valida el servicio (compone
                                 #   ServiceRepository) y aplica la regla de quantity
  repositories/
    services.repository.js      # Puente hacia el DAO de services; hoy instancia ServiceMongoDao
    bookings.repository.js      # Puente hacia el DAO de bookings; hoy instancia BookingMongoDao
  dao/
    models/
      service.model.js          # Schema + model de Mongoose para "services"
      booking.model.js          # Schema + model de Mongoose para "bookings" (con hook pre('save'))
      message.model.js          # Schema + model de Mongoose para "messages" (preparado a futuro)
    mongo/
      services.mongo.dao.js     # Persistencia pura de services en MongoDB (ServiceModel)
      bookings.mongo.dao.js     # Persistencia pura de bookings en MongoDB (BookingModel)
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
  detalle, se "resuelve" la referencia pidiéndole el servicio al
  `ServiceRepository` por ese `id` (o, más adelante, con `.populate()`).

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

## Cómo probar con Postman

Los endpoints son **los mismos que en la Semana 5**: este refactor solo
cambia dónde se persisten los datos. La diferencia visible es que ahora
cada recurso trae un `_id` de MongoDB (un `ObjectId`, no un número
incremental) en vez de `id`. Con el servidor corriendo (por defecto en
`http://localhost:8080`, salvo que hayas cambiado `PORT` en tu `.env`):

| Método | URL | Body (raw JSON) | Respuesta esperada |
|---|---|---|---|
| GET | `http://localhost:8080/api/services` | — | `200` · lista de servicios |
| GET | `http://localhost:8080/api/services/<_id>` | — | `200` · servicio |
| GET | `http://localhost:8080/api/services/<_id-inexistente>` | — | `404` · `{ message: 'Servicio no encontrado' }` |
| GET | `http://localhost:8080/api/services/no-es-un-id` | — | `404` · `{ message: 'Servicio no encontrado' }` (id mal formado) |
| POST | `http://localhost:8080/api/services` | `{ "name":"Masajes","duration":60,"price":8000,"category":"estetica" }` | `201` · servicio creado con `_id` |
| POST | `http://localhost:8080/api/services` | `{ "name":"Incompleto" }` | `400` · faltan campos obligatorios |
| PUT | `http://localhost:8080/api/services/<_id>` | `{ "price":6000 }` | `200` · servicio actualizado |
| PUT | `http://localhost:8080/api/services/<_id-inexistente>` | `{ "price":6000 }` | `404` · `{ message: 'Servicio no encontrado' }` |
| DELETE | `http://localhost:8080/api/services/<_id>` | — | `200` · servicio eliminado |
| DELETE | `http://localhost:8080/api/services/<_id-inexistente>` | — | `404` · `{ message: 'Servicio no encontrado' }` |
| POST | `http://localhost:8080/api/bookings` | `{ "clientName":"Ana","clientEmail":"ana@test.com","date":"2026-09-01" }` | `201` · reserva con `status:"pending"` y `services:[]` |
| GET | `http://localhost:8080/api/bookings/<_id>` | — | `200` · reserva |
| GET | `http://localhost:8080/api/bookings/<_id-inexistente>` | — | `404` · `{ message: 'Reserva no encontrada' }` |
| POST | `http://localhost:8080/api/bookings/<bid>/services/<sid>` | — | `200` · agrega `{ service:<sid>, quantity:1 }` |
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

## Dónde se guardan los datos

Ahora los datos viven en tu cluster de **MongoDB Atlas**, en la base
`booking_system` (o el nombre que hayas puesto al final de tu
`MONGO_URI`), en dos colecciones: `services` y `bookings`. Se pueden ver
y editar a mano desde la pestaña **Collections** del cluster en Atlas.

Los archivos `src/data/services.json` y `src/data/bookings.json` quedan
en el repo como referencia histórica de la etapa FileSystem, pero ya no
los lee ni los escribe la app.

## Próximo paso

Con los datos en Atlas, lo que sigue es hacer `populate()` de las
referencias en `booking.services` (para traer el servicio completo sin
una segunda consulta manual) y armar consultas más avanzadas
(filtros, agregaciones) directamente con Mongoose.

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
