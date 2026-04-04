import { PrismaClient } from '@prisma/client';
const prisma = global.prisma || new PrismaClient();

export default async function handler(req, res) {
  // --- MÉTODO GET: LISTAR RESERVAS ---
  if (req.method === 'GET') {
    try {
      const bookings = await prisma.base_booking.findMany({
        include: {
          user: { include: { Person: true } },
          table: true
        },
        orderBy: { date: 'desc' }
      });
      return res.status(200).json(bookings);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // --- MÉTODO POST: CREAR RESERVA Y ACTUALIZAR MESA ---
  if (req.method === 'POST') {
    const { date, time, tableId, userId, people, observations } = req.body;

    try {
      // Usamos una transacción: Si algo falla, no se crea la reserva ni se cambia la mesa
      const resultado = await prisma.$transaction(async (tx) => {
        
        // 1. Crear la reserva
        const newBooking = await tx.base_booking.create({
          data: {
            date: new Date(date),
            time: time,
            people: parseInt(people),
            observations: observations || "",
            status: 'PENDIENTE',
            user: { connect: { id: parseInt(userId) } },
            table: { connect: { id: parseInt(tableId) } }
          }
        });

        // 2. ACTUALIZAR EL ESTADO DE LA MESA (ESTO ES LA CLAVE)
        // Cambiamos el estado a 'occupied' para que la API de stats lo detecte
        await tx.base_table.update({
          where: { id: parseInt(tableId) },
          data: { status: 'occupied' } 
        });

        return newBooking;
      });

      return res.status(201).json({ success: true, data: resultado });
    } catch (error) {
      console.error("ERROR AL CREAR RESERVA:", error);
      return res.status(500).json({ success: false, error: "No se pudo crear la reserva" });
    }
  }

  return res.status(405).json({ message: 'Método no permitido' });
}