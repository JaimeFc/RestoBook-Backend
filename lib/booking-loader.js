import DataLoader from 'dataloader';
import UserData from '@database/base/user';

export const userBookingLoader = new DataLoader(async (userIds) => {
  // Este log es vital para demostrar el Punto C en la terminal
  console.log(`📦 [DATALOADER] Punto C: Batching de ${userIds.length} usuarios para reservas`);
  
  // SELECT * FROM Base_user WHERE id IN (1, 2)
  const users = await UserData.where({ id: { in: userIds } }).getAll();

  const userMap = {};
  users.forEach(user => { userMap[user.id] = user; });
  
  return userIds.map(id => userMap[id] || null);
});