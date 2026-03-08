import nextConnect from 'next-connect';
import auth from '@middleware/auth';
import api from '@middleware/api';
import database from '@middleware/database';
import schemas from '@database/base/menu/schemas';
import MenuData from '@database/base/menu';

const handler = nextConnect();

handler
  .use(auth)
  .use(api)
  .use(database(MenuData))
  .get((request) => {
    request.do('read', async (api, prisma) => {
      const where = {
        Menu: { code: request.query?.parent },
      };
      return api.successMany(
        await prisma.menu
          .select(schemas.TREE)
          .where(where)
          .orderBy({ priority: 'asc' })
          .getAll(),
      );
    });
  });

export default handler;
