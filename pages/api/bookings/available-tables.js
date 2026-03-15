import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { date, time } = req.query;

  if (!date || !time) {
    return res.status(400).json({ error: "Fecha y hora son requeridas" });
  }

  try {
    // 1. Normalizar la fecha para la consulta (solo año-mes-día)
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);

    // 2. Definir rango de bloqueo (Margen de 2 horas)
    // Usamos una lógica más segura para el cálculo de tiempo
    const [hours, minutes] = time.split(':').map(Number);
    const startHour = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Calculamos el fin de rango evitando desbordamientos (ej. 25:00)
    const endHourNum = (hours + 2) % 24;
    const endHour = `${endHourNum.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // 3. Buscar reservas que "choquen" en ese horario específico
    // Solo filtramos si el estado NO es 'CANCELADA' o 'FINALIZADA'
    const busyBookings = await prisma.Base_booking.findMany({
      where: {
        date: searchDate,
        time: {
          gte: startHour,
          lte: endHour
        },
        NOT: {
          status: { in: ['CANCELADA', 'FINALIZADA'] }
        }
      },
      select: { tableId: true }
    });

    const busyTableIds = busyBookings.map(b => b.tableId);

    // 4. Traer TODAS las mesas activas que no estén en la lista de ocupadas
    // Quitamos cualquier filtro de 'status' manual para que mande la disponibilidad real
    const availableTables = await prisma.Base_table.findMany({
      where: {
        id: { 
          notIn: busyTableIds.length > 0 ? busyTableIds : [-1] // Evita error si la lista está vacía
        },
        active: true
      },
      orderBy: {
        number: 'asc'
      }
    });

    res.status(200).json(availableTables);
  } catch (error) {
    console.error("Error en available-tables:", error);
    res.status(500).json({ error: "Error al calcular disponibilidad" });
  }
}