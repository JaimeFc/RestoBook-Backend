import { getRedisClient } from '../../../lib/redis-backend';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    try {
        const client = await getRedisClient(); // <--- Aquí se activa la conexión (Hook)
        const cacheKey = 'users:full_list';

        // 1. Intentar obtener de Redis
        const cachedUsers = await client.get(cacheKey);

        if (cachedUsers) {
            console.log('✅ [PUNTO B] DATOS RECUPERADOS DE REDIS (Caché Hit)');
            return res.status(200).json({
                source: 'Redis (Caché)',
                data: JSON.parse(cachedUsers)
            });
        }

        // 2. Si no hay en Redis, buscar en PostgreSQL
        console.log('❌ [PUNTO B] DATOS RECUPERADOS DE POSTGRESQL (Caché Miss)');
        const users = await prisma.base_user.findMany();

        // 3. Guardar en Redis por 60 segundos (TTL requerido en el taller)
        await client.set(cacheKey, JSON.stringify(users), {
            EX: 60
        });

        res.status(200).json({
            source: 'PostgreSQL (Base de Datos)',
            data: users
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
