import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // --- OBTENER LISTADO (GET) ---
    if (req.method === 'GET') {
      const tables = await prisma.Base_table.findMany({
        orderBy: { number: 'asc' }
      });
      return res.status(200).json(tables);
    }

    // --- ACTUALIZAR MESA (PUT) ---
    if (req.method === 'PUT') {
      const { id, number, capacity, location, status, active } = req.body;
      const updated = await prisma.Base_table.update({
        where: { id: parseInt(id) },
        data: { 
          number: parseInt(number), 
          capacity: parseInt(capacity), 
          location, 
          status, 
          active: active ?? true
        }
      });
      return res.status(200).json(updated);
    }

    // --- CREAR MESA (POST) ---
    if (req.method === 'POST') {
      const { number, capacity, location } = req.body;
      const created = await prisma.Base_table.create({
        data: { 
          number: parseInt(number), 
          capacity: parseInt(capacity), 
          location, 
          status: 'available', 
          active: true 
        }
      });
      return res.status(201).json(created);
    }

    // --- ELIMINAR MESA (DELETE) ---
    if (req.method === 'DELETE') {
      // Capturamos el ID de query string o body
      const idStr = req.query.id || req.body.id;

      if (!idStr) {
        return res.status(400).json({ error: "ID de mesa requerido" });
      }

      const tableId = parseInt(idStr);

      // MÉTODO ROBUSTO: Borrado en Cascada Manual
      // 1. Primero eliminamos todas las reservas asociadas a esta mesa
      // Esto evita el error P2003 (Foreign Key Constraint)
      await prisma.Base_booking.deleteMany({
        where: { tableId: tableId }
      });

      // 2. Ahora que la mesa no tiene dependencias, la borramos
      await prisma.Base_table.delete({
        where: { id: tableId }
      });

      return res.status(200).json({ success: true, message: "Mesa y sus registros eliminados" });
    }

    return res.status(405).json({ message: 'Método no permitido' });

  } catch (error) {
    console.error("ERROR EN API TABLES:", error);
    return res.status(500).json({ 
      error: "No se pudo eliminar la mesa", 
      details: error.message 
    });
  }
}