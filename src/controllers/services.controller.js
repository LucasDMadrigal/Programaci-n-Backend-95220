// ---------------------------------------------------------------------
// Controller del recurso "services"
//
// Responsabilidad de esta capa: recibir (req, res), leer lo que hace
// falta (req.params, req.query, req.body), pedirle el trabajo al manager
// y decidir QUÉ responder (código HTTP + cuerpo JSON). No toca el
// FileSystem directamente: de eso se encarga el ServiceManager.
//
// Las tres capas y su responsabilidad:
//   route      -> conecta un endpoint (método + path) con una función
//   controller -> traduce HTTP <-> lógica de negocio (valida, arma la
//                 respuesta, elige el status code)
//   manager    -> persistencia pura: leer/escribir el archivo, devolver
//                 datos o null
//
// Cada función va envuelta en try/catch: si algo INESPERADO falla (por
// ejemplo el disco), respondemos 500 en vez de dejar caer el servidor.
// Los casos ESPERADOS (no existe -> 404, faltan campos -> 400) se
// manejan con if, no con excepciones.
// ---------------------------------------------------------------------

import { ServiceManager } from '../managers/ServiceManager.js';

// Instanciamos el manager acá, una sola vez, y lo comparten todas las
// funciones del controller.
const serviceManager = new ServiceManager();

// GET /api/services
// Lista todos los servicios. Filtro opcional por query string:
// /api/services?category=salud
export const getServices = async (req, res) => {
  try {
    const { category } = req.query;

    const allServices = await serviceManager.getServices();

    const payload = category
      ? allServices.filter((service) => service.category === category)
      : allServices;

    res.status(200).json({ status: 'success', payload });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// GET /api/services/:sid
// Busca un servicio puntual por id.
export const getServiceById = async (req, res) => {
  try {
    const service = await serviceManager.getServiceById(req.params.sid);

    if (!service) {
      // 404 Not Found: el manager devolvió null -> el recurso no existe.
      return res
        .status(404)
        .json({ status: 'error', message: 'Servicio no encontrado' });
    }

    res.status(200).json({ status: 'success', payload: service });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// POST /api/services
// Crea un servicio nuevo a partir del body de la petición.
export const createService = async (req, res) => {
  try {
    const { name, duration, price, category } = req.body;

    // Validación mínima: si falta algún campo obligatorio, no seguimos.
    // El manager no valida nada, solo persiste lo que le llega.
    if (!name || !duration || !price || !category) {
      // 400 Bad Request: la petición está mal formada (culpa del cliente).
      return res
        .status(400)
        .json({ status: 'error', message: 'Faltan campos obligatorios' });
    }

    const newService = await serviceManager.addService(req.body);

    // 201 Created: se creó un recurso nuevo.
    res.status(201).json({ status: 'success', payload: newService });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// PUT /api/services/:sid
// Actualiza (reemplaza campos de) un servicio existente.
export const updateService = async (req, res) => {
  try {
    const updatedService = await serviceManager.updateService(
      req.params.sid,
      req.body
    );

    if (!updatedService) {
      return res
        .status(404)
        .json({ status: 'error', message: 'Servicio no encontrado' });
    }

    res.status(200).json({ status: 'success', payload: updatedService });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// DELETE /api/services/:sid
// Elimina un servicio del archivo de datos.
export const deleteService = async (req, res) => {
  try {
    const deletedService = await serviceManager.deleteService(req.params.sid);

    if (!deletedService) {
      return res
        .status(404)
        .json({ status: 'error', message: 'Servicio no encontrado' });
    }

    res.status(200).json({ status: 'success', payload: deletedService });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getServiceByName = async (req, res) => {
  try {
    const service = await serviceManager.getServiceByName(req.params.sname);
    res.status(200).json({ status: 'success', payload: service });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
}
