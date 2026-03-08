import { Row, Col, Button } from 'antd';
import TextField from '@ui/common/TextField';
import Select from '@ui/common/Select';
import Title from '@ui/common/Title';
import Paper from '@ui/common/Paper';
import Loading from '@ui/common/Loading';
import Switch from '@ui/common/Switch';
import { useState, useEffect, useCallback } from 'react';
import { deburr, trim } from 'lodash';
import { useSnackbar } from 'notistack';
import { snackbar } from '@lib/snackbar';
import { useForm, useWatch, useFormState } from 'react-hook-form';
import { resolver } from '@validations/user.resolver';
import { userService } from '@services/user.service';
import { useRouter } from 'next/router';
import { form } from '@lib/form';
import { page } from '@lib/page';
import { roleService } from '@services/role.service';
import { validateDni } from '@helper/dni';

const defaultValues = (record) => {
  return {
    dni: record.Person?.dni || '',
    firstName: record.Person?.firstName || '',
    lastName: record.Person?.lastName || '',
    name: record.Person?.name || '',
    username: record.username || '',
    email: record.email || '',
    personalEmail: record.Person?.email || '',
    mobile: record.Person?.mobile || '',
    roles:
      record.roles?.filter((item) => item.active).map((item) => item.roleId) ||
      [],
  };
};

