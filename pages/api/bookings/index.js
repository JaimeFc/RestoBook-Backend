import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const bookings = await prisma.base_booking.findMany({
        include: {
          user: { include: { Person: true } },
          table: true
        },
        orderBy: { date: 'asc' }
      });
      res.status(200).json(bookings);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
}