// ---------------------------------------------------------------------
// AppError: error de DOMINIO con código HTTP adjunto.
//
// ¿Para qué sirve? Hasta ahora los services devolvían `null` cuando algo
// no existía, y el controller decidía "null -> 404" con un if. Eso
// funciona, pero mezcla dos cosas: el service tiene que "avisar" de
// alguna forma qué salió mal, y el controller tiene que interpretarlo.
//
// Con AppError el service simplemente LANZA el error con el mensaje y el
// status HTTP que le corresponden (throw new AppError('Servicio no
// encontrado', 404)), y el controller solo necesita un catch genérico
// que lea error.statusCode. Así el service puede expresar CUALQUIER
// regla de negocio ("no encontrado", "dato inválido", etc.) sin que el
// controller tenga que conocer cada caso particular.
// ---------------------------------------------------------------------

export class AppError extends Error {
  constructor(message, statusCode = 400) {
    // Llamamos al constructor de Error para que message, stack, etc.
    // se configuren como en cualquier Error nativo de JS.
    super(message);

    // Nombre de la clase, útil para loguear o para distinguir este
    // error de otros errores inesperados (por ejemplo, uno que tire el
    // propio fs si el disco falla).
    this.name = 'AppError';

    // statusCode es lo que el controller va a leer para responder con
    // el código HTTP correcto (400, 404, etc.). Default 400 porque la
    // mayoría de los errores de negocio son "pedido mal formado".
    this.statusCode = statusCode;
  }
}
