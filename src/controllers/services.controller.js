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
// Semana 8: listado PAGINADO, con filtros y orden por query string:
//   /api/services?category=salud&available=true&page=1&limit=2&sort=desc
//
// Shape de la respuesta (CAMBIÓ respecto de la Semana 7: el array ya no
// es todo el payload "suelto", ahora viene envuelto en metadata):
//   {
//     status: 'success',
//     payload: [ ...servicios de ESTA página... ],
//     totalPages, page,
//     hasPrevPage, hasNextPage,   // booleanos
//     prevPage, nextPage,         // número de página o null
//     prevLink, nextLink          // URL lista para usar o null
//   }
export const getServices = async (req, res) => {
  try {
    // El controller no arma filtros: le pasa al service la query string
    // tal cual. Traducirla a filtro/opciones de Mongo es tarea del
    // service.
    const result = await serviceService.getServicesPaginated(req.query);

    // Links de navegación: si no hay página anterior/siguiente, null.
    // Usamos result.limit (el que efectivamente aplicó paginate) para
    // que el link mantenga el mismo tamaño de página.
    const prevLink = result.hasPrevPage
      ? `/api/services?page=${result.prevPage}&limit=${result.limit}`
      : null;
    const nextLink = result.hasNextPage
      ? `/api/services?page=${result.nextPage}&limit=${result.limit}`
      : null;

    res.status(200).json({
      status: 'success',
      payload: result.docs,
      totalPages: result.totalPages,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      prevLink,
      nextLink,
    });
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
