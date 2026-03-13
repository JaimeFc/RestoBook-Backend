import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando siembra de datos...');

  // 1. Buscamos o creamos un usuario para la reserva
  // Asegúrate de que el ID o username no choque con uno existente
  const user = await prisma.base_user.upsert({
    where: { username: 'cliente_prueba' },
    update: {},
    create: {
      username: 'cliente_prueba',
      password: 'password123', // En producción esto debe ir encriptado
      email: 'prueba@restobook.com',
      active: true,
      Person: {
        create: {
          dni: '1234567890',
          name: 'Juan Prueba',
          firstName: 'Juan',
          lastName: 'Prueba',
          email: 'prueba@restobook.com',
        }
      }
    }
  });

  // 2. Creamos una mesa disponible
  const table = await prisma.base_table.upsert({
    where: { number: 10 },
    update: { status: 'occupied' }, // La marcamos como ocupada por la reserva
    create: {
      number: 10,
      capacity: 4,
      location: 'Terraza Principal',
      status: 'occupied',
      active: true
    }
  });

  // 3. Insertamos la Reserva de hoy
  const booking = await prisma.base_booking.create({
    data: {
      date: new Date(), // Hoy
      time: '20:00',
      people: 2,
      status: 'PENDIENTE',
      observations: 'Cerca de la ventana, es un aniversario.',
      userId: user.id,
      tableId: table.id
    }
  });

  console.log('¡Reserva de prueba creada con éxito!');
  console.log({ booking });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });