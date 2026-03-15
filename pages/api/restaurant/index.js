import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        // Usamos findFirst en lugar de findUnique por si el ID inicial no es exactamente 1
        const restaurant = await prisma.Base_restaurant.findFirst();
        
        if (!restaurant) {
          // Si no hay nada, enviamos un objeto vacío en lugar de un error 404 
          // para que el formulario no se rompa al cargar
          return res.status(200).json({ name: '', address: '', phone: '' });
        }
        return res.status(200).json(restaurant);
      } catch (error) {
        console.error("Error al obtener restaurante:", error);
        return res.status(500).json({ error: "Error al obtener los datos" });
      }

    case 'POST':
      try {
        const { name, address, phone } = req.body;

        if (!name) {
          return res.status(400).json({ error: "El nombre es obligatorio" });
        }

        // Buscamos el primero disponible para actualizarlo, o creamos uno nuevo
        const existing = await prisma.Base_restaurant.findFirst();
        const restaurantId = existing ? existing.id : 1;

        const restaurant = await prisma.Base_restaurant.upsert({
          where: { id: restaurantId }, 
          update: { 
            name, 
            address, 
            phone,
            active: true 
          },
          create: { 
            name, 
            address, 
            phone,
            active: true 
          }
        });

        return res.status(201).json(restaurant);
      } catch (error) {
        console.error("Error al guardar en BD:", error);
        return res.status(500).json({ error: "No se pudo guardar la configuración" });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}