// Etapa 3: configuración centralizada usando variables de entorno.
//
// dotenv es la única dependencia externa de este proyecto. Su trabajo es
// simple: lee el archivo ".env" que está en la raíz del proyecto y carga
// cada línea "CLAVE=valor" dentro de process.env, el objeto global de
// Node donde viven las variables de entorno del proceso.
import 'dotenv/config';

// Lista de variables de entorno que la app necesita sí o sí para
// funcionar. Si en el futuro agregamos una nueva variable obligatoria,
// alcanza con sumarla acá.
const variablesRequeridas = ['PORT', 'MONGO_URI'];

// Patrón "fail-fast": en vez de dejar que la app arranque a medias y
// explote más tarde con un error confuso (por ejemplo, al intentar
// conectarse a una base de datos con una URL undefined), preferimos
// chequear ACÁ, apenas arranca el proceso, que estén todas las
// variables necesarias. Si falta alguna, avisamos con un mensaje claro
// y cortamos la ejecución inmediatamente.
const variablesFaltantes = variablesRequeridas.filter(
  (nombre) => !process.env[nombre]
);

if (variablesFaltantes.length > 0) {
  console.error(
    '❌ Faltan variables de entorno obligatorias:',
    variablesFaltantes.join(', ')
  );
  console.error(
    'Revisá tu archivo .env (podés basarte en .env.example) y volvé a intentar.'
  );
  // process.exit(1) termina el proceso de Node inmediatamente con un
  // código de salida distinto de 0, que por convención indica que el
  // programa terminó por un error.
  process.exit(1);
}

// Importante: TODO lo que viene de process.env es siempre un string,
// incluso si en el .env escribimos un número (PORT=8080). Por eso acá
// convertimos explícitamente PORT a Number antes de usarlo; si no lo
// hiciéramos, más adelante podríamos tener bugs raros al mezclar strings
// con números (por ejemplo, al compararlos o al pasarlos a otras APIs
// que esperan un número).
export const config = {
  port: Number(process.env.PORT),
  // MONGO_URI todavía no se usa para conectarnos a ninguna base de
  // datos: eso queda para una clase futura. Por ahora solo la validamos
  // y la dejamos disponible acá, para enseñar el patrón de fail-fast
  // completo (validar todo lo que la app va a necesitar, aunque todavía
  // no se use todo).
  mongoUri: process.env.MONGO_URI,
};
