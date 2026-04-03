import nextConnect from 'next-connect';
import { PrismaClient } from '@prisma/client';
import { userBookingLoader } from '../../../lib/booking-loader';
import redis from '../../../lib/redis';

const prisma = new PrismaClient();
const handler = nextConnect();

// --- MÉTODO GET: LISTAR RESERVAS (CON FILTRO POR FECHA) ---
handler.get(async (req, res) => {
  const { date, page } = req.query; // Capturamos el parámetro 'date' enviado desde el Dashboard
  const cacheKey = `cache:bookings_list_${date || 'all'}_v3`; // Llave de caché única por fecha

  try {
    // 1. Intentar servir desde Caché (Solo si no hay un filtro específico para evitar desfases)
    if (!date) {
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          return res.status(200).json({ success: true, source: 'cache', data: JSON.parse(cachedData) });
        }
      } catch (e) {
        console.log("⚠️ Redis no disponible...");
      }
    }

    // 2. Configurar paginación
    const pageNum = parseInt(page) || 1;
    const limit = date ? 100 : 2; // Si filtramos por fecha, mostramos todas (hasta 100)
    const skip = (pageNum - 1) * limit;

    // 3. CONSTRUIR EL FILTRO DE BÚSQUEDA
    let whereClause = {};
    if (date) {
      // Si la fecha viene como "3/4/2026", la convertimos al objeto Date que entiende Prisma
      const [d, m, y] = date.split('/').map(Number);
      const searchDate = new Date(y, m - 1, d, 12, 0, 0);
      
      whereClause = {
        date: searchDate
      };
    }

    // 4. Consultar Base de Datos con el filtro
    const bookings = await prisma.base_booking.findMany({
      where: whereClause, // Aplicamos el filtro aquí
      take: limit,
      skip: skip,
      orderBy: { date: 'desc' } // Ordenar por las más recientes
    });

    // 5. Cargar relación de usuarios
    const results = await Promise.all(
      bookings.map(async (b) => ({
        ...b,
        user: await userBookingLoader.load(b.userId)
      }))
    );

    // 6. Guardar en Caché si no es una búsqueda filtrada
    if (!date) {
      try {
        await redis.setex(cacheKey, 300, JSON.stringify(results));
      } catch (e) { }
    }

    res.status(200).json({ success: true, source: 'database', data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- MÉTODO POST: (Se mantiene igual, ya está correcto) ---
handler.post(async (req, res) => {
  const { date, time, tableId, userId, people, observations } = req.body;
  try {
    const [year, month, day] = date.split('-').map(Number);
    const searchDate = new Date(year, month - 1, day, 12, 0, 0);

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
        where: { id: { notIn: ocupadasIds.length > 0 ? ocupadasIds : [-1] }, active: true },
        take: 5 
      });
      return res.status(409).json({ success: false, message: "¡Lo sentimos! Mesa ocupada.", suggestions: sugerencias });
    }

    const newBooking = await prisma.base_booking.create({
      data: {
        date: searchDate,
        time: time,
        people: parseInt(people),
        observations: observations || "",
        status: 'PENDIENTE',
        user: { connect: { id: parseInt(userId) } },
        table: { connect: { id: parseInt(tableId) } }
      }
    });

    try { await redis.del('cache:bookings_list_all_v3'); } catch (e) { }
    res.status(201).json({ success: true, data: newBooking });
  } catch (error) {
    res.status(500).json({ success: false, error: "Error interno" });
  }
});

export default handler;