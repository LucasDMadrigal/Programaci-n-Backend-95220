// ---------------------------------------------------------------------
// Model de Mongoose para el recurso "messages".
//
// Todavía no hay rutas/controllers que usen este model: se deja
// preparado para una funcionalidad futura (por ejemplo, un chat o un
// libro de mensajes de contacto).
// ---------------------------------------------------------------------

import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export const MessageModel = mongoose.model('Message', messageSchema);
