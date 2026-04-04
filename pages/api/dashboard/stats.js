import { PrismaClient } from '@prisma/client';
const prisma = global.prisma || new PrismaClient();

export default async function handler(req, res) {
  try {
    // 1. Configuración de fecha para evitar desfases de zona horaria
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    
    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);

    console.log("--- INICIO DE CONSULTA DE STATS ---");
    console.log("Rango buscado:", inicioHoy.toISOString(), "a", finHoy.toISOString());

    // 2. Consulta a la base de datos
    const [reservas, mesas] = await Promise.all([
      prisma.base_booking.findMany({
        where: {
          date: {
            gte: inicioHoy,
            lte: finHoy
          }
        }
      }),
      prisma.base_table.findMany({ where: { active: true } })
    ]);

    // 3. Filtrado por estado
    const reservasActivasHoy = reservas.filter(r => {
      const estado = (r.status || "").toUpperCase().trim();
      return ['CONFIRMADA', 'PENDIENTE', 'OCUPADA'].includes(estado);
    });

    const reservasHoyCount = reservasActivasHoy.length;

    // 4. Cálculo de mesas (basado en tu mapa visual de 6 o 7 mesas)
    const totalMesas = mesas.length;
    
    // Mesas disponibles (color verde en el mapa)
    const disponibles = mesas.filter(m => m.status === 'available').length;
    
    // Ocupación física real (mesas en rojo en el mapa)
    const ocupadasReal = mesas.filter(m => 
      ['occupied', 'busy', 'OCUPADA'].includes(m.status)
    ).length;

    // Porcentaje de ocupación (Límite máximo 100%)
    const porcentaje = totalMesas > 0 
      ? Math.min(Math.round((ocupadasReal / totalMesas) * 100), 100) 
      : 0;

    const respuestaFinal = {
      reservasHoy: reservasHoyCount, // Debería ser ~2 según tu mapa
      mesasDisponibles: disponibles,
      totalMesas: totalMesas,
      ocupacion: porcentaje 
    };

    // LOGS CRÍTICOS: Revisa tu terminal de VS Code al cargar la página
    console.log("Total reservas encontradas en DB para hoy:", reservas.length);
    console.log("Reservas filtradas (activas):", reservasHoyCount);
    console.log("Mesas Ocupadas detectadas:", ocupadasReal);
    console.log("Enviando al frontend:", respuestaFinal);

    return res.status(200).json(respuestaFinal);

  } catch (error) {
    console.error("ERROR CRÍTICO EN STATS:", error);
    return res.status(500).json({ error: error.message });
  }
}