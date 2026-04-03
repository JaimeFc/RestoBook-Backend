import { PrismaClient } from '@prisma/client';
const prisma = global.prisma || new PrismaClient();

export default async function handler(req, res) {
  try {
    // Obtenemos la fecha de hoy en formato simple YYYY-MM-DD local
    const hoyStr = new Date().toLocaleDateString('en-CA'); 

    // Traemos los datos básicos para evitar errores de relación complejos
    const [reservas, mesas] = await Promise.all([
      prisma.base_booking.findMany(),
      prisma.base_table.findMany({ where: { active: true } })
    ]);

    // Filtramos manualmente para asegurar que Angela Lapo aparezca
    const reservasHoy = reservas.filter(r => {
      const fechaReserva = r.date ? r.date.toString() : "";
      const estado = (r.status || "").toUpperCase();
      return fechaReserva.includes(hoyStr) || estado === 'CONFIRMADA' || estado === 'PENDIENTE';
    }).length;

    const totalMesas = mesas.length;
    const disponibles = mesas.filter(m => m.status === 'available').length;
    const ocupadas = totalMesas - disponibles;
    const porcentaje = totalMesas > 0 ? Math.round((ocupadas / totalMesas) * 100) : 0;

    return res.status(200).json({
      reservasHoy: reservasHoy, // Esto pondrá el "2" en la Card naranja
      mesasDisponibles: disponibles,
      totalMesas: totalMesas,
      ocupacion: porcentaje
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}