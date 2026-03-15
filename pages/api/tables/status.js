import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const tables = await prisma.Base_table.findMany({
      where: { 
        active: true 
      },
      include: {
        // Esto nos permitirá saber quién está sentado si la mesa está ocupada
        bookings: {
          where: { status: 'CONFIRMADA' },
          include: {
            user: {
              include: { Person: true }
            }
          },
          take: 1 // Solo la reserva actual
        }
      },
      orderBy: { 
        number: 'asc' 
      }
    });

    res.status(200).json(tables);
  } catch (error) {
    console.error("Error en API de mesas:", error);
    res.status(500).json({ error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}