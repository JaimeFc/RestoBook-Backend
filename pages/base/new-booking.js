import { useState, useEffect } from 'react';
import {
  Form, Input, DatePicker, TimePicker, InputNumber,
  Button, Card, message, Select, Typography,
  Tag, Divider, App
} from 'antd';
import { CalendarOutlined, TeamOutlined, ShopOutlined, ForkOutlined } from '@ant-design/icons';
import Dashboard from '@ui/layout/Dashboard';
import { authService } from '@services/auth.service';
import { useRouter } from 'next/router';

const { Title, Text } = Typography;
const { Option } = Select;

const menuOptions = [
  { id: 1, name: 'Menú Ejecutivo (Sopa + Plato Fuerte)', price: 15.00 },
  { id: 2, name: 'Ceviche Especial de la Casa', price: 18.50 },
  { id: 3, name: 'Parrillada Mixta (2 personas)', price: 25.00 },
  { id: 4, name: 'Lasaña Boloñesa Tradicional', price: 14.00 }
];

const NewBookingContent = () => {
  const [form] = Form.useForm();
  const { modal: modalHook } = App.useApp(); 
  const [loading, setLoading] = useState(false);
  const [fetchingTables, setFetchingTables] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    authService.user().then(setUser);
  }, []);

  const fetchAvailableTables = async () => {
    const values = form.getFieldsValue(['date', 'time']);
    if (!values.date || !values.time) {
      return message.warning('Por favor, selecciona primero la fecha y la hora.');
    }
    setFetchingTables(true);
    try {
      const d = values.date.format('YYYY-MM-DD');
      const t = values.time.format('HH:mm');
      const res = await fetch(`/api/bookings/available-tables?date=${d}&time=${t}`);
      const data = await res.json();
      if (res.ok) {
        setAvailableTables(data);
      }
    } catch (error) {
      message.error('Error al cargar mesas.');
    } finally {
      setFetchingTables(false);
    }
  };

  // --- FUNCIÓN ONFINISH CORREGIDA PARA ASEGURAR EL MENÚ ---
  const onFinish = async (values) => {
    if (!user?.id) return message.error("Inicia sesión de nuevo.");
    
    if (!values.menuItems || values.menuItems.length < 2) {
      return message.error("Debe seleccionar al menos dos platos para confirmar la reserva.");
    }

    setLoading(true);

    try {
      // Formateamos los platos como texto para el respaldo en observaciones
      const menuTexto = values.menuItems.join(', ');

      const payload = {
        date: values.date.format('YYYY-MM-DD'),
        time: values.time.format('HH:mm'),
        tableId: values.tableId,
        people: values.people,
        menuItems: values.menuItems, // Envío normal (Array)
        // RESPALDO: Insertamos el menú al inicio de las notas del cliente
        observations: `PLATOS SELECCIONADOS: ${menuTexto}. ${values.observations || ""}`,
        userId: user.id,
      };

      console.log("Enviando reserva con menú:", payload);

      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        setLoading(false); 
        const data = await res.json().catch(() => ({}));
        const idsSugeridos = new Set((data.suggestions || []).map(s => s.id));
        const mesasFinales = [...(data.suggestions || [])];

        availableTables.forEach(mesa => {
          if (!idsSugeridos.has(mesa.id) && mesa.id !== values.tableId) {
            mesasFinales.push(mesa);
          }
        });

        const warningModal = modalHook.warning({ 
          title: 'Mesa no disponible',
          centered: true,
          width: 600,
          okButtonProps: { style: { display: 'none' } }, 
          content: (
            <div style={{ marginTop: '10px' }}>
              <Text strong style={{ color: '#d35400', fontSize: '15px' }}>
                {data.message || 'Esta mesa ya está reservada.'}
              </Text>
              <Divider orientation="left" style={{ fontSize: '12px' }}>Opciones disponibles:</Divider>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {mesasFinales.sort((a, b) => a.number - b.number).map((mesa) => (
                  <Tag 
                    color="green" 
                    key={mesa.id} 
                    style={{ cursor: 'pointer', padding: '8px 12px', fontSize: '14px', borderRadius: '6px' }}
                    onClick={() => {
                      form.setFieldsValue({ tableId: mesa.id });
                      warningModal.destroy();
                      message.success(`Mesa ${mesa.number} seleccionada.`);
                    }}
                  >
                    Mesa {mesa.number} ({mesa.location})
                  </Tag>
                ))}
              </div>
            </div>
          ),
        });
        return;
      }

      if (res.ok) {
        message.success('¡Reserva creada exitosamente!');
        router.push('/base/bookings');
      } else {
        setLoading(false);
        const errorData = await res.json().catch(() => ({}));
        message.error(errorData.message || 'Error en el servidor');
      }

    } catch (error) {
      setLoading(false);
      message.error('Error de red.');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
      <Card
        style={{ borderRadius: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
        title={<Title level={3} style={{ margin: 0 }}><CalendarOutlined /> Nueva Reserva</Title>}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item label="Fecha de la Reserva" name="date" rules={[{ required: true, message: 'Seleccione fecha' }]}>
            <DatePicker 
              style={{ width: '100%' }} 
              placeholder="Seleccionar fecha"
              onChange={() => { setAvailableTables([]); form.setFieldsValue({tableId: undefined}); }} 
            />
          </Form.Item>

          <Form.Item label="Hora de llegada" name="time" rules={[{ required: true, message: 'Seleccione hora' }]}>
            <TimePicker 
              style={{ width: '100%' }} 
              format="HH:mm" 
              placeholder="Seleccionar hora"
              onChange={() => { setAvailableTables([]); form.setFieldsValue({tableId: undefined}); }} 
            />
          </Form.Item>

          <Form.Item label="Mesa deseada" name="tableId" rules={[{ required: true, message: 'Seleccione una mesa' }]}>
            <Select
              placeholder="Seleccionar mesa"
              onFocus={fetchAvailableTables}
              loading={fetchingTables}
            >
              {availableTables.map(table => (
                <Option key={table.id} value={table.id}>
                  Mesa {table.number} - {table.location}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="¿Cuántas personas?" name="people" rules={[{ required: true, message: 'Indique cantidad' }]}>
            <InputNumber min={1} max={10} style={{ width: '100%' }} prefix={<TeamOutlined />} />
          </Form.Item>

          <Form.Item 
            label={<Text strong><ForkOutlined /> Selección de Menú (Mínimo 2 platos)</Text>} 
            name="menuItems" 
            rules={[{ required: true, message: 'Elija al menos 2 platos' }]}
          >
            <Select
              mode="multiple"
              placeholder="Haga clic para elegir platos"
              style={{ width: '100%' }}
              size="large"
              allowClear
            >
              {menuOptions.map(item => (
                <Option key={item.id} value={item.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.name}</span>
                    <Text type="success" strong>${item.price.toFixed(2)}</Text>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Notas" name="observations">
            <Input.TextArea placeholder="Opcional..." rows={3} />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            style={{ 
              background: '#d2691e', 
              height: '50px', 
              borderRadius: '12px', 
              marginTop: '10px',
              border: 'none'
            }}
          >
            Confirmar Reserva
          </Button>
        </Form>
      </Card>
    </div>
  );
};

const NewBooking = () => (<App><NewBookingContent /></App>);
NewBooking.Layout = Dashboard;
export default NewBooking;