import nextConnect from 'next-connect';
import auth from '@middleware/auth';
import database from '@middleware/database';

// CORRECCIÓN DE RUTA: Subimos 3 niveles (booking -> api -> pages -> RAIZ)
import BookingData from '../../../database/base/booking'; 

// CORRECCIÓN DE RUTA: Lo mismo para el loader
import { userBookingLoader } from '../../../lib/booking-loader';

const handler = nextConnect();

handler
  .use(auth)
  .use(database(BookingData)) 
  .get(async (request) => {
    return await request.do('read', async (api, prisma) => {
      // 1. Obtenemos las reservas. Prisma usa minúsculas para los modelos por defecto.
      const bookings = await prisma.base_booking.findMany();

      // 2. PUNTO C: Implementación de DataLoader
      const results = await Promise.all(
        bookings.map(async (b) => ({
          ...b,
          // El loader hace el "batching" de usuarios
          user: await userBookingLoader.load(b.userId) 
        }))
      );

      return api.successMany(results);
    });
  });

export default handler;