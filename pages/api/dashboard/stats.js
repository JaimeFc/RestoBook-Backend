import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    // Definimos el rango de "Hoy" (desde las 00:00:00 hasta las 23:59:59)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Contar reservas de hoy
    // Nota: Usamos base_booking (en minúsculas) que es como Prisma genera el cliente
    const totalReservasHoy = await prisma.base_booking.count({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: {
          not: 'CANCELADA',
        },
      },
    });

    // 2. Contar mesas disponibles (status === 'available')
    const mesasDisponibles = await prisma.base_table.count({
      where: {
        status: 'available',
        active: true,
      },
    });

    // 3. Obtener el total de mesas activas para el cálculo de porcentaje
    const totalMesas = await prisma.base_table.count({
      where: {
        active: true,
      },
    });

    // Calculamos el porcentaje de ocupación
    const ocupacionPorcentaje = totalMesas > 0 
      ? Math.round(((totalMesas - mesasDisponibles) / totalMesas) * 100) 
      : 0;

    return res.status(200).json({
      reservasHoy: totalReservasHoy,
      mesasDisponibles: mesasDisponibles,
      totalMesas: totalMesas,
      ocupacion: ocupacionPorcentaje,
    });

  } catch (error) {
    console.error("Error en Dashboard Stats API:", error);
    return res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}