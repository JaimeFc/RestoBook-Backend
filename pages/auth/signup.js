import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Row, Col } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import { userService } from '@services/user.service';
import { useRouter } from 'next/router';
import AuthLayout from '@ui/layout/auth/Layout';

const { Title } = Typography;

const SignupPage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await userService.signup(values);
      message.success('Usuario registrado exitosamente');
      router.push('/auth/signin');
    } catch (error) {
      message.error(
        error.response?.data?.message || 'Error al registrar usuario',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
      <Col xs={24} sm={18} md={12} lg={8} xl={24}>
        <Card bodyStyle={{ padding: '40px' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
            Registro de Usuario
          </Title>
          <Form
            form={form}
            name="signup"
            onFinish={onFinish}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              name="dni"
              label="Cédula"
              rules={[
                { required: true, message: 'Por favor ingrese su cédula' },
                {
                  min: 10,
                  max: 13,
                  message: 'La cédula debe tener entre 10 y 13 caracteres',
                },
              ]}
            >
              <Input prefix={<IdcardOutlined />} placeholder="1234567890" />
            </Form.Item>

            <Form.Item
              name="firstName"
              label="Nombres"
              rules={[
                { required: true, message: 'Por favor ingrese sus nombres' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Juan Carlos" />
            </Form.Item>

            <Form.Item
              name="lastName"
              label="Apellidos"
              rules={[
                { required: true, message: 'Por favor ingrese sus apellidos' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Pérez García" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Correo Electrónico"
              rules={[
                { required: true, message: 'Por favor ingrese su correo' },
                { type: 'email', message: 'Ingrese un correo válido' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="usuario@ejemplo.com"
              />
            </Form.Item>

            <Form.Item
              name="username"
              label="Usuario"
              rules={[
                { required: true, message: 'Por favor ingrese un usuario' },
                {
                  min: 3,
                  max: 20,
                  message: 'El usuario debe tener entre 3 y 20 caracteres',
                },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="usuario123" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Contraseña"
              rules={[
                { required: true, message: 'Por favor ingrese una contraseña' },
                {
                  min: 8,
                  message: 'La contraseña debe tener al menos 8 caracteres',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="********"
              />
            </Form.Item>

            <Form.Item
              name="mobile"
              label="Teléfono"
              rules={[
                { required: true, message: 'Por favor ingrese su teléfono' },
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="0987654321" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                style={{ color: 'white' }}
              >
                Registrarse
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              ¿Ya tienes cuenta?{' '}
              <a onClick={() => router.push('/auth/signin')}>Inicia sesión</a>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

SignupPage.Layout = AuthLayout;

export default SignupPage;
