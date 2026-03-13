import { Row, Col, Card, Typography, Space, Avatar, Modal, Statistic, Divider, Spin } from 'antd';
import { 
  CloudOutlined, 
  EnvironmentOutlined, 
  DashboardOutlined, 
  CalendarOutlined,
  ShopOutlined, 
  TeamOutlined, 
  PieChartOutlined, 
  InfoCircleOutlined
} from '@ant-design/icons';
import Dashboard from '@ui/layout/Dashboard';
import Loading from '@ui/common/Loading';
import DashboardList from '@ui/common/Dashboard/List';
import { useState, useEffect, useCallback } from 'react';
import { authService } from '@services/auth.service';
import { useRouter } from 'next/router';

const { Title, Text } = Typography;

// Componente interno para las tarjetas de estadísticas
const StatCard = ({ title, value, icon, gradient, subtitle, onClick, loading }) => (
  <Card
    bordered={false}
    onClick={onClick}
    style={{
      borderRadius: 24,
      background: gradient,
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
          {loading ? <Spin size="small" /> : value}
        </Title>
        <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}>{subtitle}</Text>
      </div>
      <Avatar size={50} style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }} icon={icon} />
    </div>
  </Card>
);

const Home = () => {
  const router = useRouter();
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const [restaurant, setRestaurant] = useState(null);
  const [stats, setStats] = useState({ 
    reservasHoy: 0, 
    mesasDisponibles: 0, 
    totalMesas: 0, 
    ocupacion: 0 
  });

  const loadData = useCallback(async () => {
    try {
      // 1. Obtener usuario autenticado
      const userData = await authService.user();
      setUser(userData);

      // 2. Cargar datos del restaurante configurado
      const resResto = await fetch('/api/restaurant');
      if (resResto.ok) {
        const dataResto = await resResto.json();
        setRestaurant(dataResto);
      }

      // 3. Cargar estadísticas reales desde la nueva API que creamos
      const resStats = await fetch('/api/menu/dashboard/stats');
      if (resStats.ok) {
        const dataStats = await resStats.json();
        setStats(dataStats);
      }

      // 4. Cargar clima (API interna)
      const resWeather = await fetch('/api/weather?city=Quito', {
        headers: { 'x-resto-token': 'RestoBook2026' } 
      });
      if (resWeather.ok) {
        const dataWeather = await resWeather.json();
        setWeather(dataWeather);
      }
    } catch (e) {
      console.error("Error cargando Dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <Loading />;

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {/* Banner Superior Dinámico */}
      <Card bordered={false} style={{ 
        borderRadius: 24, 
        background: restaurant ? 'linear-gradient(135deg, #8b4513 0%, #5d2e0a 100%)' : 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)' 
      }}>
        <Title level={2} style={{ color: '#fff', margin: 0 }}>
          ¡Bienvenido a {restaurant?.name || 'RestoBook'}, {user?.Person?.firstName || 'Admin'}!
        </Title>
        <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          {restaurant ? `Gestionando sucursal: ${restaurant.address || 'Sin dirección'}` : 'Configure su restaurante para empezar.'}
        </Text>
      </Card>

      {/* Grid de Estadísticas con Clic Funcional */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={5}>
          <StatCard 
            title="Reservas Hoy" 
            value={stats.reservasHoy} 
            subtitle="Ver agenda del día" 
            gradient="linear-gradient(135deg, #d2691e 0%, #a0522d 100%)" 
            icon={<CalendarOutlined />} 
            onClick={() => router.push('/base/bookings')} // Redirige a Reservas
          />
        </Col>

        <Col xs={24} sm={12} lg={5}>
          <StatCard 
            title="Mesas Disponibles" 
            value={`${stats.mesasDisponibles}/${stats.totalMesas}`} 
            subtitle="Estado del salón" 
            gradient="linear-gradient(135deg, #6b8e23 0%, #556b2f 100%)" 
            icon={<ShopOutlined />} 
            onClick={() => router.push('/base/tables')} // Redirige a Mesas
          />
        </Col>
        
        <Col xs={24} sm={12} lg={4}>
          <StatCard
            title="Estado del Clima"
            value={weather ? `${weather.temperatura}°C` : '--'}
            subtitle={weather ? weather.descripcion : 'Obteniendo...'}
            gradient="linear-gradient(135deg, #5f9ea0 0%, #4682b4 100%)"
            icon={weather ? <img src={weather.icono} width="35" alt="icon" /> : <CloudOutlined />}
            onClick={() => weather && setIsModalVisible(true)}
          />
        </Col>

        <Col xs={24} sm={12} lg={5}>
          <StatCard 
            title="Nuevos Clientes" 
            value="--" 
            subtitle="Módulo Usuarios" 
            gradient="linear-gradient(135deg, #800080 0%, #4b0082 100%)" 
            icon={<TeamOutlined />} 
          />
        </Col>

        <Col xs={24} sm={12} lg={5}>
          <StatCard 
            title="Ocupación" 
            value={`${stats.ocupacion}%`} 
            subtitle="Capacidad utilizada" 
            gradient="linear-gradient(135deg, #db7093 0%, #c71585 100%)" 
            icon={<PieChartOutlined />} 
          />
        </Col>
      </Row>

      {/* Lista de Accesos Directos */}
      <Card title="Panel de Gestión de Restaurante" bordered={false} style={{ borderRadius: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
            <DashboardList menuCode="admhead" />
            <DashboardList menuCode="adm-resto" />
            <DashboardList menuCode="adm-tables" />
        </Space>
      </Card>

      {/* Modal de Detalle del Clima */}
      <Modal
        title={<Space><EnvironmentOutlined /> Pronóstico Detallado</Space>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        centered
      >
        {weather && (
          <div style={{ textAlign: 'center' }}>
            <img src={weather.icono} width="100" alt="weather" />
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