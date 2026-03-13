import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        // Usamos Base_restaurant (con B mayúscula como en tu schema)
        const restaurant = await prisma.Base_restaurant.findUnique({
          where: { id: 1 }
        });
        
        if (!restaurant) {
          return res.status(404).json({ message: "Restaurante no configurado" });
        }
        return res.status(200).json(restaurant);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error al obtener el restaurante" });
      }

    case 'POST':
      try {
        const { name, address, phone } = req.body;

        if (!name) {
          return res.status(400).json({ error: "El nombre del restaurante es obligatorio" });
        }

        // Upsert es ideal: si no existe el ID 1 lo crea, si existe lo actualiza
        const restaurant = await prisma.Base_restaurant.upsert({
          where: { id: 1 }, 
          update: { 
            name, 
            address, 
            phone,
            active: true 
          },
          create: { 
            id: 1, 
            name, 
            address, 
            phone,
            active: true 
          }
        });

        return res.status(201).json(restaurant);
      } catch (error) {
        console.error("Error al guardar:", error);
        return res.status(500).json({ error: "Error al guardar el restaurante" });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}