import Layout from '@ui/layout/auth/Layout';
import TextField from '@ui/common/TextField';
import Loading from '@ui/common/Loading';
import { Button } from 'antd';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { resolver } from '@validations/auth/singnin.resolver';
import { useSnackbar } from 'notistack';
import { snackbar } from '@lib/snackbar';
import { authService } from '@services/auth.service';

const Signin = () => {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver,
    defaultValues: {},
  });

  useEffect(() => {
    const load = async () => {
      try {
        const user = await authService.public.user();
        if (user) await router.replace('/');
      } catch (error) {
      } finally {
        setChecking(false);
      }
    };
    load();
  }, [router]);

  const onSubmit = async (data) => {
    if (!loading) {
      setLoading(true);
      try {
        await authService.signin({
          ...data,
        });
        router.replace('/');
      } catch (error) {
        snackbar.error(enqueueSnackbar, error);
        manageDuePassword(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const manageDuePassword = (error) => {
    if (!(typeof error === 'string')) return;
    if (error.includes('Su contraseña ha caducado'))
      router.replace('/auth/recover');
  };

  if (checking) return <></>;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Layout signin={false} signup={true}>
        <div style={{ width: '100%', maxWidth: 360, marginBottom: 16 }}>
          <TextField
            control={control}
            id="username"
            label="Usuario"
            disabled={loading}
            errors={errors.username}
          />
        </div>
        <div style={{ width: '100%', maxWidth: 450, marginBottom: 16 }}>
          <TextField
            control={control}
            id="password"
            type="password"
            label="Contraseña"
            disabled={loading}
            errors={errors.password}
          />
        </div>
        <div style={{ width: '100%', maxWidth: 450, paddingTop: 18 }}>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            style={{
              height: 44,
              fontWeight: 600,
              background: '#2d65a0',
              borderColor: '#2b6eb6',
              color: 'white',
            }}
          >
            Iniciar Sesión
          </Button>
        </div>
      </Layout>
      {loading && <Loading />}
    </form>
  );
};

export default Signin;
