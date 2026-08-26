# backend-turnos-reservas

## Qué hace la app

`backend-turnos-reservas` es una **API REST** de un Sistema de Turnos y
Reservas, construida con **Express**. Expone un **CRUD completo** del
recurso `services` (servicios ofrecidos, por ejemplo "Corte de pelo" o
"Masaje"), guardado por ahora **en memoria** (sin base de datos ni
archivos todavía), y carga su configuración (puerto, URL de base de
datos) desde variables de entorno usando `dotenv`, validándolas con el
patrón **fail-fast**: si falta algo, la app avisa por consola y no
arranca.

## Requisitos

- Node.js **24** (mínimo **20**, por el soporte de `--watch` y ESM estable).
- git.

## Instalación paso a paso

```bash
npm install               # instala express y dotenv
cp .env.example .env      # crea tu .env y completá PORT y MONGO_URI
npm run dev                # levanta el server con reinicio automático
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

## Cómo probar con Postman

Con el servidor corriendo (por defecto en `http://localhost:8080`, salvo
que hayas cambiado `PORT` en tu `.env`):

| Método | URL | Body (raw JSON) | Respuesta esperada |
|---|---|---|---|
| GET | `http://localhost:8080/api/services` | — | `200` · `{ status:'success', payload:[...] }` |
| GET | `http://localhost:8080/api/services?category=salud` | — | `200` · lista filtrada |
| GET | `http://localhost:8080/api/services/1` | — | `200` · el servicio |
| GET | `http://localhost:8080/api/services/999` | — | `404` · `{ status:'error', ... }` |
| POST | `http://localhost:8080/api/services` | `{ "name":"Masajes","duration":60,"price":8000,"category":"estetica" }` | `201` · servicio creado |
| POST | `http://localhost:8080/api/services` | `{ "name":"Incompleto" }` | `400` · faltan campos |
| PUT | `http://localhost:8080/api/services/1` | `{ "price":6000 }` | `200` · servicio actualizado |
| DELETE | `http://localhost:8080/api/services/1` | — | `200` · servicio eliminado |

También están disponibles `GET /` (estado del servidor) y `GET /health`
(`{ status: 'ok', uptime }`).

Para las peticiones POST y PUT en Postman, hay que ir a la pestaña
**Body → raw → JSON** y escribir ahí el objeto a enviar. Eso funciona
gracias a `app.use(express.json())`, el middleware que parsea el body
JSON de la petición y lo deja disponible en `req.body`; sin él, `req.body`
llegaría `undefined` y la API respondería `400` (faltan campos) aunque el
body esté bien escrito.

## Datos en memoria (aviso)

Los servicios se guardan en un array **en memoria**, dentro del propio
proceso de Node. Esto quiere decir que **todo lo que crees, edites o
borres se pierde cada vez que reiniciás el servidor** (por ejemplo, con
`npm run dev` cada vez que `--watch` detecta un cambio). La persistencia
real (guardar los datos en el FileSystem) llega en la próxima clase.

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
  routes/                # (vacío por ahora, para una clase futura)
  controllers/           # (vacío por ahora, para una clase futura)
  services/              # (vacío por ahora, para una clase futura)
  repositories/          # (vacío por ahora, para una clase futura)
  dao/                   # (vacío por ahora, para una clase futura)
  models/                # (vacío por ahora, para una clase futura)
  middlewares/           # (vacío por ahora, para una clase futura)
  utils/                 # (vacío por ahora, para una clase futura)
```
