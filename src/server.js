// Etapa 1: servidor HTTP nativo básico.
//
// Node.js trae incorporado el módulo "http", que nos permite levantar un
// servidor web sin instalar ningún paquete externo (a diferencia de, por
// ejemplo, Express). Es más manual, pero sirve para entender qué es lo que
// esos frameworks hacen "por debajo".
import http from 'http';

// Puerto donde va a escuchar el servidor. Más adelante esto va a salir
// de una variable de entorno, pero por ahora lo dejamos fijo (hardcodeado)
// para ir de a poco.
const PORT = 8080;

// http.createServer recibe una función "callback" que se ejecuta cada vez
// que llega una petición (request) al servidor. Esa función recibe dos
// objetos:
//   - req (request): contiene toda la información de lo que pidió el cliente
//     (método HTTP, URL, headers, body, etc.)
//   - res (response): es el objeto que usamos para contestarle al cliente
//     (código de estado, headers, cuerpo de la respuesta, etc.)
const server = http.createServer((req, res) => {
  // Por ahora respondemos siempre lo mismo, sin importar qué se pida.
  // En la próxima etapa vamos a separar esta lógica en su propio archivo
  // y a rutear según el método y la URL.
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      mensaje: 'Backend de Turnos y Reservas',
      status: 'activo',
    })
  );
});

// server.listen pone al servidor a "escuchar" conexiones entrantes en el
// puerto indicado. El callback que le pasamos como segundo argumento se
// ejecuta una sola vez, cuando el servidor ya está listo para recibir
// pedidos.
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
