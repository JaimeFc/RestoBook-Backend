import { PrismaClient } from '@prisma/client';
import redis from '../../../lib/redis';

const prisma = global.prisma || new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  try {
    const { date, time, tableId, userId, people, observations, menu } = req.body;

    const numPeople = parseInt(people) || 1;
    const [year, month, day] = date.split('-').map(Number);
    
    // Configuración de fecha para evitar desfases
    const searchDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    const cleanTime = time.trim().substring(0, 5); 

    // 1. VALIDACIÓN DE CONFLICTOS (Evitar doble reserva)
    const conflict = await prisma.base_booking.findFirst({
      where: {
        tableId: Number(tableId),
        date: searchDate,
        time: cleanTime,
        status: { notIn: ['CANCELADA', 'FINALIZADA'] }
      }
    });

    if (conflict) {
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

    // 2. OPERACIÓN ATÓMICA: CREAR RESERVA + ACTUALIZAR ESTADO DE MESA
    // Usamos $transaction para que ambos cambios ocurran al mismo tiempo
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Crear el registro de la reserva
      const newBooking = await tx.base_booking.create({
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

      // B. ACTUALIZAR LA MESA: Cambiar de 'available' a 'occupied'
      // Esto es lo que permite que el Dashboard reste la mesa disponible
      await tx.base_table.update({
        where: { id: parseInt(tableId) },
        data: { status: 'occupied' } 
      });

      return newBooking;
    });

    // 3. LIMPIEZA DE CACHÉ (Redis)
    try { 
      await redis.del('cache:bookings_list_v3'); 
    } catch (e) {
      console.warn("Redis no disponible, continuando...");
    }

    // 4. RESPUESTA AL FRONTEND
    return res.status(201).json({ 
      success: true, 
      message: "Reserva creada y mesa marcada como ocupada",
      data: result 
    });

  } catch (error) {
    console.error("ERROR CRÍTICO EN CREACIÓN:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error interno: " + error.message 
    });
  }
}