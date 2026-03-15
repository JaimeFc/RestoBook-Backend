import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { date, time } = req.query;

  try {
    // 1. Convertir la hora elegida a un rango (ej: si elige 14:00, el rango es 14:00 a 16:00)
    const startTime = time;
    const [hours, minutes] = time.split(':').map(Number);
    const endTime = `${hours + 2}:${minutes.toString().padStart(2, '0')}`;

    // 2. Buscar reservas que choquen con ese horario en esa fecha
    const busyBookings = await prisma.Base_booking.findMany({
      where: {
        date: new Date(date),
        time: {
          // Lógica simplificada: si la hora está entre el inicio y fin de otra
          gte: startTime, 
          lte: endTime
        }
      },
      select: { tableId: true }
    });

    const busyTableIds = busyBookings.map(b => b.tableId);

    // 3. Traer todas las mesas que NO estén en la lista de ocupadas
    const availableTables = await prisma.Base_table.findMany({
      where: {
        id: { notIn: busyTableIds },
        active: true
      }
    });

    res.status(200).json(availableTables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}