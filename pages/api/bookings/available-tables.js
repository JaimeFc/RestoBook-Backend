import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { date, time, people } = req.query;

  try {
    const numPeople = parseInt(people) || 1;
    
    // CORRECCIÓN DE FECHA: Mantenemos el mediodía para evitar saltos de día
    const [year, month, day] = date.split('-').map(Number);
    const searchDate = new Date(year, month - 1, day, 12, 0, 0, 0); 

    const cleanTime = time.trim().substring(0, 5);

    // 1. Buscamos reservas activas para ese momento exacto
    const occupiedBookings = await prisma.base_booking.findMany({
      where: {
        date: searchDate,
        time: cleanTime,
        status: { notIn: ['CANCELADA', 'FINALIZADA'] }
      },
      select: { tableId: true }
    });

    const occupiedTableIds = occupiedBookings.map(b => b.tableId);

    // 2. Buscamos mesas que realmente pueden recibir gente
    const availableTables = await prisma.base_table.findMany({
      where: {
        // No deben tener reserva en ese horario
        id: { notIn: occupiedTableIds.length > 0 ? occupiedTableIds : [-1] },
        // Capacidad suficiente para los comensales
        capacity: { gte: numPeople },
        // La mesa debe estar ACTIVA (No borrada lógicamente)
        active: true,
        // ADICIONAL: La mesa no debe estar marcada como ocupada físicamente
        status: { not: 'occupied' }
      },
      orderBy: { number: 'asc' } // Orden 1, 2, 3, 4, 5, 6...
    });

    return res.status(200).json(availableTables);
  } catch (error) {
    console.error("Error en available-tables:", error);
    return res.status(500).json({ message: "Error al buscar mesas" });
  }
}