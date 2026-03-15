import { useState, useEffect } from 'react';
import { Form, Input, DatePicker, TimePicker, InputNumber, Button, Card, message, Select, Typography, Spin } from 'antd';
import { CalendarOutlined, TeamOutlined, CoffeeOutlined, ShopOutlined } from '@ant-design/icons';
import Dashboard from '@ui/layout/Dashboard';
import { authService } from '@services/auth.service';
import { useRouter } from 'next/router';

const { Title, Text } = Typography;
const { Option } = Select;

const NewBooking = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingTables, setFetchingTables] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    authService.user().then(setUser);
  }, []);

  // Función para obtener mesas disponibles basadas en fecha y hora
  const fetchAvailableTables = async () => {
    const values = form.getFieldsValue(['date', 'time']);
    
    if (!values.date || !values.time) {
      return message.warning('Por favor, selecciona primero la fecha y la hora para ver mesas disponibles.');
    }

    setFetchingTables(true);
    try {
      const d = values.date.format('YYYY-MM-DD');
      const t = values.time.format('HH:mm');
      
      const res = await fetch(`/api/bookings/available-tables?date=${d}&time=${t}`);
      const data = await res.json();
      
      if (res.ok) {
        setAvailableTables(data);
        if (data.length === 0) message.info('No hay mesas disponibles para ese horario.');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      message.error('Error al cargar mesas: ' + error.message);
    } finally {
      setFetchingTables(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        time: values.time.format('HH:mm'),
        userId: user.id,
      };

      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        message.success('¡Reserva solicitada con éxito!');
        router.push('/base/bookings');
      } else {
        const errorData = await res.json();
        message.error(errorData.details || 'Error al crear la reserva');
      }
    } catch (error) {
      message.error('Hubo un error al procesar tu reserva.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
      <Card 
        style={{ borderRadius: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
        title={<Title level={3}><CalendarOutlined /> Nueva Reserva</Title>}
      >
        <Text type="secondary">Completa los datos para asegurar tu mesa en RestoBook Gourmet.</Text>
        <br /><br />
        
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="Fecha" name="date" rules={[{ required: true, message: 'Elige un día' }]}>
            <DatePicker 
              style={{ width: '100%' }} 
              placeholder="¿Cuándo vendrás?" 
              onChange={() => { form.setFieldsValue({ tableId: undefined }); setAvailableTables([]); }}
            />
          </Form.Item>

          <Form.Item label="Hora" name="time" rules={[{ required: true, message: 'Elige una hora' }]}>
            <TimePicker 
              style={{ width: '100%' }} 
              format="HH:mm" 
              placeholder="Hora de llegada"
              onChange={() => { form.setFieldsValue({ tableId: undefined }); setAvailableTables([]); }}
            />
          </Form.Item>

          <Form.Item label="Selecciona tu Mesa" name="tableId" rules={[{ required: true, message: 'Por favor selecciona una mesa' }]}>
            <Select 
              placeholder="Click para ver mesas disponibles" 
              onFocus={fetchAvailableTables}
              loading={fetchingTables}
              suffixIcon={<ShopOutlined />}
            >
              {availableTables.map(table => (
                <Option key={table.id} value={table.id}>
                  Mesa {table.number} - {table.location} (Cap: {table.capacity})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Número de Personas" name="people" rules={[{ required: true }]}>
            <InputNumber min={1} max={10} style={{ width: '100%' }} prefix={<TeamOutlined />} />
          </Form.Item>

          <Form.Item label="Observaciones Especiales" name="observations">
            <Input.TextArea placeholder="Ej: Alergias, silla para bebé, es un cumpleaños..." rows={3} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{ background: '#d2691e', borderColor: '#d2691e', borderRadius: 8 }}>
              Confirmar Solicitud de Reserva
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

NewBooking.Layout = Dashboard;
export default NewBooking;