import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Solo permitimos PUT como indica tu frontend
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { id, status } = req.body;

  try {
    // Usamos una transacción para asegurar que si falla el cambio de mesa, 
    // no se cambie la reserva y viceversa.
    const result = await prisma.$transaction(async (tx) => {
      
      // 1. Actualizamos el estado de la reserva
      const updatedBooking = await tx.Base_booking.update({
        where: { id: parseInt(id) },
        data: { status: status },
      });

      // 2. Lógica para cambiar el estado de la MESA
      if (status === 'CONFIRMADA') {
        // Si confirmamos, la mesa pasa a OCUPADA
        await tx.Base_table.update({
          where: { id: updatedBooking.tableId },
          data: { status: 'occupied' },
        });
      } 
      else if (status === 'FINALIZADA' || status === 'CANCELADA') {
        // Si el cliente se va o se cancela, la mesa queda DISPONIBLE de nuevo
        await tx.Base_table.update({
          where: { id: updatedBooking.tableId },
          data: { status: 'available' },
        });
      }

      return updatedBooking;
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error("Error al actualizar estado:", error);
    return res.status(500).json({ 
      error: 'Error interno', 
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}