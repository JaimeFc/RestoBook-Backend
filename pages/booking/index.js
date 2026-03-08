import nextConnect from 'next-connect';
import auth from '@middleware/auth';
import database from '@middleware/database';
// Asegúrate de que este modelo exista en tu carpeta de base de datos
import BookingData from '@database/base/booking'; 
// Subimos 3 niveles: booking -> api -> pages -> raíz para entrar a /lib
import { userBookingLoader } from '../../../lib/booking-loader';

const handler = nextConnect();

handler
  .use(auth)
  .use(database(BookingData)) 
  .get(async (request) => {
    return await request.do('read', async (api, prisma) => {
      // 1. Obtenemos todas las reservas. 
      // Usamos .findMany() que es el estándar de Prisma para traer todo.
      const bookings = await prisma.base_booking.findMany();

      // 2. PUNTO C: Implementación de DataLoader para evitar N+1
      const results = await Promise.all(
        bookings.map(async (b) => ({
          ...b,
          // El loader acumula los userIds y hace una sola consulta a la DB
          user: await userBookingLoader.load(b.userId) 
        }))
      );

      // Enviamos la respuesta enriquecida al frontend
      return api.successMany(results);
    });
  });

export default handler;