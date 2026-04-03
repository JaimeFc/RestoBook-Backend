import { PrismaClient } from '@prisma/client';
import redisClient, { connectRedis } from '../../../lib/redis';

const prisma = global.prisma || new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ message: 'Method not allowed' });
  const { id, status } = req.body;

  try {
    const bookingId = Number(id);

    // 1. Actualizar DB
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.Base_booking.update({
        where: { id: bookingId },
        data: { status: status },
      });

      // Liberar mesa si se finaliza o cancela
      if (booking.tableId && (status === 'FINALIZADA' || status === 'CANCELADA')) {
        await tx.Base_table.update({
          where: { id: booking.tableId },
          data: { status: 'available' },
        });
      }
      return booking;
    });

    // 2. Limpieza de Caché con verificación de conexión
    try {
      await connectRedis(); // Intentamos conectar
      
      if (redisClient.isOpen) {
        // Borramos TODAS las llaves que alimentan el dashboard
        const keys = [
          'cache:dashboard_stats',
          'cache:bookings_list_v3',
          'cache:tables_all',
          'dashboard_stats'
        ];
        await Promise.all(keys.map(key => redisClient.del(key)));
        console.log("✅ Caché limpiada con éxito.");
      }
    } catch (redisError) {
      console.error("⚠️ No se pudo limpiar Redis (Servicio caído), el Dashboard podría no actualizarse.");
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error:", error.message);
    return res.status(400).json({ success: false, details: error.message });
  }
}