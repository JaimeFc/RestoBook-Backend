import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'No' });

  try {
    const tables = await prisma.Base_table.findMany({
      where: { active: true },
      include: {
        bookings: {
          // Quitamos el filtro de fecha de aquí para que no de errores
          where: { status: 'CONFIRMADA' },
          include: {
            user: { include: { Person: true } },
          }
        }
      },
      orderBy: { number: 'asc' }
    });
    res.status(200).json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}