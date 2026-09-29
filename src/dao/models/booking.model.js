// ---------------------------------------------------------------------
// Model de Mongoose para el recurso "bookings".
//
// booking.services es un array de subdocumentos: cada uno guarda una
// REFERENCIA (ObjectId) al servicio agregado, no el servicio completo.
// Esto es un "populate-able reference": más adelante se puede pedir
// que Mongoose traiga el servicio completo con .populate('services.service').
// ---------------------------------------------------------------------

import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  clientEmail: { type: String },
  date: { type: Date },
  time: { type: String },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    
    default: 'pending',
  },
  services: [
    {
      // Semana 8: el campo se llama "service" (no "serviceId") porque
      // es el que usa bookings.service.js al hacer push y el path que
      // le pasamos a .populate('services.service'). Si el nombre no
      // coincide con el schema, Mongoose (modo strict) descarta el dato
      // en silencio y no hay nada para poblar.
      // ref: 'Service' le dice a populate en qué colección buscar.
      service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
      quantity: { type: Number, default: 1 },
    },
  ],
  updatedAt: { type: Date, default: Date.now },
});

// El hook pre('save') se ejecuta justo antes de guardar un documento.
// Acá lo usamos para mantener updatedAt siempre al día.
//
// IMPORTANTE: esta función NO puede ser arrow function. Mongoose llama
// a este hook con un `this` que apunta al documento que se está por
// guardar; una arrow function no tiene su propio `this` (usa el del
// contexto donde fue definida), así que `this.updatedAt` no
// funcionaría. Con `function` normal, Mongoose puede "bindear" el
// `this` correcto.
bookingSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const BookingModel = mongoose.model('Booking', bookingSchema);
