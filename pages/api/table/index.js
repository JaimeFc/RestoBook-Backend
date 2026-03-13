import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query; // Para capturar el ID en DELETE o PUT

  switch (method) {
    case 'GET':
      try {
        const tables = await prisma.Base_table.findMany({
          where: { active: true },
          orderBy: { number: 'asc' }
        });
        return res.status(200).json(tables);
      } catch (error) {
        return res.status(500).json({ error: "Error al obtener las mesas" });
      }

    case 'POST':
      try {
        const { number, capacity, location, restaurantId } = req.body;

        if (!number || !capacity || !location) {
          return res.status(400).json({ error: "Número, capacidad y ubicación son obligatorios" });
        }

        const newTable = await prisma.Base_table.create({
          data: {
            number: parseInt(number), 
            capacity: parseInt(capacity),
            location: location,
            status: "available",
            active: true,
            restaurant: {
              connect: { id: restaurantId ? parseInt(restaurantId) : 1 }
            }
          }
        });

        // Enviamos el objeto creado para que el frontend confirme el éxito
        return res.status(201).json(newTable);
      } catch (error) {
        console.error("Error completo:", error);
        if (error.code === 'P2002') {
          return res.status(400).json({ error: `El número de mesa ${req.body.number} ya existe` });
        }
        if (error.code === 'P2025') {
          return res.status(400).json({ error: "El restaurante de referencia no existe." });
        }
        return res.status(500).json({ error: "Error al crear la mesa" });
      }

    case 'DELETE':
      try {
        if (!id) return res.status(400).json({ error: "ID requerido" });

        // Hacemos un "Borrado Lógico" (active: false) para no romper el historial de reservas
        await prisma.Base_table.update({
          where: { id: parseInt(id) },
          data: { active: false }
        });

        return res.status(200).json({ message: "Mesa eliminada correctamente" });
      } catch (error) {
        console.error("Error al eliminar:", error);
        return res.status(500).json({ error: "No se pudo eliminar la mesa" });
      }

    case 'PUT':
      try {
        const { number, capacity, location, status } = req.body;
        const updatedTable = await prisma.Base_table.update({
          where: { id: parseInt(id) },
          data: {
            number: number ? parseInt(number) : undefined,
            capacity: capacity ? parseInt(capacity) : undefined,
            location,
            status
          }
        });
        return res.status(200).json(updatedTable);
      } catch (error) {
        return res.status(500).json({ error: "Error al actualizar la mesa" });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PUT']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}