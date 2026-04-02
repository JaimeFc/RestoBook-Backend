import nextConnect from 'next-connect';
import api from '@middleware/api';
import database from '@middleware/database';
import FoodData from '@database/base/food'; 

const handler = nextConnect();

handler
  .use(api)
  .use(database(FoodData))
  .get((request) => {
    request.do('read', async (api, prisma) => {
      // Ahora prisma.menuItem.getAll() funcionará sin errores de DEFAULT
      const items = await prisma.menuItem.getAll();
      return api.successMany(items);
    });
  });

export default handler;