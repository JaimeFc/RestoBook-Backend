import { PrismaClient } from '@prisma/client';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ message: 'Method not allowed' });

  const { id, status } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizamos la reserva
      // Usamos el nombre que Prisma genera por defecto: base_booking
      const updatedBooking = await tx.base_booking.update({
        where: { id: Number(id) },
        data: { status: status },
      });

      // 2. Intentamos actualizar la mesa (solo si tiene un tableId válido)
      if (updatedBooking.tableId) {
        try {
          await tx.base_table.update({
            where: { id: updatedBooking.tableId },
            data: { 
              status: (status === 'FINALIZADA' || status === 'CANCELADA') ? 'available' : 'occupied' 
            },
          });
        } catch (tableError) {
          console.error("La mesa no existe o no se pudo actualizar:", tableError.message);
          // No lanzamos error aquí para que al menos la reserva SÍ se guarde
        }
      }

      return updatedBooking;
    });

    return res.status(200).json({ success: true, data: result });

  } catch (error) {
    console.error("Error fatal:", error.message);
    return res.status(400).json({ 
      success: false, 
      message: "Error al procesar: " + error.message 
    });
  }
}