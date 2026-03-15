import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const tables = await prisma.Base_table.findMany({
      orderBy: { number: 'asc' }
    });
    return res.status(200).json(tables);
  }

  if (req.method === 'PUT') {
    const { id, number, capacity, location, status, active } = req.body;
    const updated = await prisma.Base_table.update({
      where: { id: parseInt(id) },
      data: { number, capacity: parseInt(capacity), location, status, active }
    });
    return res.status(200).json(updated);
  }

  if (req.method === 'POST') {
    const { number, capacity, location } = req.body;
    const created = await prisma.Base_table.create({
      data: { number: parseInt(number), capacity: parseInt(capacity), location, status: 'available', active: true }
    });
    return res.status(201).json(created);
  }
}