import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { date, time, people } = req.query;

  try {
    const numPeople = parseInt(people) || 1;
    
    // 1. Normalizamos la fecha de búsqueda (YYYY-MM-DD)
    // Usamos string para comparar fechas de forma más segura en base de datos
    const [year, month, day] = date.split('-').map(Number);
    const searchDate = new Date(year, month - 1, day, 12, 0, 0, 0); 

    // 2. Convertimos la hora buscada a minutos para comparar rangos
    const [searchHour, searchMin] = time.split(':').map(Number);
    const searchTimeInMinutes = (searchHour * 60) + searchMin;

    // 3. Buscamos TODAS las reservas CONFIRMADAS para ese día
    const dayBookings = await prisma.base_booking.findMany({
      where: {
        date: searchDate,
        status: { notIn: ['CANCELADA', 'FINALIZADA'] }
      },
      select: { tableId: true, time: true }
    });

    // 4. Filtramos las mesas que tienen conflicto de horario (Margen de 1 hora)
    const MARGEN_MINUTOS = 60; // 1 hora de duración estimada por reserva
    
    const occupiedTableIds = dayBookings
      .filter(booking => {
        const [bHour, bMin] = booking.time.split(':').map(Number);
        const bookingTimeInMinutes = (bHour * 60) + bMin;
        
        // Hay conflicto si la diferencia entre reservas es menor a 1 hora
        const diferencia = Math.abs(bookingTimeInMinutes - searchTimeInMinutes);
        return diferencia < MARGEN_MINUTOS;
      })
      .map(b => b.tableId);

    // 5. Buscamos las mesas que cumplen con capacidad y están libres en ese rango
    const availableTables = await prisma.base_table.findMany({
      where: {
        id: { notIn: occupiedTableIds.length > 0 ? occupiedTableIds : [] },
        capacity: { gte: numPeople },
        active: true,
        // Eliminamos el filtro 'status: occupied' para que el 
        // sistema se base en RESERVAS y no en el estado físico manual
      },
      orderBy: { number: 'asc' }
    });

    return res.status(200).json(availableTables);
  } catch (error) {
    console.error("Error en available-tables:", error);
    return res.status(500).json({ message: "Error al buscar mesas disponibles" });
  } finally {
    await prisma.$disconnect();
  }
}