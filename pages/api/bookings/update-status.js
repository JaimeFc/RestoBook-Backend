import { PrismaClient } from '@prisma/client';
import redis from '../../../lib/redis'; // IMPORTA REDIS AQUÍ

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { id, status } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.Base_booking.update({
        where: { id: parseInt(id) },
        data: { status: status },
      });

      if (status === 'CONFIRMADA') {
        await tx.Base_table.update({
          where: { id: updatedBooking.tableId },
          data: { status: 'occupied' },
        });
      } 
      else if (status === 'FINALIZADA' || status === 'CANCELADA') {
        await tx.Base_table.update({
          where: { id: updatedBooking.tableId },
          data: { status: 'available' },
        });
      }

      return updatedBooking;
    });

    // --- CORRECCIÓN CRÍTICA ---
    // Borramos la caché para que el contador de la "Card" se actualice al instante
    try { await redis.del('cache:bookings_list_v3'); } catch (e) { console.log("Redis no disponible"); }

    return res.status(200).json(result);

  } catch (error) {
    console.error("Error al actualizar estado:", error);
    return res.status(500).json({ error: 'Error interno', details: error.message });
  }
}