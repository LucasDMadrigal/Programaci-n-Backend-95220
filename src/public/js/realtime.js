// ---------------------------------------------------------------------
// Cliente de Socket.io (Semana 7)
//
// OJO: este archivo NO corre en Node, corre en el NAVEGADOR. Express lo
// sirve como archivo estático desde src/public. Por eso acá tenemos
// acceso a document, alert, FormData, etc., y no a imports de Node.
// ---------------------------------------------------------------------

// io() viene del script /socket.io/socket.io.js que cargamos antes en
// la vista. Sin argumentos, se conecta al mismo servidor que sirvió la
// página.
const socket = io();

const form = document.getElementById('serviceForm');
const servicesList = document.getElementById('servicesList');

// El servidor nos manda la lista completa de servicios: al conectarnos
// y cada vez que alguien (nosotros u otra pestaña) crea uno. Acá es
// donde se actualiza el DOM: el servidor manda DATOS, el cliente decide
// cómo mostrarlos.
socket.on('servicesUpdated', (services) => {
  servicesList.innerHTML = services
    .map(
      (service) =>
        `<li><strong>${service.name}</strong> — ${service.duration} min — $${service.price} (${service.category})</li>`
    )
    .join('');
});

form.addEventListener('submit', (e) => {
  // Evitamos el comportamiento por defecto del form (recargar la página
  // haciendo un GET/POST). Los datos viajan por el socket.
  e.preventDefault();

  // FormData lee todos los inputs con "name" del formulario, y
  // Object.fromEntries lo convierte en un objeto plano:
  // { name: '...', duration: '...', price: '...', category: '...' }.
  // Los valores llegan como string; Mongoose los castea a Number al
  // guardar, según el schema.
  const data = Object.fromEntries(new FormData(form));

  socket.emit('newService', data);
  form.reset();
});

// Si el servidor rechaza el servicio (por ejemplo, faltan campos), solo
// ESTE cliente recibe el mensaje de error.
socket.on('errorMessage', (msg) => {
  alert(`Error: ${msg}`);
});
