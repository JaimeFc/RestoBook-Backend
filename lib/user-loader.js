import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Esta función agrupa todos los IDs y hace UNA sola consulta a Postgres
export const userLoader = new DataLoader(async (userIds) => {
  console.log(`🔍 [DATALOADER] Punto C: Consultando ${userIds.length} usuarios en una sola carga`);
  
  const users = await prisma.base_user.findMany({
    where: { id: { in: userIds } },
  });

  // Mapeamos los resultados para que coincidan con el orden de los IDs
  const userMap = {};
  users.forEach(u => userMap[u.id] = u);
  return userIds.map(id => userMap[id]);
});
