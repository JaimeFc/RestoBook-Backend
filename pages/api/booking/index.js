import nextConnect from 'next-connect';
import auth from '@middleware/auth';
import database from '@middleware/database';
import BookingData from '@database/booking';
import { userBookingLoader } from '@lib/booking-loader';

const handler = nextConnect();

handler
  .use(auth)
  .use(database(BookingData))
  .get(async (request) => {
    return await request.do('read', async (api, prisma) => {
      const bookings = await prisma.base_booking.findMany();

      const results = await Promise.all(
        bookings.map(async (b) => ({
          ...b,
          user: await userBookingLoader.load(b.userId)
        }))
      );

      return api.successMany(results);
    });
  });

export default handler;