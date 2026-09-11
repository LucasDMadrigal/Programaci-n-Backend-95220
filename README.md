# backend-turnos-reservas

## Qué hace la app

`backend-turnos-reservas` es una **API REST** de un Sistema de Turnos y
Reservas, construida con **Express** y organizada en **capas**, cada una
con una única responsabilidad: `route → controller → service →
repository → DAO → JSON`. Expone dos recursos: `services` (servicios
ofrecidos, con **CRUD completo**) y `bookings` (reservas, que se
relacionan con servicios guardando **solo la referencia** al `id`), con
persistencia en archivos JSON. La configuración (puerto, URL de base de
datos) se carga desde variables de entorno con `dotenv` y se valida con
el patrón **fail-fast**: si falta algo, la app avisa por consola y no
arranca.

## Requisitos

- Node.js **24** (mínimo **20**, por el soporte de `--watch` y ESM estable).
- git.

## Instalación paso a paso

```bash
npm install            # express y dotenv (fs es nativo, no se instala)
cp .env.example .env    # completar PORT=8080 y MONGO_URI
npm run dev
```

También podés levantarlo sin reinicio automático con:

```bash
npm start
```

## Estructura del proyecto

```
src/
  app.js                        # Solo config: express.json(), logger, GET / y /health, y monta los routers
  server.js                     # Levanta el servidor con app.listen
  config/
    config.js                   # Carga y valida variables de entorno (dotenv + fail-fast)
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
    services.repository.js      # Puente hacia el DAO de services (inyección de dependencias)
    bookings.repository.js      # Puente hacia el DAO de bookings (inyección de dependencias)
  dao/
    fileSystem/
      services.fs.dao.js        # Persistencia pura de services en FileSystem (fs/promises)
      bookings.fs.dao.js        # Persistencia pura de bookings en FileSystem (fs/promises)
  utils/
    AppError.js                 # Error de dominio con statusCode, para que el service lo lance
                                 #   y el controller lo mapee a la respuesta HTTP
  data/
    services.json               # Archivo donde se guardan los servicios (arranca en [])
    bookings.json                # Archivo donde se guardan las reservas (arranca en [])
```

Sin dependencias nuevas: `express.Router()` viene incluido en Express y
`fs/promises` es nativo de Node.

## Flujo de una petición y capas

```
Cliente -> Ruta -> Controller -> Service -> Repository -> DAO -> archivo JSON
```

| Capa | Responsabilidad |
|---|---|
| **route** | Conecta un endpoint (método + path) con una función del controller. |
| **controller** | SOLO HTTP: lee `req`, llama al service y traduce el resultado (o el `AppError` capturado) a status + cuerpo JSON. No conoce repositories ni DAOs. |
| **service** | Reglas de **negocio**: qué es válido, cómo se combinan los datos. Lanza `AppError(mensaje, statusCode)` cuando algo falla. No conoce `req`/`res` ni instancia un DAO directamente: solo conoce a su **repository**. |
| **repository** | Puente hacia el DAO, con **inyección de dependencias** (recibe el DAO por constructor, con un valor por defecto). No aplica reglas de negocio, solo delega. |
| **dao** | Persistencia **pura**: leer/escribir el JSON (`fs/promises`) y CRUD sobre él. Devuelve datos o `null`. |

Cada capa devuelve su resultado a la que la llamó, hasta llegar de nuevo
al controller.

> **Por qué separar repository de DAO.** Para migrar a MongoDB alcanza
> con crear `services.mongo.dao.js` / `bookings.mongo.dao.js` (misma
> interfaz: `getAll/getById/create/update/delete`) y cambiar, en el
> constructor del repository, qué DAO se instancia por defecto. Los
> services, controllers y rutas **no cambian**.

## Por qué la reserva guarda solo el `id` del servicio

En `booking.services` **no** se guarda el objeto completo del servicio,
solo su referencia: `{ service: <id>, quantity: <n> }`. Motivos:

- **Sin duplicación**: el nombre, precio y duración del servicio viven
  en un único lugar (`services.json`). Si mañana cambia el precio, no
  quedan copias viejas desperdigadas dentro de cada reserva.
- **Sin inconsistencias**: una sola fuente de verdad. Para mostrar el
  detalle, se "resuelve" la referencia pidiéndole el servicio al
  `ServiceRepository` por ese `id`.

Esta regla (validar el servicio + decidir entre incrementar `quantity`
o agregar `{ service, quantity: 1 }`) vive en `bookings.service.js`. El
`BookingFsDao` solo persiste la lista ya resuelta.

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

