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
  
  // Estado para las estadísticas calculadas
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

      // 2. Cargar datos del restaurante
      const resResto = await fetch('/api/restaurant');
      if (resResto.ok) {
        const dataResto = await resResto.json();
        setRestaurant(dataResto);
      }

      // --- LOGICA DE ESTADISTICAS DINAMICAS CORREGIDA ---
      
      // A. Obtener todas las mesas para saber el total real
      const resTables = await fetch('/api/tables');
      const allTables = resTables.ok ? await resTables.json() : [];
      const totalMesasReal = allTables.length || 6; // Si falla, asume 6 por defecto

      // B. Obtener todas las reservas y FILTRAR ESTRICTAMENTE
      const resBookings = await fetch('/api/bookings');
      if (resBookings.ok) {
        const allBookings = await resBookings.json();
        
        // 1. OBTENEMOS LA FECHA ACTUAL LOCAL ESTRICTA (Sin desfases de zona horaria)
        // Construimos el string "YYYY-MM-DD" manualmente usando el año, mes y día local
        const ahora = new Date();
        const anio = ahora.getFullYear();
        const mes = String(ahora.getMonth() + 1).padStart(2, '0');
        const dia = String(ahora.getDate()).padStart(2, '0');
        const hoyString = `${anio}-${mes}-${dia}`; // Debería coincidir con b.date de la BD

        // 2. FILTRO DE RESERVAS CONFIRMADAS DE HOY
        const reservasHoyLista = allBookings.filter(reserva => {
          if (!reserva.date) return false;
          
          // Limpiar la fecha recibida (ej: "2026-03-30T10:00:00Z" -> "2026-03-30")
          const fechaReservaLimpia = reserva.date.split('T')[0];
          
          // CONDICIÓN ESTRICTA:
          // Debe ser la fecha de HOY Y debe estar en estado 'CONFIRMADA'
          // Ignora 'FINALIZADA', 'CANCELADA', etc. que sumaban las 18
          return fechaReservaLimpia === hoyString && reserva.status === 'CONFIRMADA';
        });

        // 3. CONTEO Y CÁLCULO FINAL (Pasará de 19 a 3)
        const numReservasHoy = reservasHoyLista.length; 
        const disponibles = totalMesasReal - numReservasHoy;
        
        // Cálculo del porcentaje de ocupación (ej: 3 / 6 * 100 = 50%)
        const porcentajeOcupacion = totalMesasReal > 0 
          ? Math.round((numReservasHoy / totalMesasReal) * 100) 
          : 0;

        setStats({
          reservasHoy: numReservasHoy,
          mesasDisponibles: disponibles < 0 ? 0 : disponibles,
          totalMesas: totalMesasReal,
          ocupacion: porcentajeOcupacion
        });
      }

      // 3. Cargar clima
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
      {/* Banner Superior */}
      <Card bordered={false} style={{ 
        borderRadius: 24, 
        background: restaurant ? 'linear-gradient(135deg, #8b4513 0%, #5d2e0a 100%)' : 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)' 
      }}>
        <Title level={2} style={{ color: '#fff', margin: 0 }}>
          ¡Bienvenido a {restaurant?.name || 'RestoBook Gourmet'}, {user?.Person?.firstName || 'ADMINISTRADOR'}!
        </Title>
        <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          {restaurant ? `Gestionando sucursal: ${restaurant.address || 'Calle Principal 123'}` : 'Configure su restaurante para empezar.'}
        </Text>
      </Card>

      {/* Grid de Estadísticas con Datos Reales y Corregidos */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={5}>
          <StatCard 
            title="Reservas Hoy" 
            value={stats.reservasHoy} // Ahora mostrará 3
            subtitle="Agenda del día" 
            gradient="linear-gradient(135deg, #d2691e 0%, #a0522d 100%)" 
            icon={<CalendarOutlined />} 
            onClick={() => router.push('/base/bookings')} 
          />
        </Col>

        <Col xs={24} sm={12} lg={5}>
          <StatCard 
            title="Mesas Disponibles" 
            value={`${stats.mesasDisponibles}/${stats.totalMesas}`} // Pasará de 0/6 a 3/6
            subtitle="Capacidad actual" 
            gradient="linear-gradient(135deg, #6b8e23 0%, #556b2f 100%)" 
            icon={<ShopOutlined />} 
            onClick={() => router.push('/base/tables')} 
          />
        </Col>
        
        <Col xs={24} sm={12} lg={4}>
          <StatCard
            title="Estado del Clima"
            value={weather ? `${weather.temperatura}°C` : '8°C'}
            subtitle={weather ? weather.descripcion : 'Lluvia ligera'}
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
            value={`${stats.ocupacion}%`} // Pasará de 317% a 50%
            subtitle="Uso de capacidad hoy" 
            gradient="linear-gradient(135deg, #db7093 0%, #c71585 100%)" 
            icon={<PieChartOutlined />} 
          />
        </Col>
      </Row>

      <Card title="Panel de Gestión de Restaurante" bordered={false} style={{ borderRadius: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
            <DashboardList menuCode="admhead" />
            <DashboardList menuCode="adm-resto" />
            <DashboardList menuCode="adm-tables" />
        </Space>
      </Card>
      {/* ... (Modal de clima igual) ... */}
    </Space>
  );
};

Home.Layout = Dashboard;
export default Home;