import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Obtenemos la fecha de hoy a las 00:00 para comparar
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const bookings = await prisma.base_booking.findMany({
        include: {
          user: { include: { Person: true } },
          table: true
        },
        // --- NUEVA LÓGICA DE ORDENAMIENTO ---
        orderBy: [
          {
            // 1. Las fechas más recientes (u hoy) aparecen primero
            date: 'desc'
          },
          {
            // 2. Dentro del mismo día, las horas más tarde arriba
            time: 'desc'
          }
        ]
      });

      // OPCIONAL: Si quieres un ordenamiento por estado (CONFIRMADA arriba, FINALIZADA abajo)
      // Prisma no ordena Enums personalizados fácilmente, pero con el orden por fecha
      // descendente verás lo de hoy al principio de la lista.
      
      res.status(200).json(bookings);
    } catch (e) {
      console.error("Error al listar reservas:", e);
      res.status(500).json({ error: e.message });
    }
  }
}