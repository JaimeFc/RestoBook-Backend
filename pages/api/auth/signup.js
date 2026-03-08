import nextConnect from 'next-connect';
import auth from '@middleware/auth';
import { userHelper } from '@helper/user';
import { PrismaClient } from '@prisma/client';

const handler = nextConnect();

handler.post(async (request, response) => {
  try {
    const { dni, firstName, lastName, email, username, password, mobile } =
      request.body;

    if (!dni || !firstName || !lastName || !email || !username || !password) {
      return response
        .status(400)
        .json({ message: 'Todos los campos son requeridos' });
    }

    const name = `${firstName} ${lastName}`.toUpperCase();

    const userData = await userHelper.createUser({
      dni,
      firstName: firstName.toUpperCase(),
      lastName: lastName.toUpperCase(),
      name,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password,
      mobile,
    });

    // Asignar rol de usuario por defecto
    const prisma = new PrismaClient();
    try {
      const role = await prisma.base_role.findFirst({ where: { code: 'user' } });
      if (role) {
        await prisma.base_rolesOnUsers.create({
          data: { roleId: role.id, userId: userData.user.id, active: true },
        });
      }
    } finally {
      await prisma.$disconnect();
    }

    response.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: userData.user.id,
        username: userData.user.username,
        email: userData.user.email,
      },
    });
  } catch (error) {
    console.error('Error en signup:', error);
    response.status(500).json({
      message: error.message || 'Error al crear el usuario',
    });
  }
});

export default handler;
