import { Row, Col, Card, Typography, Space, Avatar } from 'antd';
import { 
  CloudOutlined, DashboardOutlined, CalendarOutlined, 
  ShopOutlined, PieChartOutlined, UserAddOutlined 
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
  const [currentDateFilter, setCurrentDateFilter] = useState(''); 
  
  const [stats, setStats] = useState({
    totalMesas: 6,
    disponibles: 6,
    reservasHoy: 0,
    ocupacion: 0
  });

  const loadData = useCallback(async () => {
    try {
      const userData = await authService.user();
      setUser(userData);
      const checkAdmin = userData?.Role?.code === 'administrator' || userData?.roleId === 2;
      setIsAdmin(checkAdmin);

      // --- 1. DETECCIÓN DE FECHA (Hoy es 3/4/2026) ---
      const hoy = new Date();
      const fechaAPI = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      const dia = hoy.getDate();
      const mes = hoy.getMonth() + 1;
      const anio = hoy.getFullYear();
      
      // Este es el formato que tu DB entiende: "3/4/2026"
      const fechaDB = `${dia}/${mes}/${anio}`;
      setCurrentDateFilter(fechaDB); 

      // --- 2. LLAMADAS A LAS APIS ---
      const [resBookings] = await Promise.all([
        fetch('/api/bookings?limit=100')
      ]);

      if (resBookings.ok) {
        const data = await resBookings.json();
        const allBookings = data.data || data.rows || (Array.isArray(data) ? data : []);
        
        // Filtrado local para el contador de la Card
        const reservasHoy = allBookings.filter(b => {
          const fechaReserva = (b.date || "").toString();
          return fechaReserva.includes(fechaDB) || fechaReserva.includes(fechaAPI);
        });

        const total = 6;
        const count = reservasHoy.length;

        setStats({
          totalMesas: total,
          disponibles: Math.max(0, total - count),
          reservasHoy: count,
          ocupacion: Math.round((count / total) * 100)
        });
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
        <Col xs={24} sm={12} lg={6}>
          <StatCard 
            title="Gestión de Reservas" 
            value={stats.reservasHoy} 
            subtitle="Reservas para hoy" 
            gradient="linear-gradient(135deg, #d2691e 0%, #a0522d 100%)"
            icon={<CalendarOutlined />} 
            // AL HACER CLIC: Se envía la fecha a la página de reservas
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