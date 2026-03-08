import { Row, Col, Card, Typography, Space, Avatar, Modal, Statistic, Divider } from 'antd';
import { 
  CloudOutlined, 
  EnvironmentOutlined, 
  DashboardOutlined, 
  CalendarOutlined,
  UserOutlined,
  ShopOutlined, // Para Mesas
  TeamOutlined, // Para Clientes
  PieChartOutlined, // Para Ocupación
  CoffeeOutlined, // Icono extra gourmet
  InfoCircleOutlined
} from '@ant-design/icons';
import Dashboard from '@ui/layout/Dashboard';
import Loading from '@ui/common/Loading';
import DashboardList from '@ui/common/Dashboard/List';
import { useState, useEffect, useCallback } from 'react';
import { authService } from '@services/auth.service';

const { Title, Text } = Typography;

const StatCard = ({ title, value, icon, gradient, subtitle, onClick, loading }) => (
  <Card
    bordered={false}
    onClick={onClick}
    style={{
      borderRadius: 24,
      background: gradient, // Aquí aplicamos los nuevos colores terrosos
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
      height: '100%',
      cursor: onClick ? 'pointer' : 'default',
    }}
    hoverable={!!onClick}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div>
        <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 13, fontWeight: 500 }}>{title}</Text>
        <Title level={2} style={{ color: '#fff', margin: '4px 0', fontSize: 28 }}>
          {loading ? '--' : value}
        </Title>
        <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}>{subtitle}</Text>
      </div>
      <Avatar size={50} style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }} icon={icon} />
    </div>
  </Card>
);

const Home = () => {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const userData = await authService.user();
      setUser(userData);

      // Tu API de clima
      const res = await fetch('/api/weather?city=Quito', {
        headers: { 'x-resto-token': 'RestoBook2026' } 
      });
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <Loading />;

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {/* BANNER PRINCIPAL: Terracotta/Espresso */}
      <Card bordered={false} style={{ borderRadius: 24, background: 'linear-gradient(135deg, #8b4513 0%, #5d2e0a 100%)' }}>
        <Title level={2} style={{ color: '#fff', margin: 0 }}>
          ¡Buenas noches, {user?.Person?.firstName || 'ADMINISTRADOR'}!
        </Title>
        <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          Sistema de Gestión de Reservas - RestoBook
        </Text>
      </Card>

      <Row gutter={[16, 16]}>
        {/* RESERVAS: Terracotta */}
        <Col xs={24} sm={12} lg={5}>
          <StatCard 
            title="Reservas Hoy" 
            value="35" 
            subtitle="12 pendientes" 
            gradient="linear-gradient(135deg, #d2691e 0%, #a0522d 100%)" 
            icon={<CalendarOutlined />} 
          />
        </Col>

        {/* MESAS: Verde Olivo (Antes era Canchas) */}
        <Col xs={24} sm={12} lg={5}>
          <StatCard 
            title="Mesas Disponibles" 
            value="18/25" 
            subtitle="7 ocupadas" 
            gradient="linear-gradient(135deg, #6b8e23 0%, #556b2f 100%)" 
            icon={<ShopOutlined />} 
          />
        </Col>
        
        {/* CLIMA: Teal Apagado */}
        <Col xs={24} sm={12} lg={4}>
          <StatCard
            title="Estado del Clima"
            value={weather ? `${weather.temperatura}°C` : '--'}
            subtitle={weather ? weather.descripcion : 'Obteniendo datos...'}
            gradient="linear-gradient(135deg, #5f9ea0 0%, #4682b4 100%)"
            icon={weather ? <img src={weather.icono} width="35" /> : <CloudOutlined />}
            onClick={() => weather && setIsModalVisible(true)}
          />
        </Col>

        {/* CLIENTES: Plum/Morado */}
        <Col xs={24} sm={12} lg={5}>
          <StatCard 
            title="Nuevos Clientes" 
            value="22" 
            subtitle="Este mes" 
            gradient="linear-gradient(135deg, #800080 0%, #4b0082 100%)" 
            icon={<TeamOutlined />} 
          />
        </Col>

        {/* OCUPACIÓN: Rosa Polvoriento */}
        <Col xs={24} sm={12} lg={5}>
          <StatCard 
            title="Ocupación" 
            value="72%" 
            subtitle="Promedio semanal" 
            gradient="linear-gradient(135deg, #db7093 0%, #c71585 100%)" 
            icon={<PieChartOutlined />} 
          />
        </Col>
      </Row>

      <Card title="Panel de Gestión" bordered={false} style={{ borderRadius: 24 }}>
        <DashboardList menuCode="admhead" />
      </Card>

      {/* MODAL DETALLADO */}
      <Modal
        title={<Space><EnvironmentOutlined /> Pronóstico RestoBook</Space>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        centered
      >
        {weather && (
          <div style={{ textAlign: 'center' }}>
            <img src={weather.icono} width="100" />
            <Statistic value={weather.temperatura} suffix="°C" />
            <Text strong style={{ textTransform: 'capitalize' }}>{weather.descripcion}</Text>
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="Humedad" value={weather.humedad} suffix="%" prefix={<DashboardOutlined />} />
              </Col>
              <Col span={12}>
                <Statistic title="Viento" value={weather.viento} suffix=" m/s" prefix={<InfoCircleOutlined />} />
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </Space>
  );
};

Home.Layout = Dashboard;
export default Home;