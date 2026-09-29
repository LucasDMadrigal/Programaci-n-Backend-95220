// ---------------------------------------------------------------------
// Model de Mongoose para el recurso "services".
//
// Un "schema" define la forma que van a tener los documentos de esta
// colección: qué campos existen, de qué tipo son, cuáles son
// obligatorios y qué valor toman por defecto si no se manda. Mongoose
// valida esto automáticamente antes de guardar.
//
// { timestamps: true } le agrega automáticamente los campos createdAt
// y updatedAt a cada documento, actualizados por Mongoose.
// ---------------------------------------------------------------------

import mongoose from 'mongoose';
// Semana 8: plugin de paginación. Le agrega al model un método
// estático ServiceModel.paginate(filtro, opciones) que hace el find +
// skip/limit + countDocuments por nosotros y devuelve los documentos de
// la página junto con la metadata (totalPages, hasNextPage, etc.).
import mongoosePaginate from 'mongoose-paginate-v2';

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    duration: { type: Number, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    available: { type: Boolean, default: true },
    delete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Los plugins se aplican sobre el SCHEMA y ANTES de crear el model con
// mongoose.model(...): si se aplican después, el model ya se construyó
// sin el método paginate.
serviceSchema.plugin(mongoosePaginate);

// El nombre del model ("Service") es el que Mongoose usa para inferir
// el nombre de la colección en MongoDB (la pluraliza y pone en
// minúsculas: "services"), que es el mismo nombre que ya usábamos con
// FileSystem.
export const ServiceModel = mongoose.model('Service', serviceSchema);
