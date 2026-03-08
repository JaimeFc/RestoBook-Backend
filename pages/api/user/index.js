import nextConnect from 'next-connect';
import auth from '@middleware/auth';
import api from '@middleware/api';
import database from '@middleware/database';
import access from '@middleware/access';
import parser from '@middleware/parser';
import UserData, { ESCAPE } from '@database/base/user';
import PersonData from '@database/base/person';
import { pick } from 'lodash';
import { randomBytes } from 'crypto';
import { hash } from '@lib/hash';

// --- NUEVAS IMPORTACIONES PARA EL TALLER ---
import { getRedisClient } from '../../../lib/redis-backend'; 
import { mailQueue } from '../../../lib/mail-queue';     // La cola que creamos
// -------------------------------------------

const parseName = (firstName, lastName) => {
  return [firstName, lastName].filter(Boolean).join(' ').trim();
};

const resolveEmail = (data) => {
  if (data.email) return data.email.toLowerCase();
  if (data.personalEmail) return data.personalEmail.toLowerCase();
  if (data.username?.includes('@')) return data.username.toLowerCase();
  return `${data.username?.toLowerCase() || 'user'}@local`;
};

const checkDni = (shouldCheck, dni) => {
  if (shouldCheck && !dni) {
    throw new Error('Debe ingresar el DNI');
  }
};

const normalizeRoleIds = (roles) => {
  if (!Array.isArray(roles)) return null;
  return roles
    .map((role) => {
      if (typeof role === 'number') return role;
      return role?.roleId || role?.id;
    })
    .filter(Boolean);
};

const parseRoles = (roles) => {
  if (!Array.isArray(roles)) return undefined;
  const roleIds = normalizeRoleIds(roles);
  return {
    create: roleIds.map((roleId) => ({ roleId, active: true })),
  };
};

const parseData = (data, email) => {
  const now = new Date();
  return {
    ...data,
    email,
    username: data.username?.toLowerCase(),
    name: parseName(data.firstName, data.lastName),
    firstName: data.firstName?.toUpperCase(),
    lastName: data.lastName?.toUpperCase(),
    personalEmail: data.personalEmail?.toLowerCase(),
    password: hash.create(data.password || randomBytes(20).toString('hex')),
    createdDate: now,
    modifiedDate: now,
  };
};

const upsertPerson = async (prisma, data) => {
  return await prisma.person.where({ dni: data.dni }).upsert({
    ...pick(data, ['dni', 'mobile', 'name', 'firstName', 'lastName']),
    email: data.personalEmail,
  });
};

const upsertUser = async (prisma, data, person, email, userId) => {
  const userData = {
    ...pick(data, [
      'modifiedDate',
      'password',
      'email',
      'accountTypeId',
    ]),
    username: email,
    personId: person.id,
  };

  let user;
  if (userId) {
    user = await prisma.user.record(userId).update(userData);
    await prisma.base_rolesOnUsers.where({ userId }).update({ active: false });
    const roleIds = normalizeRoleIds(data.roles);
    if (roleIds && roleIds.length > 0) {
      await prisma.base_rolesOnUsers.createMany({
        data: roleIds.map(roleId => ({ roleId, userId, active: true })),
      });
    }
  } else {
    user = await prisma.user.create({
      ...userData,
      ...pick(data, ['createdDate']),
      roles: parseRoles(data.roles),
    });
  }
  return user;
};

const handler = nextConnect();

handler
  .use(auth)
  .use(api)
  .use(access('user'))
  .use(database(UserData))
  .get(async (request) => {
    // --- PUNTO B: CACHÉ CON REDIS ---
    const redis = await getRedisClient();
    const cacheKey = 'users:all_list';
    
    const cachedUsers = await redis.get(cacheKey);
    if (cachedUsers) {
      console.log('⚡ [REDIS] PUNTO B: Sirviendo lista desde caché');
      return request.api.successMany(JSON.parse(cachedUsers));
    }

    await request.do('read', async (api, prisma) => {
      const db = prisma.user;
      const where = {};
      if (request.user.id !== 1) where.NOT = { id: 1 };
      db.where(where);
      const users = await db.getAll();
      
      // Guardamos en caché por 60 segundos
      await redis.set(cacheKey, JSON.stringify(users), { EX: 60 });
      console.log('📦 [POSTGRES] PUNTO B: Guardando nueva caché en Redis');
      
      return api.successMany(users);
    });
  })
  .use(database(PersonData))
  .use(parser.escape(ESCAPE))
  .post(async (request) => {
    await request.do(
      'create',
      async (api, prisma) => {
        let data = request.body;
        const email = resolveEmail(data);
        checkDni(data.checkDni, data.dni);
        data = parseData(data, email);
        const person = await upsertPerson(prisma, data);
        const user = await upsertUser(prisma, data, person, email);

        // --- PUNTO D: BULLMQ (TAREA EN SEGUNDO PLANO) ---
        await mailQueue.add('welcomeEmail', {
          email: user.email,
          username: user.username
        });
        console.log('👷 [BULLMQ] PUNTO D: Tarea de correo encolada');
        
        // Limpiamos la caché porque hay un usuario nuevo
        const redis = await getRedisClient();
        await redis.del('users:all_list');

        return api.success(user);
      },
      { transaction: true },
    );
  })
  .put((request) => {
    request.do(
      'write',
      async (api, prisma) => {
        const userId = request.query.id;
        let data = request.body;
        const email = resolveEmail(data);
        data = parseData(data, email);
        const person = await upsertPerson(prisma, data);
        const user = await upsertUser(prisma, data, person, email, userId);
        
        // Limpiamos caché al actualizar
        getRedisClient().then(client => client.del('users:all_list'));

        return api.success(user);
      },
      { transaction: true },
    );
  });

export default handler;