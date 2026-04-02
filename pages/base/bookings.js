import { useState, useEffect, useCallback } from 'react';
import { 
  Table, Tag, Space, Button, Card, Typography, message, Popconfirm, Badge 
} from 'antd';
import { 
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  SyncOutlined, LogoutOutlined, HistoryOutlined, EyeOutlined      
} from '@ant-design/icons';
import Dashboard from '@ui/layout/Dashboard';
import { authService } from '@services/auth.service';

const { Title, Text } = Typography;

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); 
  const [showHistory, setShowHistory] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await authService.user();
      setUser(currentUser);

      const queryParams = new URLSearchParams({
        showAll: showHistory,
        userId: currentUser?.id || '',
        role: currentUser?.role || ''
      });

      const res = await fetch(`/api/bookings?${queryParams.toString()}`); 
      
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Error al cargar:", error);
      message.error("Error al cargar las reservas");
    } finally {
      setLoading(false);
    }
  }, [showHistory]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch('/api/bookings/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      
      if (res.ok) {
        message.success(`Reserva marcada como ${newStatus}`);
        fetchBookings(); 
      }
    } catch (error) {
      message.error("Error de conexión");
    }
  };

  const columns = [
    {
      title: 'Cliente',
      key: 'customer',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.user?.Person?.firstName} {record.user?.Person?.lastName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.user?.email}</Text>
        </Space>
      ),
    },
    {
      title: 'Mesa',
      key: 'table',
      render: (num, record) => (
        <Space direction="vertical" size={0}>
            <Badge count={`Mesa ${record.table?.number}`} style={{ backgroundColor: '#52c41a' }} />
            <Text type="secondary" style={{ fontSize: 11 }}>{record.table?.location}</Text>
        </Space>
      ),
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
    { title: 'Personas', dataIndex: 'people', key: 'people', align: 'center' },
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
          {record.status === 'CONFIRMADA' && (
            <Button 
              type="primary" 
              size="small" 
              icon={<LogoutOutlined />}
              onClick={() => updateStatus(record.id, 'FINALIZADA')}
              // --- CAMBIO DE COLOR AQUÍ ---
              style={{ 
                backgroundColor: '#1890ff', 
                borderColor: '#1890ff',
                color: 'white' 
              }}
            >
              Finalizar
            </Button>
          )}
          {['CONFIRMADA', 'PENDIENTE'].includes(record.status) && (
            <Popconfirm
              title="¿Cancelar reserva?"
              onConfirm={() => updateStatus(record.id, 'CANCELADA')}
            >
              <Button type="text" danger size="small" icon={<CloseCircleOutlined />}>
                Cancelar
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card bordered={false} style={{ borderRadius: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Gestión de Reservas</Title>
            <Text type="secondary">Visualizando tus registros actuales e históricos.</Text>
          </div>
          
          <Space>
            <Button 
              icon={showHistory ? <EyeOutlined /> : <HistoryOutlined />}
              onClick={() => setShowHistory(!showHistory)}
              type={showHistory ? "primary" : "default"}
            >
              {showHistory ? "Ver Solo Activas" : "Ver Historial"}
            </Button>
            <Button icon={<SyncOutlined spin={loading} />} onClick={fetchBookings}>Actualizar</Button>
          </Space>
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