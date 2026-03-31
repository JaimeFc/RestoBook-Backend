import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Badge, Typography, Space, Spin, Button, Modal, Statistic, Divider, message, Popconfirm, Tag } from 'antd';
import { 
  ShopOutlined, 
  SyncOutlined, 
  UserOutlined, 
  EnvironmentOutlined, 
  InfoCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  LogoutOutlined,
  ForkOutlined 
} from '@ant-design/icons';
import Dashboard from '@ui/layout/Dashboard';

const { Title, Text } = Typography;

const TableMap = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tables/status');
      if (res.ok) {
        const data = await res.json();
        const hoy = new Date().toLocaleDateString('en-CA'); 
        
        const tablesWithBookingStatus = data.map(table => {
          const activeBooking = table.bookings?.find(b => 
            b.date?.split('T')[0] === hoy && b.status === 'CONFIRMADA'
          );
          
          return {
            ...table,
            isActuallyOccupied: !!activeBooking,
            currentBooking: activeBooking
          };
        });
        setTables(tablesWithBookingStatus);
      }
    } catch (error) {
      message.error("Error al cargar mapa");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const handleTableClick = (table) => {
    if (table.isActuallyOccupied) {
      // LOG DE DEPURACIÓN: Esto te dirá en la consola qué datos está recibiendo la mesa al hacer clic
      console.log("Datos de la reserva en Mesa " + table.number + ":", table.currentBooking);
      setSelectedTable(table);
      setIsModalOpen(true);
    }
  };

  const getCustomerName = (booking) => {
    if (!booking) return "Disponible";
    if (booking.Person?.firstName) {
        const full = `${booking.Person.firstName} ${booking.Person.lastName || ''}`;
        return full.trim();
    }
    if (booking.user?.Person?.firstName) {
        const full = `${booking.user.Person.firstName} ${booking.user.Person.lastName || ''}`;
        return full.trim();
    }
    return booking.customerName || "Cliente Registrado";
  };

  const handleFinishBooking = async () => {
    const bookingId = selectedTable?.currentBooking?.id;
    if (!bookingId) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/bookings/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, status: 'FINALIZADA' }),
      });
      if (res.ok) {
        message.success(`Mesa ${selectedTable.number} liberada`);
        setIsModalOpen(false);
        fetchTables(); 
      }
    } catch (error) {
      message.error("Error de conexión");
    } finally {
      setUpdating(false);
    }
  };

  // --- FUNCIÓN DE RENDERIZADO DE MENÚ MEJORADA ---
  const renderMenuItems = (booking) => {
    // Buscamos los platos en múltiples posibles campos por si el backend cambió el nombre
    const items = booking.menuItems || booking.dishes || booking.order_items;

    if (!items || (Array.isArray(items) && items.length === 0)) {
      return <Text type="secondary" italic>No se pre-seleccionó menú.</Text>;
    }

    // Si los items vienen como un string (ej: "Pizza, Pasta"), los convertimos a array
    const itemsArray = Array.isArray(items) ? items : items.split(',');

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 8 }}>
        {itemsArray.map((item, index) => {
          // Extraemos el nombre si es un objeto, o el texto directo si es string
          const label = typeof item === 'object' ? (item.name || item.label) : item;
          return (
            <Tag color="orange" key={index} style={{ borderRadius: '6px', margin: 0 }}>
              {label}
            </Tag>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card bordered={false} style={{ borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ margin: 0 }}>Mapa en Vivo del Salón</Title>
          <Button type="primary" ghost icon={<SyncOutlined spin={loading} />} onClick={fetchTables}>Refrescar</Button>
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div> : (
          <Row gutter={[24, 24]}>
            {tables.map((table) => {
              const isOccupied = table.isActuallyOccupied;
              const name = getCustomerName(table.currentBooking);
              return (
                <Col xs={12} sm={8} md={6} lg={4} key={table.id}>
                  <Card
                    hoverable
                    onClick={() => handleTableClick(table)}
                    style={{
                      borderRadius: 20, textAlign: 'center',
                      borderTop: `6px solid ${isOccupied ? '#ff4d4f' : '#52c41a'}`,
                      backgroundColor: isOccupied ? '#fff1f0' : '#f6ffed',
                      minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <ShopOutlined style={{ fontSize: 28, color: isOccupied ? '#ff4d4f' : '#8c8c8c', marginBottom: 8 }} />
                      <Title level={4} style={{ margin: 0 }}>Mesa {table.number}</Title>
                      <div style={{ minHeight: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'center', marginTop: 8 }}>
                        {isOccupied ? (
                          <>
                            <Text strong style={{ color: '#cf1322', fontSize: 12 }}><UserOutlined /> {name}</Text>
                            <Tag color="red" style={{ marginTop: 4 }}>OCUPADA</Tag>
                          </>
                        ) : <Text type="secondary" style={{ fontSize: 12 }}>{table.location}</Text>}
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
        title={<Space><InfoCircleOutlined /> Detalles Mesa {selectedTable?.number}</Space>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalOpen(false)}>Cerrar</Button>,
          <Popconfirm key="fin" title="¿Liberar mesa?" onConfirm={handleFinishBooking}>
            <Button type="primary" danger loading={updating} icon={<LogoutOutlined />}>Finalizar y Liberar</Button>
          </Popconfirm>
        ]}
        centered
      >
        {selectedTable?.currentBooking && (
          <div style={{ padding: '10px 0' }}>
            <Statistic title="Reservado por:" value={getCustomerName(selectedTable.currentBooking)} prefix={<UserOutlined />} />
            <Divider />
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Text><ClockCircleOutlined /> <b>Hora:</b> {selectedTable.currentBooking.time || "23:00"}</Text>
              <Text><TeamOutlined /> <b>Personas:</b> {selectedTable.currentBooking.people || 2}</Text>
              
              {/* --- SECCIÓN DE MENÚ CORREGIDA --- */}
              <div style={{ marginTop: 8, padding: '15px', background: '#fff7e6', borderRadius: '15px', border: '1px solid #ffd591' }}>
                <Text strong><ForkOutlined /> Menú solicitado:</Text>
                {renderMenuItems(selectedTable.currentBooking)}
              </div>

              {selectedTable.currentBooking.observations && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Notas:</Text><br/>
                  <Text italic>{selectedTable.currentBooking.observations}</Text>
                </div>
              )}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

TableMap.Layout = Dashboard;
export default TableMap;