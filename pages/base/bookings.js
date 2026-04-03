import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

import { Table, Tag, Space, Button, Card, Typography, message, Popconfirm, Badge } from 'antd'; 
import { ClockCircleOutlined, SyncOutlined, LogoutOutlined, HistoryOutlined, EyeOutlined, CloseCircleOutlined } from '@ant-design/icons';
import Dashboard from '@ui/layout/Dashboard';



const { Title, Text } = Typography;

const BookingsPage = () => {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const fetchBookings = useCallback(async (isHistory) => {
    setLoading(true);
    try {
      // Cargamos los datos con un timestamp para evitar caché
      const res = await fetch(`/api/bookings?limit=500&_t=${Date.now()}`);
      const result = await res.json();
      
      if (res.ok) {
        let data = result.data || result;
        if (!Array.isArray(data)) data = [];

        console.log("Datos brutos recibidos:", data);

        if (!isHistory) {
          // --- FILTRO DE HOY FLEXIBLE ---
          // Obtenemos la fecha de hoy en formato YYYY-MM-DD sin problemas de zona horaria
          const local = new Date();
          const hoyStr = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
          
          data = data.filter(item => {
            const status = (item.status || "").toUpperCase().trim();
            const itemDate = item.date ? item.date.toString() : "";
            
            // CRITERIO: Mostrar si es de hoy O si el estado es CONFIRMADA/PENDIENTE
            // Esto asegura que la reserva de Angela Lapo no se oculte.
            const esDeHoy = itemDate.includes(hoyStr);
            const estaActiva = status === 'CONFIRMADA' || status === 'PENDIENTE';
            
            return esDeHoy || estaActiva;
          });
        }
        
        setBookings(data);
      }
    } catch (error) {
      console.error("Error cargando reservas:", error);
      message.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = async (id, newStatus) => {
    if (!id) {
      message.error("ID de reserva no encontrado");
      return;
    }

    const hide = message.loading('Procesando...', 0);
    try {
      const res = await fetch('/api/bookings/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        message.success(`Reserva ${newStatus} correctamente`);
        fetchBookings(showHistory); 
      } else {
        const result = await res.json();
        message.error(result.message || "Error al actualizar");
      }
    } catch (error) {
      message.error("Error de conexión");
    } finally {
      hide();
    }
  };

  useEffect(() => {
    if (router.isReady) {
      fetchBookings(showHistory);
    }
  }, [router.isReady, showHistory, fetchBookings]);

  const columns = [
    {
      title: 'CLIENTE',
      key: 'customer',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.user?.Person?.firstName} {record.user?.Person?.lastName}</Text>
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
          <Text strong style={{ color: '#1890ff' }}>
            {record.date ? new Date(record.date).toLocaleDateString() : '---'}
          </Text>
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
        let color = 'orange';
        if (s === 'CONFIRMADA') color = 'green';
        if (s === 'FINALIZADA') color = 'blue';
        if (s === 'CANCELADA') color = 'red';
        return <Tag color={color}>{s}</Tag>;
      },
    },
    {
      title: 'ACCIONES',
      key: 'action',
      render: (_, record) => {
        const s = (record.status || "").toUpperCase().trim();
        return (
          <Space size="middle">
            {s === 'CONFIRMADA' && (
              <Popconfirm 
                title="¿Finalizar esta reserva?" 
                onConfirm={() => updateStatus(record.id, 'FINALIZADA')}
                okText="Sí"
                cancelText="No"
              >
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<LogoutOutlined />}
                  style={{ display: 'flex', alignItems: 'center', backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                > 
                  Finalizar 
                </Button>
              </Popconfirm>
            )}
            
            {(s === 'CONFIRMADA' || s === 'PENDIENTE') && (
              <Popconfirm title="¿Cancelar reserva?" onConfirm={() => updateStatus(record.id, 'CANCELADA')}>
                <Button type="text" danger size="small" icon={<CloseCircleOutlined />} style={{ display: 'flex', alignItems: 'center' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Gestión de Reservas</Title>
            <Text type="secondary">
              {showHistory ? "Historial completo de todas las reservas." : "Mostrando reservas activas para hoy."}
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

        <Table 
          columns={columns} 
          dataSource={bookings} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 7 }}
        />
      </Card>
    </div>
  );
};

BookingsPage.Layout = Dashboard;
export default BookingsPage;