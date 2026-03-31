import nextConnect from 'next-connect';
import { PrismaClient } from '@prisma/client';
import { userBookingLoader } from '../../../lib/booking-loader';
import redis from '../../../lib/redis';

const prisma = new PrismaClient();
const handler = nextConnect();

// --- MÉTODO GET: LISTAR RESERVAS ---
handler.get(async (req, res) => {
  const cacheKey = 'cache:bookings_list_v3';
  try {
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.status(200).json({ success: true, source: 'cache', data: JSON.parse(cachedData) });
      }
    } catch (e) {
      console.log("⚠️ Redis no disponible, cargando de DB");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 10; 
    const skip = (page - 1) * limit;

    const bookings = await prisma.base_booking.findMany({
      take: limit,
      skip: skip,
      orderBy: { date: 'desc' },
      include: { table: true } // Incluimos la mesa para el mapa
    });

    const results = await Promise.all(
      bookings.map(async (b) => ({
        ...b,
        user: await userBookingLoader.load(b.userId)
      }))
    );

    try {
      await redis.setex(cacheKey, 300, JSON.stringify(results));
    } catch (e) { }

    res.status(200).json({ success: true, source: 'database', data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- MÉTODO POST: CREAR RESERVA ---
handler.post(async (req, res) => {
  // Extraemos menuItems del body enviado por NewBooking.js
  const { date, time, tableId, userId, people, observations, menuItems } = req.body;

  try {
    // 1. Normalización de fecha
    const [year, month, day] = date.split('-').map(Number);
    const searchDate = new Date(year, month - 1, day, 12, 0, 0);

    // 2. Validación de Mesa Ocupada
    const conflict = await prisma.base_booking.findFirst({
      where: {
        tableId: parseInt(tableId),
        date: searchDate,
        time: time,
        status: { notIn: ['CANCELADA', 'FINALIZADA'] }
      }
    });

    if (conflict) {
      const ocupadas = await prisma.base_booking.findMany({
        where: { date: searchDate, time: time, status: { notIn: ['CANCELADA', 'FINALIZADA'] } },
        select: { tableId: true }
      });

      const ocupadasIds = ocupadas.map(b => b.tableId);
      const sugerencias = await prisma.base_table.findMany({
        where: {
          id: { notIn: ocupadasIds.length > 0 ? ocupadasIds : [-1] },
          active: true
        },
        take: 5
      });

      return res.status(409).json({
        success: false,
        message: "¡Lo sentimos! Esta mesa ya ha sido reservada.",
        suggestions: sugerencias
      });
    }

    // 3. Procesamiento del Menú
    // Convertimos el Array del formulario a String para cumplir con el esquema Prisma
    const menuString = Array.isArray(menuItems) ? menuItems.join(', ') : (menuItems || "");

    // 4. Creación en Base de Datos
    const newBooking = await prisma.base_booking.create({
      data: {
        date: searchDate,
        time: time,
        people: parseInt(people),
        observations: observations || "",
        menuItems: menuString, // Guardamos los platos aquí
        status: 'CONFIRMADA',
        user: { connect: { id: parseInt(userId) } },
        table: { connect: { id: parseInt(tableId) } }
      }
    });

    // 5. Invalida Caché de Redis para actualizar el Mapa de Mesas instantáneamente
    try {
      await redis.del('cache:bookings_list_v3');
      await redis.del('cache:tables_status'); 
      console.log("🧹 Caché de Redis limpiada");
    } catch (e) { }

    res.status(201).json({ success: true, data: newBooking });

  } catch (error) {
    console.error("Error al crear reserva:", error);
    res.status(500).json({ success: false, error: "Error interno del servidor" });
  }
});

export default handler;