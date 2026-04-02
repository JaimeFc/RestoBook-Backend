import { PrismaClient } from '@prisma/client';
import redis from '../../../lib/redis';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  try {
    const { date, time, tableId, userId, people, observations, menu } = req.body;

    const numPeople = parseInt(people) || 1;
    const [year, month, day] = date.split('-').map(Number);
    
    // Forzamos la fecha a mediodía (12:00) para que coincida exactamente con lo que hay en la BD
    // y evitar que por horas de diferencia parezcan días distintos.
    const searchDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    const cleanTime = time.trim().substring(0, 5); 

    // 1. BUSCAR CONFLICTO (Validación estricta)
    const conflict = await prisma.base_booking.findFirst({
      where: {
        tableId: Number(tableId),
        date: searchDate,
        time: cleanTime,
        status: { notIn: ['CANCELADA', 'FINALIZADA'] }
      }
    });

    if (conflict) {
      // Si hay conflicto, buscamos qué otras mesas están ocupadas para sugerir
      const occupiedInThisSlot = await prisma.base_booking.findMany({
        where: { 
          date: searchDate, 
          time: cleanTime, 
          status: { notIn: ['CANCELADA', 'FINALIZADA'] } 
        },
        select: { tableId: true }
      });

      const busyIds = occupiedInThisSlot.map(b => b.tableId);
      
      const suggestions = await prisma.base_table.findMany({
        where: {
          id: { notIn: busyIds.length > 0 ? busyIds : [-1] },
          capacity: { gte: numPeople },
          active: true
        },
        take: 10,
        orderBy: { number: 'asc' }
      });

      return res.status(409).json({
        success: false,
        message: `La Mesa ya está reservada para las ${cleanTime}.`,
        suggestions
      });
    }

    // 2. CREACIÓN (Doble Check: Si Prisma falla aquí, lanzará un error)
    const newBooking = await prisma.base_booking.create({
      data: {
        date: searchDate,
        time: cleanTime,
        people: numPeople,
        observations: observations || "",
        menuItems: menu || "", 
        status: 'CONFIRMADA',
        userId: parseInt(userId),
        tableId: parseInt(tableId)
      }
    });

    try { await redis.del('cache:bookings_list_v3'); } catch (e) {}

    return res.status(201).json({ success: true, data: newBooking });

  } catch (error) {
    console.error("ERROR AL CREAR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}