import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Table, Tag, Space, Button, Card, Typography, message, Popconfirm, Badge } from 'antd'; 
import { 
  ClockCircleOutlined, SyncOutlined, LogoutOutlined, 
  HistoryOutlined, EyeOutlined, CloseCircleOutlined 
} from '@ant-design/icons';
import Dashboard from '@ui/layout/Dashboard';
import { authService } from '@services/auth.service';

const { Title, Text } = Typography;

const BookingsPage = () => {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [user, setUser] = useState(null);

  // --- FUNCIÓN PARA DETECTAR SI ES ADMIN (Basado en tus tablas de DB) ---
  const checkIsAdmin = (userData) => {
    return (
      userData?.roleId === 2 || 
      userData?.Role?.id === 2 || 
      userData?.roles?.some(r => r.roleId === 2 || r.id === 2) ||
      userData?.Role?.code === 'administrator'
    );
  };

  const fetchBookings = useCallback(async (isHistory) => {
    setLoading(true);
    try {
      const userData = await authService.user();
      setUser(userData);
      
      const isAdmin = checkIsAdmin(userData);

      const res = await fetch(`/api/bookings?limit=500&_t=${Date.now()}`);
      const result = await res.json();
      
      if (res.ok) {
        let data = result.data || result;
        if (!Array.isArray(data)) data = [];

        const hoyStr = new Date().toLocaleDateString('en-CA');

        data = data.filter(item => {
          const status = (item.status || "").toUpperCase().trim();
          const itemDate = item.date ? item.date.split('T')[0] : "";
          const esMio = item.userId === userData?.id;

          // El Admin ve todo. El usuario solo lo suyo.
          if (!isAdmin && !esMio) return false;

          // Filtro de "Hoy" vs "Historial"
          if (!isHistory) {
            const esDeHoy = itemDate === hoyStr;
            const estaActiva = status === 'CONFIRMADA' || status === 'PENDIENTE';
            return esDeHoy && estaActiva;
          }
          return true; 
        });
        
        setBookings(data);
      }
    } catch (error) {
      console.error("Error:", error);
      message.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = async (id, newStatus) => {
    const hide = message.loading('Procesando...', 0);
    try {
      const res = await fetch('/api/bookings/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        message.success(`Reserva ${newStatus.toLowerCase()} correctamente`);
        fetchBookings(showHistory); 
      }
    } catch (error) {
      message.error("Error de conexión");
    } finally {
      hide();
    }
  };

  useEffect(() => {
    if (router.isReady) { fetchBookings(showHistory); }
  }, [router.isReady, showHistory, fetchBookings]);

  const columns = [
    {
      title: 'CLIENTE',
      key: 'customer',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.user?.Person?.firstName || 'Cliente'} {record.user?.Person?.lastName || ''}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.user?.email}</Text>
        </Space>
      ),
    },
    {
      title: 'MESA',
      dataIndex: ['table', 'number'],
      key: 'table',
      render: (num) => <Badge count={`Mesa ${num}`} style={{ backgroundColor: '#8b4513' }} />,
    },
    {
      title: 'FECHA Y HORA',
      key: 'dateTime',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: '#1890ff' }}>{record.date?.split('T')[0]}</Text>
          <Text type="secondary"><ClockCircleOutlined /> {record.time}</Text>
        </Space>
      ),
    },
    {
      title: 'ESTADO',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const s = (status || "").toUpperCase().trim();
        let color = s === 'CONFIRMADA' ? 'green' : s === 'FINALIZADA' ? 'blue' : s === 'CANCELADA' ? 'red' : 'orange';
        return <Tag color={color}>{s}</Tag>;
      },
    },
    {
      title: 'ACCIONES',
      key: 'action',
      render: (_, record) => {
        const s = (record.status || "").toUpperCase().trim();
        const isAdmin = checkIsAdmin(user); // Verificamos si TÚ eres admin
        const isMyBooking = record.userId === user?.id;

        // --- LÓGICA DE BOTONES PARA ADMIN ---
        // Si eres Admin O es tu reserva, puedes gestionar.
        const canManage = isAdmin || isMyBooking;

        return (
          <Space size="middle">
            {s === 'CONFIRMADA' && canManage && (
              <Popconfirm title="¿Finalizar esta reserva?" onConfirm={() => updateStatus(record.id, 'FINALIZADA')}>
                <Button type="primary" size="small" icon={<LogoutOutlined />} style={{ backgroundColor: '#52c41a' }}>
                  Finalizar
                </Button>
              </Popconfirm>
            )}
            {(s === 'CONFIRMADA' || s === 'PENDIENTE') && canManage && (
              <Popconfirm title="¿Cancelar esta reserva?" onConfirm={() => updateStatus(record.id, 'CANCELADA')}>
                <Button type="text" danger size="small" icon={<CloseCircleOutlined />}>
                  Cancelar
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card bordered={false} style={{ borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <Title level={3}>Gestión de Reservas</Title>
            <Text type="secondary">
              {checkIsAdmin(user) ? <Tag color="gold">Modo Administrador</Tag> : null}
              {showHistory ? " Historial completo." : " Reservas activas de hoy."}
            </Text>
          </div>
          <Space>
            <Button 
              type={showHistory ? "default" : "primary"}
              icon={showHistory ? <EyeOutlined /> : <HistoryOutlined />}
              onClick={() => setShowHistory(!showHistory)}
              style={!showHistory ? { background: '#8b4513', color: 'white' } : {}}
            >
              {showHistory ? "Ver Solo Hoy" : "Ver Historial Completo"}
            </Button>
            <Button icon={<SyncOutlined spin={loading} />} onClick={() => fetchBookings(showHistory)}>Actualizar</Button>
          </Space>
        </div>
        <Table columns={columns} dataSource={bookings} rowKey="id" loading={loading} />
      </Card>
    </div>
  );
};

BookingsPage.Layout = Dashboard;
export default BookingsPage;





////205