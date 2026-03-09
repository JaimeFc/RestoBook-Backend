import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default {
  name: 'booking',
  model: prisma.base_booking,
  // Agrega aquí los métodos que necesites
};