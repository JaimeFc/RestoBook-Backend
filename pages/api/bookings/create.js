import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { date, time, people, observations, userId, tableId } = req.body;

    if (!tableId) {
      return res.status(400).json({ error: 'Debes seleccionar una mesa válida.' });
    }

    // --- SOLUCIÓN AL DESFASE DE FECHA ---
    // Si 'date' llega como "2026-03-14", lo separamos para crear la fecha localmente
    const [year, month, day] = date.split('-').map(Number);
    
    // Creamos la fecha usando el constructor local (año, mes indexado en 0, día)
    // Seteamos las 12:00:00 para evitar cualquier salto de día por zona horaria
    const localDate = new Date(year, month - 1, day, 12, 0, 0);

    // 2. Crear la reserva en el modelo Base_booking
    const newBooking = await prisma.Base_booking.create({
      data: {
        date: localDate, // Usamos la fecha normalizada
        time: time,
        people: parseInt(people),
        observations: observations || "",
        status: 'PENDIENTE',
        user: { connect: { id: parseInt(userId) } },
        table: { connect: { id: parseInt(tableId) } }
      },
    });

    res.status(200).json(newBooking);
  } catch (error) {
    console.error("DETALLE DEL ERROR:", error);
    res.status(500).json({ 
      error: 'Error al crear la reserva', 
      details: error.message 
    });
  }
}