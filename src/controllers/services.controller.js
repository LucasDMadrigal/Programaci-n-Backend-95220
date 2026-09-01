// ---------------------------------------------------------------------
// Controller del recurso "services"
//
// Responsabilidad de esta capa: SOLO HTTP. Recibe (req, res), lee lo
// que hace falta (req.params, req.query, req.body), valida el FORMATO
// del request, llama al SERVICE y traduce lo que devuelve a un código
// de estado + cuerpo JSON. No toca el FileSystem ni las reglas de
// negocio: de eso se encargan el service y el manager.
//
// Las cuatro capas y su responsabilidad:
//   route      -> conecta un endpoint (método + path) con una función
//   controller -> SOLO HTTP: lee req, valida formato, elige el status
//   service    -> reglas de NEGOCIO (no conoce req ni res)
//   manager    -> persistencia pura: leer/escribir el archivo JSON
//
// Cada función va envuelta en try/catch: si algo INESPERADO falla (por
// ejemplo el disco), respondemos 500 en vez de dejar caer el servidor.
// Los casos ESPERADOS (no existe -> 404, faltan campos -> 400) se
// manejan con if, no con excepciones.
// ---------------------------------------------------------------------

import { servicesService } from '../services/services.service.js';

// GET /api/services
// Lista todos los servicios. Filtro opcional por query string:
// /api/services?category=salud
export const getServices = async (req, res) => {
  try {
    // El controller no filtra: solo le pasa al service lo que vino en
    // la query string. La regla de "filtrar por categoría" vive en el
    // service.
    const { category } = req.query;

    const payload = await servicesService.getServices({ category });

    res.status(200).json({ status: 'success', payload });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// GET /api/services/:sid
// Busca un servicio puntual por id.
export const getServiceById = async (req, res) => {
  try {
    const service = await servicesService.getServiceById(req.params.sid);

    if (!service) {
      // 404 Not Found: el service devolvió null -> el recurso no existe.
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

    // Validación de FORMATO del request: si falta algún campo
    // obligatorio, no seguimos. Esto es una regla del protocolo HTTP
    // (request mal armado -> 400), por eso se queda en el controller.
    // Las reglas de dominio van al service.
    if (!name || !duration || !price || !category) {
      // 400 Bad Request: la petición está mal formada (culpa del cliente).
      return res
        .status(400)
        .json({ status: 'error', message: 'Faltan campos obligatorios' });
    }

    const newService = await servicesService.createService(req.body);

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
    const updatedService = await servicesService.updateService(
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
    const deletedService = await servicesService.deleteService(req.params.sid);

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
