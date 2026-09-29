// ---------------------------------------------------------------------
// Controller del recurso "services"
//
// Responsabilidad de esta capa: SOLO HTTP. Recibe (req, res), lee lo
// que hace falta (req.params, req.query, req.body) y llama al SERVICE.
// No toca el FileSystem ni las reglas de negocio: de eso se encargan el
// service, el repository y el DAO.
//
// Las capas y su responsabilidad:
//   route      -> conecta un endpoint (método + path) con una función
//   controller -> SOLO HTTP: lee req, llama al service, elige el status
//   service    -> reglas de NEGOCIO (no conoce req ni res)
//   repository -> puente hacia el DAO (inyección de dependencias)
//   dao        -> persistencia pura: leer/escribir el archivo JSON
//
// Manejo de errores: el service lanza AppError con un mensaje y un
// statusCode (400, 404, etc.) cuando algo de negocio falla. Acá el
// catch es genérico: si el error trae statusCode lo usamos, si no
// (un error inesperado, por ejemplo del disco) respondemos 500.
// ---------------------------------------------------------------------

import { serviceService } from '../services/services.service.js';

// GET /api/services
// Lista todos los servicios. Filtro opcional por query string:
// /api/services?category=salud
export const getServices = async (req, res) => {
  try {
    // El controller no filtra: solo le pasa al service lo que vino en
    // la query string. La regla de "filtrar por categoría" vive en el
    // service.
    const { category } = req.query;

    const payload = await serviceService.getServices({ category });

    res.status(200).json({ status: 'success', payload });
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ status: 'error', message: error.message });
  }
};

// GET /api/services/:sid
// Busca un servicio puntual por id.
export const getServiceById = async (req, res) => {
  try {
    const service = await serviceService.getServiceById(req.params.sid);

    res.status(200).json({ status: 'success', payload: service });
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ status: 'error', message: error.message });
  }
};

// POST /api/services
// Crea un servicio nuevo a partir del body de la petición. La
// validación de campos obligatorios (¿son válidos para el dominio?) la
// hace el service; el controller solo pasa los datos.
export const createService = async (req, res) => {
  try {
    const newService = await serviceService.createService(req.body);

    // 201 Created: se creó un recurso nuevo.
    res.status(201).json({ status: 'success', payload: newService });
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ status: 'error', message: error.message });
  }
};

// PUT /api/services/:sid
// Actualiza (reemplaza campos de) un servicio existente.
export const updateService = async (req, res) => {
  try {
    const updatedService = await serviceService.updateService(req.params.sid, req.body);

    res.status(200).json({ status: 'success', payload: updatedService });
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ status: 'error', message: error.message });
  }
};

// DELETE /api/services/:sid
// Elimina un servicio del archivo de datos.
export const deleteService = async (req, res) => {
  try {
    const deletedService = await serviceService.deleteService(req.params.sid);

    res.status(200).json({ status: 'success', payload: deletedService });
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ status: 'error', message: error.message });
  }
};
