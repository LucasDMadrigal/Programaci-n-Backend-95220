# backend-turnos-reservas

## Qué hace la app

`backend-turnos-reservas` es una API mínima de un **Sistema de Turnos y
Reservas**, construida con el módulo **`http` nativo de Node.js** (sin
Express ni ningún framework). Expone rutas simples para consultar el
estado del servidor y el listado de servicios disponibles, y carga su
configuración (puerto, URL de base de datos) desde variables de entorno
usando `dotenv`, validándolas con el patrón **fail-fast**: si falta algo,
la app avisa por consola y no arranca.

## Requisitos

- Node.js **24** (mínimo **20**, por el soporte de `--watch` y ESM estable).

## Instalación paso a paso

```bash
npm install               # instala dotenv
cp .env.example .env      # crea tu .env y completá PORT y MONGO_URI
npm run dev                # levanta el server con reinicio automático
```

También podés levantarlo sin reinicio automático con:

```bash
npm start
```

## La dependencia del proyecto

- **`dotenv`**: lee el archivo `.env` de la raíz del proyecto y carga cada
  variable definida ahí dentro de `process.env`, el objeto donde Node
  guarda las variables de entorno del proceso. Todo lo que dotenv carga
  llega como **string**, aunque en el `.env` parezca un número.

El resto del proyecto usa exclusivamente módulos nativos de Node
(`http`, `process`) y la flag nativa `--watch` de Node para el modo
desarrollo.

## Cómo probar con Postman

Con el servidor corriendo (por defecto en `http://localhost:8080`, salvo
que hayas cambiado `PORT` en tu `.env`), en Postman: creá una request de
tipo **GET**, pegá la URL correspondiente y tocá **Send**. La respuesta
se ve en la pestaña **Body**, en formato JSON.

| Método | URL | Respuesta esperada |
|---|---|---|
| GET | `http://localhost:8080/` | `200` · `{ mensaje, status: 'activo' }` |
| GET | `http://localhost:8080/api/servicios` | `200` · array de servicios |
| GET | `http://localhost:8080/health` | `200` · `{ status: 'ok', uptime }` |
| GET | `http://localhost:8080/cualquier-otra` | `404` · `{ error: 'Ruta no encontrada' }` |

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
  app.js                # Ruteo manual (GET /, /api/servicios, /health, 404)
  server.js             # Crea y levanta el servidor http
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
