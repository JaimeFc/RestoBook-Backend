import { Row, Col, Card, Typography, Space, Avatar, Spin } from 'antd';
import { 
  CloudOutlined, DashboardOutlined, CalendarOutlined, 
  ShopOutlined, TeamOutlined, PieChartOutlined 
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
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [stats, setStats] = useState({
    totalMesas: 6,
    disponibles: 6,
    reservasHoy: 0,
    porcentajeOcupacion: 0
  });

  const loadData = useCallback(async () => {
    try {
      const userData = await authService.user();
      setUser(userData);

      const checkAdmin = 
        userData?.username?.toLowerCase().includes('admin') || 
        userData?.Role?.code === 'administrator' ||
        userData?.roleId === 2;
      
      setIsAdmin(checkAdmin);

      // --- ESTRATEGIA PARA EVITAR EL ERROR 400 ---
      // Probamos con la URL que suelen usar los controladores de administración
      const response = await fetch('/api/bookings?limit=100&page=1&filters=%7B%7D'); 
      
      if (response.ok) {
        const result = await response.json();
        
        // Verificamos múltiples estructuras posibles de respuesta (data, rows o array)
        const allBookings = result.data || result.rows || (Array.isArray(result) ? result : []);
        
        // Fecha de hoy según tu sistema: 2/4/2026
        const hoyFija = "2/4/2026";
        
        // Filtramos buscando cualquier coincidencia en fecha o calendario
        const reservasDeHoy = allBookings.filter(b => {
          const campoFecha = (b.date || b.schedule || b.bookingDate || "").toString();
          return campoFecha.includes(hoyFija);
        });

        const totalCapacidad = 6;
        const numReservas = reservasDeHoy.length;

        setStats({
          totalMesas: totalCapacidad,
          disponibles: Math.max(0, totalCapacidad - numReservas),
          reservasHoy: numReservas,
          porcentajeOcupacion: Math.round((numReservas / totalCapacidad) * 100)
        });
      } else {
        console.error("El servidor rechazó la petición con estado:", response.status);
      }
    } catch (e) {
      console.error("Error cargando datos del dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <Loading />;

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      
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

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={isAdmin ? 6 : 12}>
          <StatCard 
            title={isAdmin ? "Gestión de Reservas" : "Mis Reservas"} 
            value={stats.reservasHoy} 
            subtitle="Reservas para hoy" 
            gradient="linear-gradient(135deg, #d2691e 0%, #a0522d 100%)" 
            icon={<CalendarOutlined />} 
            onClick={() => router.push('/base/bookings')} 
          />
        </Col>

        {isAdmin && (
          <Col xs={24} sm={12} lg={6}>
            <StatCard 
              title="Mesas Disponibles" 
              value={`${stats.disponibles}/${stats.totalMesas}`} 
              subtitle="Estado del salón" 
              gradient="linear-gradient(135deg, #6b8e23 0%, #556b2f 100%)" 
              icon={<ShopOutlined />} 
              onClick={() => router.push('/base/tables')} 
            />
          </Col>
        )}
        
        <Col xs={24} sm={12} lg={isAdmin ? 6 : 12}>
          <StatCard
            title="Clima" value="11°C" subtitle="Nubes"
            gradient="linear-gradient(135deg, #5f9ea0 0%, #4682b4 100%)" icon={<CloudOutlined />}
          />
        </Col>

        {isAdmin && (
          <Col xs={24} sm={12} lg={6}>
            <StatCard 
              title="Ocupación" 
              value={`${stats.porcentajeOcupacion}%`} 
              subtitle="Capacidad utilizada" 
              gradient="linear-gradient(135deg, #db7093 0%, #c71585 100%)" 
              icon={<PieChartOutlined />} 
            />
          </Col>
        )}
      </Row>

      {isAdmin && (
        <Card 
          title={<Space><DashboardOutlined /> Panel de Administración</Space>} 
          bordered={false} 
          style={{ borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
        >
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