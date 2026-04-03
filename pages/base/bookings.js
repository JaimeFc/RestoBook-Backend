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
      const res = await fetch(`/api/bookings?limit=200&_t=${Date.now()}`);
      const result = await res.json();
      
      if (res.ok) {
        let data = result.data || result;
        if (!Array.isArray(data)) data = [];

        if (!isHistory) {
          const hoy = new Date();
          const hoyISO = hoy.toISOString().split('T')[0]; 
          
          data = data.filter(item => {
            const itemDate = item.date ? item.date.toString() : "";
            // Mantenemos en la lista las que necesitan atención (CONFIRMADA/PENDIENTE)
            return item.status === 'CONFIRMADA' || item.status === 'PENDIENTE' || itemDate.includes(hoyISO);
          });
        }
        setBookings(data);
      }
    } catch (error) {
      console.error(error);
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
        body: JSON.stringify({ 
          id: id, // El backend debe recibir el ID tal cual viene de la base de datos
          status: newStatus 
        }),
      });

      const result = await res.json();

      if (res.ok) {
        message.success(`Reserva ${newStatus} correctamente`);
        // Recarga inmediata para ver los cambios
        fetchBookings(showHistory); 
      } else {
        // CORRECCIÓN: Mostramos el error real que devuelve la API (muy útil para debug)
        message.error(result.message || result.details || "Error al actualizar");
        console.error("Detalle del error:", result);
      }
    } catch (error) {
      message.error("Error de conexión con el servidor");
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
            {/* Formateo de fecha más seguro */}
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
      render: (status) => (
        <Tag color={status === 'CONFIRMADA' ? 'green' : status === 'FINALIZADA' ? 'blue' : 'orange'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'ACCIONES',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          {record.status === 'CONFIRMADA' && (
            <Popconfirm 
              title="¿Finalizar esta reserva?" 
              onConfirm={() => updateStatus(record.id, 'FINALIZADA')}
              okText="Sí, finalizar"
              cancelText="No"
            >
              <Button 
                type="primary" 
                size="small" 
                icon={<LogoutOutlined />}
                style={{ display: 'flex', alignItems: 'center' }}
              > 
                Finalizar 
              </Button>
            </Popconfirm>
          )}
          
          {(record.status === 'CONFIRMADA' || record.status === 'PENDIENTE') && (
            <Popconfirm title="¿Cancelar reserva?" onConfirm={() => updateStatus(record.id, 'CANCELADA')}>
              <Button type="text" danger size="small" icon={<CloseCircleOutlined />} style={{ display: 'flex', alignItems: 'center' }}>
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
      <Card bordered={false} style={{ borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Gestión de Reservas</Title>
            <Text type="secondary">
              {showHistory ? "Historial completo." : "Reservas activas y de hoy."}
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