// Etapa 2: server.js ahora solo se encarga de levantar el servidor HTTP.
// La lógica de ruteo vive en app.js.
import http from 'http';
// Importante: en ESM (módulos de JavaScript "nativos", los que usan
// import/export) hay que escribir la extensión ".js" al importar
// archivos locales. En CommonJS (require) esto era opcional, pero en
// ESM es obligatorio: si escribiéramos "./app" sin la extensión, Node
// tiraría un error al no encontrar el archivo.
import { handler } from './app.js';

// Puerto donde va a escuchar el servidor. Todavía hardcodeado: en la
// próxima etapa lo vamos a sacar de una variable de entorno con dotenv.
const PORT = 8080;

// http.createServer recibe nuestra función handler como callback: se va
// a ejecutar automáticamente cada vez que llegue una petición nueva.
const server = http.createServer(handler);

server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
