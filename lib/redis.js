import { createClient } from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) return new Error('Redis se dio por vencido');
            return Math.min(retries * 100, 3000); // Reintenta cada vez más lento
        }
    }
});

redisClient.on('error', (err) => {
    // Solo loguear si no es un error de conexión repetitivo
    if (err.code !== 'ECONNREFUSED') console.log('❌ Redis Error:', err);
});

export const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
            console.log('🚀 Redis Conectado correctamente');
        }
    } catch (err) {
        console.error('No se pudo conectar a Redis. Trabajando sin caché...');
    }
};

export default redisClient;