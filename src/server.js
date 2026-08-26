// Etapa 3: server.js ahora usa la configuración validada en config.js
// en vez de tener el puerto hardcodeado.
import http from 'http';
// Recordá: en ESM los imports locales necesitan la extensión ".js".
import { handler } from './app.js';
import { config } from './config/config.js';

// http.createServer recibe nuestra función handler como callback: se va
// a ejecutar automáticamente cada vez que llegue una petición nueva.
const server = http.createServer(handler);

// Usamos config.port, que ya viene validado (fail-fast) y convertido a
// Number desde config.js. Si PORT no estuviera definido en el .env, el
// proceso ya se habría cortado antes de llegar a esta línea.
server.listen(config.port, () => {
  console.log(`Servidor escuchando en http://localhost:${config.port}`);
});
