// ServiceManager encapsula toda la persistencia del recurso "services".
//
// En vez de guardar los datos en un array en memoria (que se pierde al
// reiniciar el servidor), esta clase lee y escribe un archivo JSON en
// disco usando el módulo nativo fs/promises. Node ya lo trae incluido:
// no hace falta instalar ninguna dependencia.
//
// Responsabilidad de esta clase: SOLO leer, guardar y devolver datos (o
// null cuando algo no existe). La validación de campos obligatorios y
// los códigos de estado HTTP (400, 404, etc.) quedan afuera, en las
// rutas de app.js. Así separamos "cómo se persisten los datos" de "cómo
// se responde a una petición HTTP", que son dos responsabilidades
// distintas.
import fs from 'fs/promises';

// Ruta al archivo donde vive el "estado" del recurso services. Es una
// ruta relativa: se resuelve tomando como base el directorio desde el
// que se ejecuta el proceso de Node (la raíz del proyecto, que es desde
// donde corremos "npm run dev" / "npm start"), no la ubicación de este
// archivo.
const PATH = './src/data/services.json';

export class ServiceManager {
  // #read() y #write() son métodos PRIVADOS (el # es sintaxis de clase
  // privada de JS): solo se pueden llamar desde adentro de esta clase.
  // Centralizan el acceso al archivo para que los métodos CRUD no
  // repitan la lógica de leer/parsear o de serializar/escribir.

  // Lee el archivo completo y lo devuelve ya parseado como array.
  // Si el archivo no existe todavía, o su contenido no es JSON válido,
  // devolvemos un array vacío en vez de romper la aplicación.
  async #read() {
    try {
      const content = await fs.readFile(PATH, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return [];
    }
  }

  // Recibe el array completo de servicios y lo escribe en el archivo,
  // reemplazando todo su contenido anterior. JSON.stringify con el
  // tercer argumento (2) indenta el JSON para que quede legible al
  // abrir el archivo a mano.
  async #write(services) {
    await fs.writeFile(PATH, JSON.stringify(services, null, 2));
  }

  // GET /api/services
  // Devuelve el array completo de servicios tal como está en el archivo.
  async getServices() {
    return this.#read();
  }

  // GET /api/services/:sid
  // Lee todo el archivo y busca el servicio cuyo id coincida.
  // Devuelve el servicio encontrado, o null si no existe (la ruta
  // decide qué código HTTP corresponde a ese null).
  async getServiceById(id) {
    const services = await this.#read();
    const service = services.find((s) => s.id === Number(id));
    return service ?? null;
  }

  // POST /api/services
  // Flujo: leer todo -> calcular el próximo id -> armar el objeto nuevo
  // con valores por defecto -> agregarlo al array -> escribir todo de
  // nuevo en el archivo.
  async addService(data) {
    const services = await this.#read();

    // Id incremental: buscamos el mayor id existente y sumamos 1. Si
    // el archivo está vacío, arrancamos en 1.
    const maxId = services.reduce((max, s) => Math.max(max, s.id), 0);

    const newService = {
      id: maxId + 1,
      name: data.name,
      description: data.description ?? '',
      duration: data.duration,
      price: data.price,
      category: data.category,
      available: data.available ?? true,
    };

    services.push(newService);
    await this.#write(services);

    return newService;
  }

  // PUT /api/services/:sid
  // Flujo: leer todo -> buscar el índice del servicio -> si no existe,
  // devolver null -> si existe, mezclar sus campos actuales con los
  // que llegaron en data (preservando el id original) -> escribir todo
  // de nuevo -> devolver el servicio ya actualizado.
  async updateService(id, data) {
    const services = await this.#read();
    const index = services.findIndex((s) => s.id === Number(id));

    if (index === -1) {
      return null;
    }

    const updatedService = { ...services[index], ...data, id: services[index].id };
    services[index] = updatedService;
    await this.#write(services);

    return updatedService;
  }

  // DELETE /api/services/:sid
  // Flujo: leer todo -> buscar el índice del servicio -> si no existe,
  // devolver null -> si existe, quitarlo del array con splice ->
  // escribir todo de nuevo -> devolver el servicio que se eliminó.
  async deleteService(id) {
    const services = await this.#read();
    const index = services.findIndex((s) => s.id === Number(id));

    if (index === -1) {
      return null;
    }

    const [deletedService] = services.splice(index, 1);
    await this.#write(services);

    return deletedService;
  }
}
