import nextConnect from 'next-connect';
import auth from '@middleware/auth';
import api from '@middleware/api';
import database from '@middleware/database';
import access from '@middleware/access';
import parser from '@middleware/parser';
import MenuData, { ESCAPE } from '@database/base/menu';

const handler = nextConnect();

handler
  .use(auth)
  .use(api)
  .use(access('menu'))
  .use(database(MenuData))
  .get((request) => {
    request.do('read', async (api, prisma) => {
      return api.successMany(await prisma.menu.getAll());
    });
  })
  .use(parser.escape(ESCAPE))
  .post((request) => {
    request.do('create', async (api, prisma) => {
      return api.success(await prisma.menu.create(request.body));
    });
  });

export default handler;