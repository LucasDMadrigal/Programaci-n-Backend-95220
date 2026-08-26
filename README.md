# backend-turnos-reservas

## Qué hace la app

`backend-turnos-reservas` es una **API REST** de un Sistema de Turnos y
Reservas, construida con **Express**. Expone un **CRUD completo** del
recurso `services` (servicios ofrecidos, por ejemplo "Corte de pelo" o
"Masaje"), con persistencia en un **archivo JSON** a través de la clase
`ServiceManager` (usando `fs/promises`, nativo de Node): los datos ya
**sobreviven a un reinicio del servidor**. Además carga su
configuración (puerto, URL de base de datos) desde variables de entorno
usando `dotenv`, validándolas con el patrón **fail-fast**: si falta
algo, la app avisa por consola y no arranca.

## Requisitos

- Node.js **24** (mínimo **20**, por el soporte de `--watch` y ESM estable).
- git.

## Instalación paso a paso

```bash
npm install            # express y dotenv (fs es nativo, no se instala)
cp .env.example .env   # completar PORT=8080 y MONGO_URI
npm run dev
```

También podés levantarlo sin reinicio automático con:

```bash
npm start
```

## Dependencias del proyecto

- **`express`**: framework que provee el servidor HTTP, el router y los
  middlewares (`express.json()`, logger propio, etc.) usados para armar
  la API.
- **`dotenv`**: lee el archivo `.env` de la raíz del proyecto y carga
  cada variable definida ahí dentro de `process.env`, el objeto donde
  Node guarda las variables de entorno del proceso. Todo lo que dotenv
  carga llega como **string**, aunque en el `.env` parezca un número.

`fs` (más precisamente `fs/promises`) es un módulo **nativo** de
Node.js: no aparece en `package.json` ni requiere instalación, ya viene
incluido en el runtime.

## Dónde se guardan los datos

Los servicios se persisten en `src/data/services.json`. Ese archivo se
trackea en git (arranca como un array vacío `[]`) para que exista
apenas cloná el repo; a medida que creás, editás o borrás servicios, el
`ServiceManager` reescribe este archivo completo con el estado
actualizado.

## Cómo probar con Postman

Con el servidor corriendo (por defecto en `http://localhost:8080`, salvo
que hayas cambiado `PORT` en tu `.env`):

| Método | URL | Body (raw JSON) | Respuesta esperada |
|---|---|---|---|
| GET | `http://localhost:8080/api/services` | — | `200` · `{ status:'success', payload:[...] }` |
| GET | `http://localhost:8080/api/services/1` | — | `200` o `404` si no existe |
| POST | `http://localhost:8080/api/services` | `{ "name":"Masajes","duration":60,"price":8000,"category":"estetica" }` | `201` · servicio creado |
| POST | `http://localhost:8080/api/services` | `{ "name":"Incompleto" }` | `400` · faltan campos |
| PUT | `http://localhost:8080/api/services/1` | `{ "price":6000 }` | `200` o `404` |
| DELETE | `http://localhost:8080/api/services/1` | — | `200` o `404` |

También están disponibles `GET /` (estado del servidor) y `GET /health`
(`{ status: 'ok', uptime }`).

Para las peticiones POST y PUT en Postman, hay que ir a la pestaña
**Body → raw → JSON** y escribir ahí el objeto a enviar. Eso funciona
gracias a `app.use(express.json())`, el middleware que parsea el body
JSON de la petición y lo deja disponible en `req.body`; sin él, `req.body`
llegaría `undefined` y la API respondería `400` (faltan campos) aunque el
body esté bien escrito.

## Prueba de persistencia

Para comprobar que los datos ya sobreviven a un reinicio:

1. Creá un servicio nuevo con `POST /api/services`.
2. Reiniciá el servidor (cortá `npm run dev`/`npm start` y volvé a
   levantarlo).
3. Hacé `GET /api/services`: el servicio creado sigue estando.
4. Abrí `src/data/services.json` y confirmá que quedó escrito ahí.

## Aviso de escalabilidad

Cada operación del `ServiceManager` lee y reescribe **el archivo
completo**. Es perfecto para aprender el flujo de persistencia, pero no
escala: con muchos registros o muchas peticiones simultáneas se vuelve
lento y puede haber condiciones de carrera. La próxima etapa reemplaza
este archivo por una base de datos real: **MongoDB** con **Mongoose**.

## Demo de fail-fast

Este proyecto valida, apenas arranca, que existan todas las variables de
entorno obligatorias (`PORT` y `MONGO_URI`). Probá lo siguiente:

1. Abrí tu `.env`.
2. Borrá la línea `MONGO_URI=...` (o dejala vacía).
3. Corré `npm run dev` o `npm start`.

La app **no va a arrancar**: va a imprimir por consola qué variable falta
y va a terminar el proceso inmediatamente, en vez de arrancar "a medias"
y fallar más adelante con un error confuso. Esto es el patrón
**fail-fast**: preferimos detectar problemas de configuración lo antes
posible.

## Estructura del proyecto

```
src/
  app.js                # App de Express: middlewares y rutas (CRUD de /api/services)
  server.js             # Levanta el servidor con app.listen
  config/
    config.js           # Carga y valida variables de entorno (dotenv + fail-fast)
  managers/
    ServiceManager.js   # Persistencia de services en FileSystem (fs/promises)
  data/
    services.json       # Archivo donde se guardan los servicios
  routes/                # (vacío por ahora, para una clase futura)
  controllers/           # (vacío por ahora, para una clase futura)
  services/              # (vacío por ahora, para una clase futura)
  repositories/          # (vacío por ahora, para una clase futura)
  dao/                   # (vacío por ahora, para una clase futura)
  models/                # (vacío por ahora, para una clase futura)
  middlewares/           # (vacío por ahora, para una clase futura)
  utils/                 # (vacío por ahora, para una clase futura)
```
