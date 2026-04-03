import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Badge, Typography, Space, Spin, Button, Modal, Statistic, Divider, message, Popconfirm, Tag } from 'antd';
import { 
  ShopOutlined, SyncOutlined, UserOutlined, EnvironmentOutlined, 
  InfoCircleOutlined, ClockCircleOutlined, TeamOutlined, LogoutOutlined, ForkOutlined 
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
        // Usamos la fecha actual en formato local para comparar
        const hoy = new Date().toISOString().split('T')[0]; 
        
        const tablesWithBookingStatus = data.map(table => {
          // Buscamos si hay una reserva CONFIRMADA para hoy en esta mesa
          const activeBooking = table.bookings?.find(b => {
            const bDate = b.date?.includes('T') ? b.date.split('T')[0] : b.date;
            return bDate === hoy && b.status === 'CONFIRMADA';
          });
          
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
      setSelectedTable(table);
      setIsModalOpen(true);
    } else {
      message.info(`Mesa ${table.number} está disponible`);
    }
  };

  const getCustomerName = (booking) => {
    if (!booking) return "Disponible";
    const person = booking.Person || booking.user?.Person;
    if (person?.firstName) {
        return `${person.firstName} ${person.lastName || ''}`.trim();
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
        message.success(`Mesa ${selectedTable.number} liberada correctamente`);
        setIsModalOpen(false);
        // RECARGA EL MAPA: Esto hará que la mesa pase de Rojo a Verde
        fetchTables(); 
      } else {
        message.error("El servidor no pudo finalizar la reserva");
      }
    } catch (error) {
      message.error("Error de conexión con el servidor");
    } finally {
      setUpdating(false);
    }
  };

  const renderMenuItems = (booking) => {
    const items = booking.menuItems || booking.dishes || booking.order_items;
    if (!items || (Array.isArray(items) && items.length === 0)) {
      return <Text type="secondary" italic>No se pre-seleccionó menú.</Text>;
    }
    const itemsArray = Array.isArray(items) ? items : items.split(',');
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 8 }}>
        {itemsArray.map((item, index) => (
          <Tag color="orange" key={index} style={{ borderRadius: '6px' }}>
            {typeof item === 'object' ? (item.name || item.label) : item}
          </Tag>
        ))}
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
              return (
                <Col xs={12} sm={8} md={6} lg={4} key={table.id}>
                  <Card
                    hoverable
                    onClick={() => handleTableClick(table)}
                    style={{
                      borderRadius: 20, textAlign: 'center',
                      borderTop: `6px solid ${isOccupied ? '#ff4d4f' : '#52c41a'}`,
                      backgroundColor: isOccupied ? '#fff1f0' : '#f6ffed',
                      minHeight: '210px', display: 'flex', flexDirection: 'column'
                    }}
                  >
                    <ShopOutlined style={{ fontSize: 28, color: isOccupied ? '#ff4d4f' : '#8c8c8c', marginBottom: 8 }} />
                    <Title level={4} style={{ margin: 0 }}>Mesa {table.number}</Title>
                    <div style={{ flexGrow: 1, marginTop: 8 }}>
                      {isOccupied ? (
                        <>
                          <Text strong style={{ color: '#cf1322', fontSize: 12 }}>
                            <UserOutlined /> {getCustomerName(table.currentBooking)}
                          </Text>
                          <br />
                          <Tag color="red" style={{ marginTop: 4, borderRadius: '10px' }}>OCUPADA</Tag>
                        </>
                      ) : (
                        <Text type="secondary" style={{ fontSize: 12 }}>{table.location || 'Salón'}</Text>
                      )}
                    </div>
                    <div style={{ marginTop: 12 }}>
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
          <Button key="back" onClick={() => setIsModalOpen(false)} style={{ borderRadius: '6px' }}>Cerrar</Button>,
          <Popconfirm key="fin" title="¿Liberar esta mesa ahora?" onConfirm={handleFinishBooking} okText="Sí, liberar" cancelText="No">
            <Button 
                type="primary" 
                danger 
                loading={updating} 
                icon={<LogoutOutlined />}
                style={{ borderRadius: '6px', backgroundColor: '#1890ff', borderColor: '#1890ff' }} // Azul como el botón de la lista
            >
                Finalizar y Liberar
            </Button>
          </Popconfirm>
        ]}
        centered
      >
        {selectedTable?.currentBooking && (
          <div style={{ padding: '10px 0' }}>
            <Statistic title="Ocupada por:" value={getCustomerName(selectedTable.currentBooking)} prefix={<UserOutlined />} />
            <Divider />
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Text><ClockCircleOutlined /> <b>Llegada:</b> {selectedTable.currentBooking.time}</Text>
              <Text><TeamOutlined /> <b>Comensales:</b> {selectedTable.currentBooking.people || selectedTable.capacity}</Text>
              <div style={{ marginTop: 8, padding: '15px', background: '#fff7e6', borderRadius: '15px', border: '1px solid #ffd591' }}>
                <Text strong><ForkOutlined /> Pedido Previo:</Text>
                {renderMenuItems(selectedTable.currentBooking)}
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