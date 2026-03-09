// lib/booking-loader.js
import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const userBookingLoader = new DataLoader(async (userIds) => {
  // ESTA ES LA LÍNEA CLAVE PARA TU CAPTURA:
  console.log(`📦 [DATALOADER] Punto C: Batching de ${userIds.length} usuarios para reservas`);

  const users = await prisma.base_user.findMany({
    where: {
      id: { in: userIds },
    },
  });

  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});

  return userIds.map((id) => userMap[id] || null);
});