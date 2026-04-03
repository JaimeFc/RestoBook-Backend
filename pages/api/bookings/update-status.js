import { PrismaClient } from '@prisma/client';
import redis from '../../../lib/redis'; // Añadimos redis

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // OBTENER MESAS (GET)
  if (req.method === 'GET') {
    const tables = await prisma.Base_table.findMany({
      where: { active: true }, // Solo mostramos las que no están "borradas"
      orderBy: { number: 'asc' }
    });
    return res.status(200).json(tables);
  }

  // EDITAR MESA (PUT)
  if (req.method === 'PUT') {
    const { id, number, capacity, location, status, active } = req.body;
    try {
      const updated = await prisma.Base_table.update({
        where: { id: parseInt(id) },
        data: { 
          number: parseInt(number), 
          capacity: parseInt(capacity), 
          location, 
          status, 
          active 
        }
      });
      // Limpiamos caché para actualizar el mapa en vivo y contadores
      try { await redis.del('cache:bookings_list_v3'); } catch (e) {}
      return res.status(200).json(updated);
    } catch (error) {
      return res.status(400).json({ error: "Error al actualizar la mesa" });
    }
  }

  // CREAR MESA (POST)
  if (req.method === 'POST') {
    const { number, capacity, location } = req.body;
    
    try {
      // 1. Validar si ya existe ese número de mesa para evitar errores
      const existing = await prisma.Base_table.findFirst({
        where: { number: parseInt(number) }
      });

      if (existing) {
        return res.status(400).json({ 
          error: `La Mesa ${number} ya existe en el sistema (puede estar inactiva).` 
        });
      }

      const created = await prisma.Base_table.create({
        data: { 
          number: parseInt(number), 
          capacity: parseInt(capacity), 
          location, 
          status: 'available', 
          active: true 
        }
      });

      // Limpiamos caché para que el contador suba (ej: de 6/6 a 7/7)
      try { await redis.del('cache:bookings_list_v3'); } catch (e) {}

      return res.status(201).json(created);
    } catch (error) {
      return res.status(500).json({ error: "No se pudo crear la mesa" });
    }
  }
}