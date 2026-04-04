import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Badge, Typography, Space, Spin, Button, Modal, Statistic, Divider, message, Popconfirm, Tag } from 'antd';
import { 
  ShopOutlined, SyncOutlined, UserOutlined, 
  InfoCircleOutlined, ClockCircleOutlined, TeamOutlined, LogoutOutlined, ForkOutlined,
  MessageOutlined 
} from '@ant-design/icons';
import Dashboard from '@ui/layout/Dashboard';
import { authService } from '@services/auth.service';

const { Title, Text } = Typography;

const TableMap = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState(null);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await authService.user();
      setUser(userData);
      
      const res = await fetch('/api/tables/status');
      if (res.ok) {
        const data = await res.json();
        const hoy = new Date().toLocaleDateString('en-CA'); 
        
        const processed = data.map(table => {
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
        setTables(processed);
      }
    } catch (error) {
      message.error("Error al cargar mapa");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const getCustomerName = (booking) => {
    if (!booking) return "Disponible";
    const isAdmin = user?.Role?.code === 'administrator' || user?.roleId === 2;
    const isMyBooking = booking.userId === user?.id;

    if (isAdmin || isMyBooking) {
        const person = booking.Person || booking.user?.Person;
        if (person?.firstName) return `${person.firstName} ${person.lastName || ''}`.trim();
        return booking.customerName || "Cliente Registrado";
    }
    return "Ocupada por Cliente";
  };

  const handleTableClick = (table) => {
    if (table.isActuallyOccupied) {
      setSelectedTable(table);
      setIsModalOpen(true);
    } else {
      message.info(`Mesa ${table.number} está disponible`);
    }
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

  const renderMenuItems = (booking) => {
    const items = booking.menuItems || booking.dishes || booking.order_items;
    if (!items || (Array.isArray(items) && items.length === 0)) return <Text type="secondary" italic>No hay menú seleccionado.</Text>;
    const itemsArray = Array.isArray(items) ? items : items.split(',');
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 8 }}>
        {itemsArray.map((item, index) => (
          <Tag color="orange" key={index}>{typeof item === 'object' ? (item.name || item.label) : item}</Tag>
        ))}
      </div>
    );
  };

  const isAdmin = user?.Role?.code === 'administrator' || user?.roleId === 2;
  const isMyTable = selectedTable?.currentBooking?.userId === user?.id;

  return (
    <div style={{ padding: '24px' }}>
      <Card bordered={false} style={{ borderRadius: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
          <Title level={3}>Mapa en Vivo</Title>
          <Button icon={<SyncOutlined spin={loading} />} onClick={fetchTables}>Refrescar</Button>
        </div>

        {loading ? <Spin size="large" /> : (
          <Row gutter={[24, 24]}>
            {tables.map((table) => (
              <Col xs={12} sm={8} md={6} lg={4} key={table.id}>
                <Card
                  hoverable
                  onClick={() => handleTableClick(table)}
                  style={{
                    borderRadius: 20, textAlign: 'center',
                    borderTop: `6px solid ${table.isActuallyOccupied ? '#ff4d4f' : '#52c41a'}`,
                    backgroundColor: table.isActuallyOccupied ? '#fff1f0' : '#f6ffed',
                    minHeight: '210px'
                  }}
                >
                  <ShopOutlined style={{ fontSize: 28, color: table.isActuallyOccupied ? '#ff4d4f' : '#52c41a' }} />
                  <Title level={4}>Mesa {table.number}</Title>
                  {table.isActuallyOccupied ? (
                    <Text strong style={{ color: '#cf1322', fontSize: 12 }}>
                      {getCustomerName(table.currentBooking)}
                    </Text>
                  ) : <Text type="secondary">Disponible</Text>}
                  
                  {/* CORRECCIÓN: Badge con color dinámico basado en ocupación */}
                  <div style={{ marginTop: 12 }}>
                    <Badge 
                      count={`Cap: ${table.capacity}`} 
                      style={{ 
                        backgroundColor: table.isActuallyOccupied ? '#ff4d4f' : '#52c41a', 
                        color: '#fff' 
                      }} 
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Modal
        title={`Detalles de la Mesa ${selectedTable?.number}`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        centered
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>Cerrar</Button>,
          (isAdmin || isMyTable) && (
            <Popconfirm key="fin" title="¿Liberar mesa?" onConfirm={handleFinishBooking}>
              <Button type="primary" danger loading={updating} icon={<LogoutOutlined />}>Finalizar</Button>
            </Popconfirm>
          )
        ]}
      >
        {selectedTable?.currentBooking && (
          (isAdmin || isMyTable) ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Statistic title="Cliente" value={getCustomerName(selectedTable.currentBooking)} prefix={<UserOutlined />} />
              
              <Text><ClockCircleOutlined /> <b>Hora de llegada:</b> {selectedTable.currentBooking.time}</Text>
              
              <Text>
                <TeamOutlined /> <b>Personas:</b> {
                  selectedTable.currentBooking.people || 
                  selectedTable.currentBooking.pax || 
                  'No especificado'}
              </Text>

              <div style={{ background: '#fff7e6', padding: '15px', borderRadius: '15px' }}>
                <Text strong><ForkOutlined /> Menú Solicitado:</Text>
                {renderMenuItems(selectedTable.currentBooking)}
              </div>

              {(selectedTable.currentBooking.notes || selectedTable.currentBooking.observations) && (
                <div style={{ background: '#e6f7ff', padding: '15px', borderRadius: '15px' }}>
                  <Text strong><MessageOutlined /> Detalles Adicionales:</Text><br />
                  <Text italic>"{selectedTable.currentBooking.notes || selectedTable.currentBooking.observations}"</Text>
                </div>
              )}
            </Space>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Title level={4} type="danger">Mesa Ocupada</Title>
              <Text type="secondary">Esta mesa ya tiene una reserva en curso.</Text>
              <br />
              <Tag color="red" style={{ marginTop: 20, fontSize: 14, padding: '5px 15px' }}>
                <ClockCircleOutlined /> Ocupada desde las: {selectedTable.currentBooking.time}
              </Tag>
            </div>
          )
        )}
      </Modal>
    </div>
  );
};

TableMap.Layout = Dashboard;
export default TableMap;




///225