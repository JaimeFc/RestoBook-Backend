import { PrismaClient } from '@prisma/client';
import redis from '../../../lib/redis';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  try {
    const { date, time, tableId, userId, people, observations } = req.body;

    // 1. NORMALIZACIÓN CRÍTICA: Quitamos segundos y milisegundos
    const [year, month, day] = date.split('-').map(Number);
    const searchDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    
    // Aseguramos que la hora sea exacta (ej: "20:00")
    const cleanTime = time.trim().substring(0, 5); 

    // 2. BUSCAR CONFLICTO (Búsqueda estricta)
    const conflict = await prisma.base_booking.findFirst({
      where: {
        tableId: Number(tableId),
        date: searchDate,
        time: cleanTime,
        status: { notIn: ['CANCELADA', 'FINALIZADA'] }
      }
    });

    if (conflict) {
      // 3. BUSCAR ALTERNATIVAS
      const occupiedInThisSlot = await prisma.base_booking.findMany({
        where: { date: searchDate, time: cleanTime, status: { notIn: ['CANCELADA', 'FINALIZADA'] } },
        select: { tableId: true }
      });

      const busyIds = occupiedInThisSlot.map(b => b.tableId);

      const suggestions = await prisma.base_table.findMany({
        where: {
          id: { notIn: busyIds.length > 0 ? busyIds : [-1] },
          active: true
        },
        take: 4
      });

      return res.status(409).json({
        success: false,
        message: `La Mesa ya está reservada para las ${cleanTime}.`,
        suggestions
      });
    }

    // 4. CREACIÓN SI TODO ESTÁ BIEN
    const newBooking = await prisma.base_booking.create({
      data: {
        date: searchDate,
        time: cleanTime,
        people: parseInt(people),
        observations: observations || "",
        status: 'CONFIRMADA', // La ponemos como confirmada de una vez
        userId: parseInt(userId),
        tableId: parseInt(tableId)
      }
    });

    try { await redis.del('cache:bookings_list_v3'); } catch (e) {}

    return res.status(201).json({ success: true, data: newBooking });

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}