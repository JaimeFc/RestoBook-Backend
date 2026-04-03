import { PrismaClient } from '@prisma/client';
import redis from '../../../lib/redis'; 

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ message: 'Method not allowed' });

  const { id, status } = req.body;

  try {
    const bookingId = Number(id);

    // 1. Buscamos la reserva usando el modelo con Mayúscula
    const booking = await prisma.Base_booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Reserva no encontrada" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 2. Actualizamos la reserva
      const updated = await tx.Base_booking.update({
        where: { id: bookingId },
        data: { status: status },
      });

      // 3. Liberamos la mesa si existe
      if (booking.tableId) {
        const tableStatus = (status === 'FINALIZADA' || status === 'CANCELADA') ? 'available' : 'occupied';
        
        await tx.Base_table.update({
          where: { id: booking.tableId },
          data: { status: tableStatus },
        });
      }

      return updated;
    });

    // 4. Limpiamos Redis para que el mapa se actualice
    try {
      await redis.del('cache:bookings_list_v3');
    } catch (redisError) {
      console.log("Redis no disponible, ignorando...");
    }

    return res.status(200).json({ success: true, data: result });

  } catch (error) {
    console.error("ERROR EN DB:", error);
    return res.status(400).json({ 
      success: false, 
      message: "Error de base de datos", 
      details: error.message 
    });
  }
}