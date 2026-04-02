import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // 1. Recibimos parámetros. IMPORTANTE: El frontend debe enviar userId y role.
      const { showAll, userId, role } = req.query;

      // 2. CONSTRUCCIÓN DEL FILTRO DE SEGURIDAD
      let whereCondition = {};

      // BLOQUEO DE PRIVACIDAD: 
      // Si el rol NO es 'admin', el filtro por userId es OBLIGATORIO.
      // Esto evita que Angela vea al 'ADMINISTRADOR SISTEMA'
      if (role !== 'admin') {
        if (!userId) {
          return res.status(400).json({ error: "Falta identificación de usuario para filtrar." });
        }
        whereCondition.userId = parseInt(userId);
      }
      // Si es admin, whereCondition se queda vacío {} y puede ver TODO.

      // 3. FILTRO DE VISTA (Historial vs Activas)
      // Independientemente de quién seas, esto solo quita o pone las terminadas.
      if (showAll !== 'true') {
        whereCondition.status = { notIn: ['FINALIZADA', 'CANCELADA'] };
      }

      const bookings = await prisma.base_booking.findMany({
        where: whereCondition, 
        include: {
          user: { 
            include: { Person: true } 
          },
          table: true
        },
        orderBy: [
          { date: 'desc' },
          { time: 'desc' }
        ]
      });
      
      res.status(200).json(bookings);
    } catch (e) {
      console.error("Error al listar reservas:", e);
      res.status(500).json({ error: e.message });
    }
  }
}