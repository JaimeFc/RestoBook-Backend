const DEFAULT = {
  id: true,
  name: true,
  displayName: true,
  description: true,
  icon: true,
  priority: true,
  header: true,
  pageId: true,
  moduleId: true,
  dashboard: true,
  active: true,
  menuId: true,
  Page: { select: { id: true, name: true, url: true } },
  Module: { select: { id: true, name: true } },
  Menu: { select: { name: true } },
  menus: { select: { id: true, name: true } },
};

const TREE = {
  ...DEFAULT,
  pageId: false,
  moduleId: false,
  Module: false,
  Menu: false,
  active: false,
  Page: { select: { url: true } },
  menus: { select: { id: true } },
};

const schemas = { DEFAULT, TREE };
export default schemas;