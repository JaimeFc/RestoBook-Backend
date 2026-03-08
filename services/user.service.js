import { httpRequest } from '@lib/httpRequest';

const getAll = (filters) => {
  return httpRequest.get('/api/user/', filters);
};

const getById = (id) => {
  if (!id) return Promise.resolve({});
  return httpRequest.get(`/api/user/${id}`);
};

const create = (params) => {
  return httpRequest.post('/api/user', params);
};

const signup = (params) => {
  return httpRequest.post('/api/auth/signup', params);
};

const update = (id, params, record) => {
  return httpRequest.put(`/api/user/${id}`, params, record);
};

const getByDni = (dni) => {
  return httpRequest.get(`/api/person/dni/${dni}`);
};

const changePassword = (id, params) => {
  return httpRequest.put(`/api/user/password/change/${id}`, params);
};

const resetPasswordByToken = (token, params) => {
  return httpRequest.put(`/api/user/password/reset/${token}`, params);
};

const recoverPasswordByEmail = (email) => {
  return httpRequest.post(`/api/user/recover/${email}`);
};

const getByRecoverToken = (token) => {
  return httpRequest.get(`/api/user/token/${token}`);
};

const getAccess = (entityCode) => {
  let url = `/api/user/access`;
  if (entityCode) url = `${url}/${entityCode}`;
  return httpRequest.get(url);
};

const getUniquePersonByDni = (dni) => {
  return httpRequest.get(`/api/user/person/dni/${dni}`);
};

const getInstitution = () => {
  return httpRequest.get(`/api/user/institution`);
};

const deactivate = (id) => {
  return httpRequest.delete(`/api/user/${id}`);
};

const activate = (id) => {
  return httpRequest.put(`/api/user/activate/${id}`, {});
};

const roles = () => {
  return httpRequest.get('/api/user/roles/');
};

const getActive = () => {
  return httpRequest.get(`/api/user/active`);
};

const rolesBooleans = () => {
  return httpRequest.get('/api/user/roles/admin/');
};

export const userService = {
  getByDni,
  getAll,
  getUniquePersonByDni,
  getInstitution,
  getAccess,
  getById,
  create,
  update,
  changePassword,
  recoverPasswordByEmail,
  getByRecoverToken,
  resetPasswordByToken,
  deactivate,
  activate,
  roles,
  getActive,
  rolesBooleans,
  signup,
};
