import { Queue, Worker } from 'bullmq';

// Conexión a Redis (Docker)
const connection = {
  host: 'localhost',
  port: 6379,
};

// 1. Definimos la cola de correos
export const mailQueue = new Queue('emails', { connection });

// 2. Definimos el Worker (El que procesa el envío en segundo plano)
// Usamos global para que en Next.js no se duplique el proceso al recargar
if (!global.mailWorker) {
  global.mailWorker = new Worker('emails', async (job) => {
    console.log(`--------------------------------------------------`);
    console.log(`✉️ ENVIANDO CORREO DE BIENVENIDA A: ${job.data.email}`);
    console.log(`👤 USUARIO: ${job.data.username}`);
    console.log(`--------------------------------------------------`);
  }, { connection });
}