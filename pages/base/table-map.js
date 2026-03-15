import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Badge, Typography, Space, Spin, Button, Modal, Statistic, Divider, message, Popconfirm } from 'antd';
import { 
  ShopOutlined, 
  SyncOutlined, 
  UserOutlined, 
  EnvironmentOutlined, 
  InfoCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import Dashboard from '@ui/layout/Dashboard';

const { Title, Text } = Typography;

const TableMap = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // 1. Cargar las mesas
  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tables/status');
      if (res.ok) {
        const data = await res.json();
        setTables(data);
      }
    } catch (error) {
      message.error("Error al cargar mapa");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  // 2. Función para abrir el modal
  const handleTableClick = (table) => {
    if (table.status === 'occupied' && table.bookings?.[0]) {
      setSelectedTable(table);
      setIsModalOpen(true);
    }
  };

  // 3. Función para FINALIZAR reserva desde el mapa
  const handleFinishBooking = async () => {
    const bookingId = selectedTable?.bookings?.[0]?.id;
    if (!bookingId) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/bookings/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, status: 'FINALIZADA' }),
      });

      if (res.ok) {
        message.success(`Mesa ${selectedTable.number} liberada correctamente`);
        setIsModalOpen(false);
        fetchTables(); // Recarga el mapa para que la mesa se ponga verde
      } else {
        message.error("No se pudo liberar la mesa");
      }
    } catch (error) {
      message.error("Error de conexión");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card bordered={false} style={{ borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Mapa en Vivo del Salón</Title>
            <Space style={{ marginTop: 8 }}>
              <Badge status="success" text="Disponible" />
              <Badge status="error" text="Ocupada" />
            </Space>
          </div>
          <Button type="primary" ghost icon={<SyncOutlined spin={loading} />} onClick={fetchTables}>
            Refrescar
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>
        ) : (
          <Row gutter={[24, 24]}>
            {tables.map((table) => {
              const isOccupied = table.status === 'occupied';
              const booking = table.bookings?.[0];

              return (
                <Col xs={12} sm={8} md={6} lg={4} key={table.id}>
                  <Card
                    hoverable
                    onClick={() => handleTableClick(table)}
                    style={{
                      borderRadius: 20,
                      textAlign: 'center',
                      borderTop: `6px solid ${isOccupied ? '#ff4d4f' : '#52c41a'}`,
                      backgroundColor: isOccupied ? '#fff1f0' : '#f6ffed',
                      minHeight: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: isOccupied ? 'pointer' : 'default'
                    }}
                  >
                    <div>
                      <ShopOutlined style={{ fontSize: 28, color: '#8c8c8c', marginBottom: 8 }} />
                      <Title level={4} style={{ margin: 0 }}>Mesa {table.number}</Title>
                      
                      <div style={{ minHeight: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {isOccupied ? (
                          <>
                            <Text strong style={{ color: '#cf1322', fontSize: 13 }}>
                              <UserOutlined /> {booking?.user?.Person?.firstName}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 10 }}>Haz clic para detalles</Text>
                          </>
                        ) : (
                          <Text type="secondary" style={{ fontSize: 12 }}>{table.location}</Text>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                      <Badge count={`Cap: ${table.capacity}`} style={{ backgroundColor: isOccupied ? '#ff4d4f' : '#52c41a' }} />
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>

      <Modal
        title={<Space><InfoCircleOutlined /> Mesa {selectedTable?.number} - Detalles</Space>}
        open={isModalOpen}
        onCancel={() => !updating && setIsModalOpen(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalOpen(false)} disabled={updating}>
            Cerrar
          </Button>,
          <Popconfirm
            key="finish-confirm"
            title="¿El cliente ya se retiró?"
            description="La mesa volverá a estar disponible."
            onConfirm={handleFinishBooking}
            okText="Sí, liberar mesa"
            cancelText="No"
          >
            <Button 
              key="finish" 
              type="primary" 
              danger 
              icon={<LogoutOutlined />} 
              loading={updating}
            >
              Finalizar y Liberar
            </Button>
          </Popconfirm>
        ]}
        centered
      >
        {selectedTable?.bookings?.[0] && (
          <div style={{ padding: '10px 0' }}>
            <Row gutter={16}>
              <Col span={12}><Statistic title="Cliente" value={selectedTable.bookings[0].user?.Person?.firstName} prefix={<UserOutlined />} /></Col>
              <Col span={12}><Statistic title="Personas" value={selectedTable.bookings[0].people} prefix={<TeamOutlined />} /></Col>
            </Row>
            <Divider style={{ margin: '16px 0' }} />
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Text><ClockCircleOutlined /> <b>Hora:</b> {selectedTable.bookings[0].time}</Text>
              <Text><EnvironmentOutlined /> <b>Ubicación:</b> {selectedTable.location}</Text>
              <div style={{ background: '#fafafa', padding: '12px', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Notas:</Text><br/>
                <Text italic>{selectedTable.bookings[0].observations || "Sin notas."}</Text>
              </div>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

TableMap.Layout = Dashboard;
export default TableMap;