import { Row, Col, Card, Typography, Space, Avatar, Button } from 'antd';
import { 
  CloudOutlined, DashboardOutlined, CalendarOutlined, 
  ShopOutlined, PieChartOutlined, ReloadOutlined 
} from '@ant-design/icons';
import Dashboard from '@ui/layout/Dashboard';
import Loading from '@ui/common/Loading';
import DashboardList from '@ui/common/Dashboard/List';
import { useState, useEffect, useCallback } from 'react';
import { authService } from '@services/auth.service';
import { useRouter } from 'next/router';

const { Title, Text } = Typography;

const StatCard = ({ title, value, icon, gradient, subtitle, onClick }) => (
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
        <Title level={2} style={{ color: '#fff', margin: '4px 0', fontSize: 28 }}>{value}</Title>
        <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}>{subtitle}</Text>
      </div>
      <Avatar size={50} style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }} icon={icon} />
    </div>
  </Card>
);

const Home = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Estado para el botón de recarga
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentDateFilter, setCurrentDateFilter] = useState(''); 
  
  const [stats, setStats] = useState({
    totalMesas: 7,
    disponibles: 7,
    reservasHoy: 0,
    ocupacion: 0
  });

  // Función de carga de datos separada para poder reutilizarla
  const fetchStats = useCallback(async (showLoading = false) => {
    if (showLoading) setRefreshing(true);
    try {
      const resStats = await fetch('/api/dashboard/stats');
      if (resStats.ok) {
        const data = await resStats.json();
        setStats({
          totalMesas: data.totalMesas,
          disponibles: data.mesasDisponibles,
          reservasHoy: data.reservasHoy,
          ocupacion: data.ocupacion
        });
      }
    } catch (e) {
      console.error("Error al sincronizar estadísticas:", e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      const userData = await authService.user();
      setUser(userData);
      setIsAdmin(userData?.Role?.code === 'administrator' || userData?.roleId === 2);

      const hoy = new Date();
      setCurrentDateFilter(`${hoy.getDate()}/${hoy.getMonth() + 1}/${hoy.getFullYear()}`); 

      await fetchStats();
    } catch (e) {
      console.error("Error inicial:", e);
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  useEffect(() => {
    loadInitialData();
    
    // AUTO-REFRESCO: Se actualiza cada 30 segundos automáticamente
    const interval = setInterval(() => {
      fetchStats();
    }, 30000); 

    return () => clearInterval(interval);
  }, [loadInitialData, fetchStats]);

  if (loading) return <Loading />;

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <Card bordered={false} style={{ 
            borderRadius: 24, 
            background: 'linear-gradient(135deg, #8b4513 0%, #5d2e0a 100%)',
            boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
          }}>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              ¡Bienvenido, {user?.Person?.firstName || user?.username || 'ADMINISTRADOR'}!
            </Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 16 }}>
              {isAdmin ? 'Panel de Gestión - Modo Administrador' : 'Modo: Usuario Personal'}
            </Text>
          </Card>
        </div>
        <Button 
          type="text" 
          icon={<ReloadOutlined spin={refreshing} />} 
          onClick={() => fetchStats(true)}
          style={{ marginLeft: 16, color: '#8b4513' }}
        >
          Actualizar ahora
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard 
            title="Gestión de Reservas" 
            value={stats.reservasHoy} 
            subtitle="Reservas para hoy" 
            gradient="linear-gradient(135deg, #d2691e 0%, #a0522d 100%)"
            icon={<CalendarOutlined />} 
            onClick={() => router.push(`/base/bookings?date=${currentDateFilter}`)} 
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard 
            title="Mesas Disponibles" 
            value={`${stats.disponibles}/${stats.totalMesas}`} 
            subtitle="Estado actual del salón" 
            gradient="linear-gradient(135deg, #6b8e23 0%, #556b2f 100%)"
            icon={<ShopOutlined />} 
            onClick={() => router.push('/base/tables')} 
          />
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Estado del Clima" 
            value="12°C" 
            subtitle="Nubes"
            gradient="linear-gradient(135deg, #5f9ea0 0%, #4682b4 100%)"
            icon={<CloudOutlined />}
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard 
            title="Ocupación" 
            value={`${stats.ocupacion}%`} 
            subtitle="Capacidad utilizada" 
            gradient="linear-gradient(135deg, #db7093 0%, #c71585 100%)"
            icon={<PieChartOutlined />} 
          />
        </Col>
      </Row>

      {isAdmin && (
        <Card title={<Space><DashboardOutlined /> Panel de Gestión de Restaurante</Space>} bordered={false} style={{ borderRadius: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
              <DashboardList menuCode="admhead" />
              <DashboardList menuCode="adm-resto" />
              <DashboardList menuCode="adm-tables" />
          </Space>
        </Card>
      )}
    </Space>
  );
};

Home.Layout = Dashboard;
export default Home;




////191 lineas en estado correcto