**Los endpoints son los mismos que en la Semana 4** (CRUD de `services`
+ crear/obtener reservas + agregar servicio con `quantity`): este
refactor solo reorganiza el código internamente, la API se comporta
**idéntica**. Con el servidor corriendo (por defecto en
`http://localhost:8080`, salvo que hayas cambiado `PORT` en tu `.env`):

| Método | URL | Body (raw JSON) | Respuesta esperada |
|---|---|---|---|
| GET | `http://localhost:8080/api/services` | — | `200` · lista de servicios |
| GET | `http://localhost:8080/api/services/1` | — | `200` · servicio |
| GET | `http://localhost:8080/api/services/999` | — | `404` · `{ message: 'Servicio no encontrado' }` |
| POST | `http://localhost:8080/api/services` | `{ "name":"Masajes","duration":60,"price":8000,"category":"estetica" }` | `201` · servicio creado |
| POST | `http://localhost:8080/api/services` | `{ "name":"Incompleto" }` | `400` · faltan campos obligatorios |
| PUT | `http://localhost:8080/api/services/1` | `{ "price":6000 }` | `200` · servicio actualizado |
| PUT | `http://localhost:8080/api/services/999` | `{ "price":6000 }` | `404` · `{ message: 'Servicio no encontrado' }` |
| DELETE | `http://localhost:8080/api/services/1` | — | `200` · servicio eliminado |
| DELETE | `http://localhost:8080/api/services/999` | — | `404` · `{ message: 'Servicio no encontrado' }` |
| POST | `http://localhost:8080/api/bookings` | `{ "client":"Ana","date":"2026-09-01" }` | `201` · reserva con `services:[]` |
| GET | `http://localhost:8080/api/bookings/1` | — | `200` · reserva |
| GET | `http://localhost:8080/api/bookings/999` | — | `404` · `{ message: 'Reserva no encontrada' }` |
| POST | `http://localhost:8080/api/bookings/1/services/2` | — | `200` · agrega `{ service:2, quantity:1 }` |
| POST | `http://localhost:8080/api/bookings/1/services/2` (otra vez) | — | `200` · ahora `quantity:2` |
| POST | `http://localhost:8080/api/bookings/1/services/999` | — | `404` · `{ message: 'Servicio no encontrado' }` |
| POST | `http://localhost:8080/api/bookings/999/services/1` | — | `404` · `{ message: 'Reserva no encontrada' }` |

> Para agregar un servicio a una reserva, ese servicio tiene que existir
> primero (`POST /api/services`).

También están disponibles `GET /` (estado del servidor) y `GET /health`
(`{ status: 'ok', uptime }`).

Para las peticiones **POST** y **PUT** en Postman, hay que ir a la
pestaña **Body → raw → JSON** y escribir ahí el objeto a enviar. Eso
funciona gracias a `app.use(express.json())`, el middleware que parsea
el body JSON de la petición y lo deja disponible en `req.body`; sin él,
`req.body` llegaría `undefined`.

## Dónde se guardan los datos

- Servicios: `src/data/services.json`
- Reservas: `src/data/bookings.json`

Ambos archivos se trackean en git y arrancan con datos de ejemplo. Cada
operación del DAO reescribe el archivo completo con el estado
actualizado.

## Aviso de escalabilidad

Cada operación del DAO lee y reescribe **el archivo completo**. Es
perfecto para aprender el flujo de persistencia, pero no escala: con
muchos registros o peticiones simultáneas se vuelve lento y puede haber
condiciones de carrera.

Este refactor deja el proyecto **listo para MongoDB + Mongoose**: como
la única capa que sabe leer/escribir datos es el DAO, migrar significa
agregar `services.mongo.dao.js` / `bookings.mongo.dao.js` con la misma
interfaz y cambiar, en el `repository`, qué DAO instancia por defecto.
Las rutas, controllers y services quedan intactos.

## Demo de fail-fast

Este proyecto valida, apenas arranca, que existan todas las variables de
entorno obligatorias (`PORT` y `MONGO_URI`). Probá lo siguiente:

1. Abrí tu `.env`.
2. Borrá la línea `MONGO_URI=...` (o dejala vacía).
3. Corré `npm run dev` o `npm start`.

La app **no va a arrancar**: imprime por consola qué variable falta y
termina el proceso inmediatamente, en vez de arrancar "a medias" y
fallar más adelante con un error confuso.
