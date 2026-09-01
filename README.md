# backend-turnos-reservas

## Qué hace la app

`backend-turnos-reservas` es una **API REST modular** de un Sistema de
Turnos y Reservas, construida con **Express**. La API está organizada en
capas: cada recurso tiene su **router** (mapea endpoint → función), su
**controller** (traduce HTTP ↔ lógica de negocio: valida, elige el
status code, arma la respuesta) y su **manager** (persistencia pura en
un **archivo JSON** con `fs/promises`, nativo de Node). Hoy expone dos
recursos: `services` (servicios ofrecidos, con **CRUD completo**) y
`bookings` (reservas, que se relacionan con servicios guardando **solo
la referencia** al `id`). La configuración (puerto, URL de base de
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
  app.js                    # Solo config: express.json(), logger, GET / y /health, y monta los routers
  server.js                 # Levanta el servidor con app.listen
  config/
    config.js               # Carga y valida variables de entorno (dotenv + fail-fast)
  routes/
    services.router.js      # express.Router(): endpoints de /api/services -> controller
    bookings.router.js      # express.Router(): endpoints de /api/bookings -> controller
  controllers/
    services.controller.js  # Lógica HTTP de services (validaciones, status codes, respuestas)
    bookings.controller.js  # Lógica HTTP de bookings (mapea errores del manager a 404, etc.)
  managers/
    ServiceManager.js       # Persistencia de services en FileSystem (fs/promises)
    BookingManager.js       # Persistencia de bookings; usa ServiceManager para validar servicios
  data/
    services.json           # Archivo donde se guardan los servicios (arranca en [])
    bookings.json           # Archivo donde se guardan las reservas (arranca en [])
```

`express.Router()` viene incluido en Express y `fs/promises` es nativo
de Node: **no hace falta instalar nada nuevo** respecto de la Semana 3.

## Flujo de una petición

```
Cliente  ->  Ruta (router)  ->  Controller  ->  Manager  ->  archivo JSON
```

- **Ruta**: reconoce el método + path y llama a la función del controller.
- **Controller**: lee `req.params` / `req.query` / `req.body`, valida,
  le pide el trabajo al manager y decide el código HTTP + el cuerpo de
  la respuesta. Va todo en `try/catch` → ante un error inesperado
  responde `500`.
- **Manager**: lee/escribe el archivo JSON y devuelve datos o `null`.
  No sabe nada de HTTP.

## Por qué la reserva guarda solo el `id` del servicio

En `booking.services` **no** se guarda el objeto completo del servicio,
solo su referencia: `{ service: <id>, quantity: <n> }`. Motivos:

- **Sin duplicación**: el nombre, precio y duración del servicio viven
  en un único lugar (`services.json`). Si mañana cambia el precio, no
  quedan copias viejas desperdigadas dentro de cada reserva.
- **Sin inconsistencias**: una sola fuente de verdad. Para mostrar el
  detalle, se "resuelve" la referencia pidiéndole el servicio al
  `ServiceManager` por ese `id`.

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

Con el servidor corriendo (por defecto en `http://localhost:8080`, salvo
que hayas cambiado `PORT` en tu `.env`):

| Método | URL | Body (raw JSON) | Respuesta esperada |
|---|---|---|---|
| GET | `http://localhost:8080/api/services` | — | `200` · lista de servicios |
| GET | `http://localhost:8080/api/services/1` | — | `200` o `404` si no existe |
| POST | `http://localhost:8080/api/services` | `{ "name":"Masajes","duration":60,"price":8000,"category":"estetica" }` | `201` · servicio creado |
| POST | `http://localhost:8080/api/services` | `{ "name":"Incompleto" }` | `400` · faltan campos |
| PUT | `http://localhost:8080/api/services/1` | `{ "price":6000 }` | `200` o `404` |
| DELETE | `http://localhost:8080/api/services/1` | — | `200` o `404` |
| POST | `http://localhost:8080/api/bookings` | `{ "client":"Ana","date":"2026-09-01" }` | `201` · reserva con `services:[]` |
| GET | `http://localhost:8080/api/bookings/1` | — | `200` o `404` |
| POST | `http://localhost:8080/api/bookings/1/services/2` | — | `200` · agrega `{ service:2, quantity:1 }` |
| POST | `http://localhost:8080/api/bookings/1/services/2` (otra vez) | — | `200` · ahora `quantity:2` |
| POST | `http://localhost:8080/api/bookings/1/services/999` | — | `404` · servicio no existe |

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

Ambos archivos se trackean en git y arrancan como un array vacío `[]`
para que existan apenas cloná el repo. Cada operación del manager
reescribe el archivo completo con el estado actualizado.

### Prueba de persistencia

1. Creá un servicio con `POST /api/services`.
2. Reiniciá el servidor (cortá `npm run dev` y volvé a levantarlo).
3. Hacé `GET /api/services`: el servicio sigue estando.
4. Abrí `src/data/services.json` y confirmá que quedó escrito ahí.

## Aviso de escalabilidad

Cada operación del manager lee y reescribe **el archivo completo**. Es
perfecto para aprender el flujo de persistencia, pero no escala: con
muchos registros o peticiones simultáneas se vuelve lento y puede haber
condiciones de carrera. La próxima etapa reemplaza los archivos por una
base de datos real: **MongoDB** con **Mongoose**. Lo bueno de la
estructura modular es que ese cambio se hace **reescribiendo solo los
managers**, sin tocar (casi) las rutas ni los controllers.

## Demo de fail-fast

Este proyecto valida, apenas arranca, que existan todas las variables de
entorno obligatorias (`PORT` y `MONGO_URI`). Probá lo siguiente:

1. Abrí tu `.env`.
2. Borrá la línea `MONGO_URI=...` (o dejala vacía).
3. Corré `npm run dev` o `npm start`.

La app **no va a arrancar**: imprime por consola qué variable falta y
termina el proceso inmediatamente, en vez de arrancar "a medias" y
fallar más adelante con un error confuso.
