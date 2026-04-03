import { PrismaClient } from '@prisma/client';
const prisma = global.prisma || new PrismaClient();

export default async function handler(req, res) {
  try {
    // 1. Intentamos traer TODO sin relaciones primero para probar la conexión
    const bookings = await prisma.booking.findMany({
      // Si esto funciona, el error está en los 'include' de abajo
      include: {
        user: true,
        table: true,
      },
    });

    return res.status(200).json(bookings);
  } catch (e) {
    console.error("DETALLE DEL ERROR:", e);
    
    // 2. Si falla lo anterior, traemos solo lo básico de la tabla Booking
    try {
        const basicBookings = await prisma.booking.findMany();
        return res.status(200).json(basicBookings);
    } catch (e2) {
        return res.status(500).json({ error: "Error total en DB", details: e2.message });
    }
  }
}