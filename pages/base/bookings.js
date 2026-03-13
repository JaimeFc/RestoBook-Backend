import { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  Tag, 
  Space, 
  Button, 
  Card, 
  Typography, 
  message, 
  Popconfirm, 
  Badge 
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  SyncOutlined 
} from '@ant-design/icons';
import Dashboard from '@ui/layout/Dashboard';

const { Title, Text } = Typography;

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar las reservas desde la base de datos
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings'); // Necesitaremos crear este endpoint
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (error) {
      message.error("Error al cargar las reservas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // 2. Función para cambiar el estado de una reserva
  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        message.success(`Reserva actualizada a ${newStatus}`);
        fetchBookings(); // Recargar la lista
      }
    } catch (error) {
      message.error("No se pudo actualizar el estado");
    }
  };

  const columns = [
    {
      title: 'Cliente',
      dataIndex: ['user', 'Person', 'name'],
      key: 'customer',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.user?.Person?.firstName} {record.user?.Person?.lastName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.user?.email}</Text>
        </Space>
      ),
    },
    {
      title: 'Mesa',
      dataIndex: ['table', 'number'],
      key: 'table',
      render: (num) => <Badge count={`Mesa ${num}`} style={{ backgroundColor: '#52c41a' }} />,
    },
    {
      title: 'Fecha y Hora',
      key: 'dateTime',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{new Date(record.date).toLocaleDateString()}</Text>
          <Text type="secondary"><ClockCircleOutlined /> {record.time}</Text>
        </Space>
      ),
    },
    {
      title: 'Personas',
      dataIndex: 'people',
      key: 'people',
      align: 'center',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'gold';
        if (status === 'CONFIRMADA') color = 'green';
        if (status === 'CANCELADA') color = 'red';
        if (status === 'FINALIZADA') color = 'blue';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Acciones',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          {record.status === 'PENDIENTE' && (
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckCircleOutlined />}
              onClick={() => updateStatus(record.id, 'CONFIRMADA')}
            >
              Confirmar
            </Button>
          )}
          <Popconfirm
            title="¿Deseas cancelar esta reserva?"
            onConfirm={() => updateStatus(record.id, 'CANCELADA')}
            okText="Sí"
            cancelText="No"
          >
            <Button type="text" danger size="small" icon={<CloseCircleOutlined />}>
              Cancelar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card bordered={false} style={{ borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Gestión de Reservas</Title>
            <Text type="secondary">Controla las solicitudes de tus clientes para hoy y los próximos días.</Text>
          </div>
          <Button icon={<SyncOutlined spin={loading} />} onClick={fetchBookings}>Actualizar</Button>
        </div>

        <Table 
          columns={columns} 
          dataSource={bookings} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
};

BookingsPage.Layout = Dashboard;
export default BookingsPage;