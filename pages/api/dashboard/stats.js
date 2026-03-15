import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    // Definimos el rango de "Hoy" (basado en la fecha actual del servidor)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Contar reservas de hoy
    // Ajustado: Usamos 'Base_booking' (nombre exacto del modelo) 
    // y contamos solo las que están 'CONFIRMADA' para el indicador principal
    const totalReservasHoy = await prisma.Base_booking.count({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: 'CONFIRMADA', 
      },
    });

    // 2. Contar mesas disponibles (status === 'available')
    // Ajustado: Usamos 'Base_table'
    const mesasDisponibles = await prisma.Base_table.count({
      where: {
        status: 'available',
        active: true,
      },
    });

    // 3. Obtener el total de mesas activas
    const totalMesas = await prisma.Base_table.count({
      where: {
        active: true,
      },
    });

    // 4. Calculamos las mesas OCUPADAS (total - disponibles) para el porcentaje
    const mesasOcupadas = totalMesas - mesasDisponibles;

    // Calculamos el porcentaje de ocupación
    const ocupacionPorcentaje = totalMesas > 0 
      ? Math.round((mesasOcupadas / totalMesas) * 100) 
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