const UserForm = ({ record }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [person, setPerson] = useState(record.Person || {});
  const [personFound, setPersonFound] = useState(!!record.id);
  const [isDni, setIsDni] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  const { handleSubmit, reset, control, setValue } = useForm({
    resolver,
    defaultValues: defaultValues(record),
  });
  const { errors, isDirty, dirtyFields, isValid } = useFormState({
    control,
  });

  const firstName = useWatch({ control, name: 'firstName', defaultValue: '' });
  const lastName = useWatch({ control, name: 'lastName', defaultValue: '' });
  const dni = useWatch({ control, name: 'dni', defaultValue: '' });

  useEffect(() => {
    page.loader(
      enqueueSnackbar,
      async () => {
        setValue('checkDni', true, { shouldDirty: true });
        setLoading(true);
      },
      () => setLoading(false),
    );
  }, [enqueueSnackbar, setValue]);

  const findPerson = (event) => {
    if (loading) return;
    const dni = event?.target?.value;
    if (!dni) return;
    page.loader(
      enqueueSnackbar,
      async () => {
        if (isDni && !validateDni(dni)) throw 'Cédula no válida';
        setLoading(true);
        setPersonFound(false);
        const person = await userService.getUniquePersonByDni(dni);
        setPersonFound(true);
        if (person.id) {
          setValue('firstName', person.firstName || '', { shouldDirty: true });
          setValue('lastName', person.lastName || '', { shouldDirty: true });
          setValue('name', person.name || '', { shouldDirty: true });
          setPerson(person);
        }
      },
      () => setLoading(false),
      () => setValue('dni', '', { shouldDirty: true }),
    );
  };

  const setUsername = useCallback(() => {
    const _firstName = firstName || person?.firstName || '';
    const _lastName = lastName || person?.lastName || '';
    if (!(_firstName && _lastName)) return;
    let [name, secondName] = _firstName?.split(' ') || [];
    let [surname, secondSurName] = _lastName?.split(' ') || [];
    const first = name?.slice(0, 1) || '';
    const second = secondName?.slice(0, 1) || '';
    const third = secondSurName?.slice(0, 1) || '';
    let username = `${first}${second}.${surname}${third}`;
    username = deburr(username).toLowerCase();
    setValue('username', username, { shouldDirty: true });
  }, [firstName, lastName, person, setValue]);

  const setName = useCallback(() => {
    const first = firstName?.toUpperCase() || person?.firstName || '';
    const last = lastName?.toUpperCase() || person?.lastName || '';
    if (!(first && last)) return;
    const name = trim(`${first} ${last}`);
    setValue('name', name);
    setValue('displayName', name, { shouldDirty: true });
  }, [firstName, lastName, person, setValue]);

  useEffect(() => {
    setName();
    setUsername();
  }, [person, setName, setUsername]);

  const onChangeName = () => {
    setName();
    setUsername();
  };

  const onChangeCheckDni = (event) => {
    setIsDni(event.target.checked);
    if (!event.target.checked) return;
    if (!dni) return;
    if (!validateDni(dni)) {
      setValue('dni', '', { shouldDirty: true });
      snackbar.error(enqueueSnackbar, 'Cédula no válida');
    }
  };

  const onSubmit = async (data) => {
    if (loading) return;
    console.log('onSubmit data:', data);
    console.log('isValid:', isValid);
    console.log('errors:', errors);
    try {
      form.submit({
        recordId: record.id,
        data,
        service: userService,
        router,
        dirtyFields,
        enqueueSnackbar,
        reset,
        setLoading,
        defaultHandler: defaultValues,
      });
    } catch (error) {
      console.error('Error in onSubmit:', error);
      snackbar.error(enqueueSnackbar, error);
    }
  };

  return (
    <>
      {console.log('UserForm render, loading:', loading, 'errors:', errors)}
      {loading && <Loading />}
      <form>
        <Paper>
          <Row gutter={[8, 8]}>
            <Col xs={24} sm={18} md={18} lg={20} xl={20}>
              <Title title="Datos del Usuario" />
            </Col>
            <Col
              xs={24}
              sm={6}
              md={6}
              lg={4}
              xl={4}
              style={{ display: 'flex', justifyContent: 'flex-end' }}
            >
              {!record.id && (
                <Switch
                  id="checkDni"
                  control={control}
                  label="Validar cédula"
                  checked={isDni}
                  justifyContent="flex-end"
                  onChange={onChangeCheckDni}
                />
              )}
            </Col>
          </Row>
          <Row gutter={[8, 8]}>
            <Col xs={24} sm={12} md={12} lg={6} xl={6}>
              <TextField
                control={control}
                id="dni"
                label="Cédula/Pasaporte/Código"
                disabled={loading || !!record.id}
                errors={errors.dni}
                onBlur={findPerson}
              />
            </Col>
            <Col xs={24} sm={12} md={12} lg={6} xl={6}>
              <TextField
                control={control}
                id="firstName"
                label="Nombres"
                disabled={loading || !!person.id || !personFound}
                errors={errors.firstName}
                onBlur={onChangeName}
              />
            </Col>
            <Col xs={24} sm={12} md={12} lg={6} xl={6}>
              <TextField
                control={control}
                id="lastName"
                label="Apellidos"
                disabled={loading || !!person.id || !personFound}
                errors={errors.lastName}
                onBlur={onChangeName}
              />
            </Col>
            <Col xs={24} sm={12} md={12} lg={6} xl={6}>
              <TextField
                control={control}
                id="name"
                label="Nombre completo"
                disabled={true}
                errors={errors.name}
                shrink={true}
              />
            </Col>
            <Col xs={24} sm={12} md={12} lg={6} xl={6}>
              <TextField
                control={control}
                id="username"
                label="Nombre de usuario"
                disabled={loading || !!person.id || !personFound}
                errors={errors.username}
                shrink={true}
              />
            </Col>
            <Col xs={24} sm={12} md={12} lg={6} xl={6}>
              <TextField
                control={control}
                id="email"
                label="Correo electrónico"
                disabled={loading || !personFound}
                errors={errors.email}
              />
            </Col>
            <Col xs={24} sm={12} md={12} lg={6} xl={6}>
              <TextField
                control={control}
                id="personalEmail"
                label="Correo personal"
                disabled={loading || !personFound}
                errors={errors.personalEmail}
              />
            </Col>
            <Col xs={24} sm={12} md={12} lg={6} xl={6}>
              <TextField
                control={control}
                id="mobile"
                label="Celular"
                disabled={loading || !personFound}
                errors={errors.mobile}
              />
            </Col>
            <Col xs={24} sm={24} md={24} lg={12} xl={12}>
              <Select
                control={control}
                id="roles"
                label="Roles"
                url="/base/config/roles"
                disabled={loading || !personFound}
                errors={errors.roles}
                service={roleService}
                multiple={true}
              />
            </Col>
          </Row>
        </Paper>
        <Row gutter={[8, 8]} justify="end" style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={8} lg={6} xl={6}>
            <Button
              type="primary"
              block
              disabled={false}
              onClick={() => { console.log('handleSubmit called'); handleSubmit(onSubmit)(); }}
            >
              Guardar
            </Button>
          </Col>
        </Row>
      </form>
    </>
  );
};

export default UserForm;
