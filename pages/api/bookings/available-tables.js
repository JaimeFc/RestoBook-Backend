import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Soporta GET (para listar) y POST (para validar antes de crear)
  const { date, time, tableId } = req.method === 'POST' ? req.body : req.query;

  if (!date || !time) {
    return res.status(400).json({ error: "Fecha y hora son requeridas" });
  }

  try {
    // 1. Normalizar fecha
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);

    // 2. Definir rango de choque (Margen de 2 horas)
    const [hours, minutes] = time.split(':').map(Number);
    const startHourNum = hours;
    const startHour = `${startHourNum.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    const endHourNum = (hours + 2) % 24;
    const endHour = `${endHourNum.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // 3. Buscar reservas que "choquen"
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

    // --- LÓGICA DE BLOQUEO (NUEVA) ---
    // Si el usuario envió un tableId (intento de reserva), verificamos si está en la lista de ocupadas
    if (tableId && busyTableIds.includes(parseInt(tableId))) {
      
      // Buscamos las mesas que SÍ están libres para sugerir
      const suggestedTables = await prisma.Base_table.findMany({
        where: {
          id: { notIn: busyTableIds.length > 0 ? busyTableIds : [-1] },
          active: true
        },
        take: 5 // Sugerimos las primeras 5 libres
      });

      return res.status(409).json({
        success: false,
        message: "¡Lo sentimos! Esta mesa ya ha sido reservada por otra persona en este horario.",
        availableOptions: suggestedTables
      });
    }

    // 4. Traer todas las mesas disponibles (comportamiento normal de consulta)
    const availableTables = await prisma.Base_table.findMany({
      where: {
        id: { notIn: busyTableIds.length > 0 ? busyTableIds : [-1] },
        active: true
      },
      orderBy: { number: 'asc' }
    });

    res.status(200).json(availableTables);

  } catch (error) {
    console.error("Error en validación de disponibilidad:", error);
    res.status(500).json({ error: "Error al calcular disponibilidad" });
  }
}