// logic/userLogic.js
import { getRedisClient } from '../lib/redis-backend';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllUsersOptimized = async () => {
    const client = await getRedisClient(); // <--- Aquí se activa la conexión (Hook)
    const cacheKey = 'users:list';

    // Intentamos recuperar de la caché
    const cached = await client.get(cacheKey);
    if (cached) {
        console.log('⚡ [REDIS] Datos obtenidos de la caché');
        return JSON.parse(cached);
    }

    // Si no hay caché, vamos a la DB
    const users = await prisma.base_user.findMany();
    
    // Guardamos en Redis por 1 minuto
    await client.set(cacheKey, JSON.stringify(users), { EX: 60 });
    
    return users;
};