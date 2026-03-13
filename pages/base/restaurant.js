import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Space, message, Spin } from 'antd';
import { ShopOutlined, SaveOutlined, GlobalOutlined, PhoneOutlined } from '@ant-design/icons';
import Dashboard from '@ui/layout/Dashboard';

const { Title, Text } = Typography;

const RestaurantConfig = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // 1. Cargar datos actuales
  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        const res = await fetch('/api/restaurant');
        if (res.ok) {
          const data = await res.json();
          if (data) {
            form.setFieldsValue({
              name: data.name,
              address: data.address,
              phone: data.phone
            });
          }
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        message.error('No se pudo cargar la configuración actual.');
      } finally {
        setFetching(false);
      }
    };
    loadRestaurant();
  }, [form]);

  // 2. Guardar cambios (Corregido para asegurar el mensaje)
  const onFinish = async (values) => {
    setLoading(true);
    // Usamos una 'key' única para que el mensaje de carga se transforme en el de éxito
    const msgKey = 'updatable';
    message.loading({ content: 'Guardando configuración...', key: msgKey });

    try {
      const res = await fetch('/api/restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await res.json();

      if (res.ok) {
        // Actualizamos el mismo mensaje (esto garantiza que se vea)
        message.success({ 
          content: '¡Configuración de RestoBook actualizada con éxito!', 
          key: msgKey, 
          duration: 3 
        });
      } else {
        message.error({ 
          content: result.error || 'Hubo un error al guardar.', 
          key: msgKey, 
          duration: 3 
        });
      }
    } catch (error) {
      message.error({ 
        content: 'Error de conexión con el servidor.', 
        key: msgKey, 
        duration: 3 
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Cargando configuración..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}><ShopOutlined /> Configuración del Establecimiento</Title>
          <Text type="secondary">Define el nombre y datos de contacto que aparecerán en el sistema y comprobantes.</Text>
        </div>

        <Card 
          bordered={false} 
          style={{ 
            borderRadius: 24, 
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)', 
            borderTop: '6px solid #8b4513' 
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item
              label="Nombre del Restaurante"
              name="name"
              rules={[{ required: true, message: 'Por favor ingresa el nombre comercial' }]}
            >
              <Input prefix={<GlobalOutlined />} placeholder="Ej: Resto Book" size="large" />
            </Form.Item>

            <Form.Item label="Dirección Física" name="address">
              <Input prefix={<ShopOutlined />} placeholder="Barrio 25 de Diciembre" size="large" />
            </Form.Item>

            <Form.Item label="Teléfono de Reservas" name="phone">
              <Input prefix={<PhoneOutlined />} placeholder="+593 ..." size="large" />
            </Form.Item>

            <Form.Item style={{ marginTop: 24 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />} 
                loading={loading}
                block
                size="large"
                style={{ 
                  background: '#8b4513', 
                  borderColor: '#8b4513', 
                  borderRadius: 12,
                  height: '50px',
                  fontWeight: 'bold'
                }}
              >
                GUARDAR CONFIGURACIÓN
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </div>
  );
};

RestaurantConfig.Layout = Dashboard;
export default RestaurantConfig;