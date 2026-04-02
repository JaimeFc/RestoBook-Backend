import { useState, useEffect } from 'react';
import {
  Form, Input, DatePicker, TimePicker, InputNumber,
  Button, Card, message, Select, Typography,
  App
} from 'antd';
import { CalendarOutlined, TeamOutlined, ForkOutlined } from '@ant-design/icons';
import Dashboard from '@ui/layout/Dashboard';
import { authService } from '@services/auth.service';
import { useRouter } from 'next/router';

const { Title, Text } = Typography;
const { Option } = Select;

const NewBookingContent = () => {
  const [form] = Form.useForm();
  const { modal: modalHook } = App.useApp(); 
  const [loading, setLoading] = useState(false);
  const [fetchingTables, setFetchingTables] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [user, setUser] = useState(null);
  
  const [menuOptions, setMenuOptions] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    authService.user().then(setUser);
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setLoadingMenu(true);
    try {
      const res = await fetch('/api/food-list');
      const result = await res.json();
      
      if (result.success) {
        const activeItems = result.data.filter(item => item.active !== false);
        setMenuOptions(activeItems);
      } else {
        setMenuOptions(Array.isArray(result) ? result : []);
      }
    } catch (error) {
      console.error("Error al cargar el menú:", error);
      message.error('No se pudo cargar el menú de platos.');
    } finally {
      setLoadingMenu(false);
    }
  };

  // --- FUNCIÓN CORREGIDA: Ahora envía 'people' al servidor ---
  const fetchAvailableTables = async () => {
    const values = form.getFieldsValue(['date', 'time', 'people']);
    if (!values.date || !values.time) {
      return message.warning('Selecciona fecha y hora primero.');
    }
    
    setFetchingTables(true);
    try {
      const d = values.date.format('YYYY-MM-DD');
      const t = values.time.format('HH:mm');
      const p = values.people || 1; // Enviamos el número de personas
      
      const res = await fetch(`/api/bookings/available-tables?date=${d}&time=${t}&people=${p}`);
      const data = await res.json();
      if (res.ok) {
        setAvailableTables(data);
        if (data.length === 0) message.info('No hay mesas disponibles para esa cantidad de personas.');
      }
    } catch (error) {
      message.error('Error al cargar mesas.');
    } finally {
      setFetchingTables(false);
    }
  };

  const onFinish = async (values) => {
    if (!user?.id) return message.error("Inicia sesión de nuevo.");
    
    if (!values.menuItems || values.menuItems.length < 2) {
      return message.error("Selecciona al menos 2 platos en total.");
    }

    setLoading(true);

    try {
      const menuTexto = values.menuItems.join('; ');

      const payload = {
        date: values.date.format('YYYY-MM-DD'),
        time: values.time.format('HH:mm'),
        tableId: values.tableId,
        people: values.people,
        userId: user.id,
        observations: values.observations || "", 
        menu: menuTexto,
      };

      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        message.success('¡Reserva creada con éxito!');
        router.push('/base/bookings');
      } 
      else if (res.status === 409) {
        modalHook.error({
          title: 'Mesa ocupada',
          content: (
            <div>
              <p>{result.message}</p>
              {result.suggestions && result.suggestions.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <Text strong>Mesas disponibles para este horario:</Text>
                  <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                    {result.suggestions.map(table => (
                      <li key={table.id} style={{ marginBottom: '5px' }}>
                        <Text strong>Mesa {table.number}</Text> - {table.location} (Cap: {table.capacity})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ),
          okText: 'Cerrar',
          width: 500
        });
      } else {
        message.error(result.message || 'Error al crear reserva');
      }
    } catch (error) {
      message.error('Error de red al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
      <Card
        style={{ borderRadius: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
        title={<Title level={3} style={{ margin: 0 }}><CalendarOutlined /> Nueva Reserva</Title>}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} initialValues={{ menuItems: [], people: 2 }}>
          
          <Form.Item label="Personas" name="people" rules={[{ required: true, message: 'Indique cantidad' }]}>
            <InputNumber 
              min={1} max={10} style={{ width: '100%' }} prefix={<TeamOutlined />} 
              onChange={() => {
                // Al cambiar personas, limpiamos la mesa seleccionada para forzar nueva búsqueda
                form.setFieldsValue({ tableId: undefined });
                setAvailableTables([]);
              }}
            />
          </Form.Item>

          <Form.Item label="Fecha" name="date" rules={[{ required: true, message: 'Seleccione fecha' }]}>
            <DatePicker style={{ width: '100%' }} onChange={() => form.setFieldsValue({tableId: undefined})} />
          </Form.Item>

          <Form.Item label="Hora" name="time" rules={[{ required: true, message: 'Seleccione hora' }]}>
            <TimePicker style={{ width: '100%' }} format="HH:mm" onChange={() => form.setFieldsValue({tableId: undefined})} />
          </Form.Item>

          <Form.Item label="Mesa" name="tableId" rules={[{ required: true, message: 'Seleccione mesa' }]}>
            <Select 
              placeholder="Seleccionar mesa" 
              onFocus={fetchAvailableTables} 
              loading={fetchingTables}
            >
              {availableTables.map(table => (
                <Option key={table.id} value={table.id}>Mesa {table.number} - {table.location} (Cap: {table.capacity})</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label={<Text strong><ForkOutlined /> Selección de Menú (Mínimo 2 platos)</Text>} required>
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '12px', border: '1px solid #e8e8e8' }}>
              {loadingMenu ? <Text>Cargando menú...</Text> : menuOptions.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', background: '#fff', padding: '8px 12px', borderRadius: '8px' }}>
                  <div>
                    <Text strong>{item.name}</Text><br/>
                    <Text type="success">${Number(item.price).toFixed(2)}</Text>
                  </div>
                  <InputNumber 
                    min={0} max={10} defaultValue={0} style={{ width: '65px' }}
                    onChange={(cantidad) => {
                      const currentSelected = form.getFieldValue('menuItems') || [];
                      const otherItems = Array.isArray(currentSelected) ? currentSelected.filter(name => name !== item.name) : [];
                      const newCountArray = Array(cantidad || 0).fill(item.name);
                      form.setFieldsValue({ menuItems: [...otherItems, ...newCountArray] });
                    }} 
                  />
                </div>
              ))}
            </div>
            <Form.Item name="menuItems" rules={[{ validator: (_, value) => value && value.length >= 2 ? Promise.resolve() : Promise.reject(new Error('Mínimo 2 platos')) }]} style={{ margin: 0 }}>
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Total platos: </Text>
                <Text strong>{form.getFieldValue('menuItems')?.length || 0}</Text>
              </div>
            </Form.Item>
          </Form.Item>

          <Form.Item label="Notas" name="observations">
            <Input.TextArea placeholder="Escribe aquí si deseas algo especial..." rows={3} />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{ background: '#d2691e', height: '50px', borderRadius: '12px', border: 'none' }}>
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