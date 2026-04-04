import { Layout, Drawer, Button, Space, Typography, Spin } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import UserSettingMenu from '@ui/layout/UserSettingMenu';
import SidebarList from '@ui/layout/SidebarList';
import AppBar from '@ui/layout/AppBar';
import DrawerHeader from '@ui/layout/DrawerHeader';
import Main from '@ui/layout/Main';
import Logo from '@ui/layout/Logo';
import { isMobile } from 'react-device-detect';
import { useRouter } from 'next/router';
import { authService } from '@services/auth.service';
import { useState, useEffect, cloneElement } from 'react'; 
import { useDispatch } from 'react-redux';
import { set } from '@redux/reducers/accessSlice';
import { set as setRoles } from '@redux/reducers/rolesSlice';
import { userService } from '@services/user.service';

const { Sider } = Layout;
const { Text } = Typography;

const drawerWidth = 260;

const Dashboard = (props) => {
  const [open, setOpen] = useState(!isMobile);
  const [user, setUser] = useState({});
  const [restaurantData, setRestaurantData] = useState(null);
  const [stats, setStats] = useState(null); 
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const loadAllData = async () => {
      try {
        // 1. Cargar Usuario y Permisos
        const userData = await authService.public.user();
        setUser(userData);
        
        const access = await userService.getAccess();
        dispatch(set(access || {}));
        
        const roles = await userService.roles();
        dispatch(setRoles(roles || {}));

        // 2. Cargar Datos del Restaurante
        const resRest = await fetch('/api/restaurant');
        if (resRest.ok) {
          const restInfo = await resRest.json();
          setRestaurantData(restInfo);
        }

        // 3. CARGAR ESTADÍSTICAS (Solo se cargan si es admin para ahorrar recursos)
        // Se mantiene la llamada pero la protegemos en el render
        const resStats = await fetch('/api/dashboard/stats');
        if (resStats.ok) {
          const statsData = await resStats.json();
          setStats(statsData);
        }

      } catch (error) {
        if (error === 'No autorizado' || error === 'Sesión caducada')
          return await router.replace('/auth/signin');
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [dispatch, router]);

  const handleDrawerToggle = () => setOpen(!open);
  const handleOpen = () => isMobile ? setOpen(!open) : null;
  const handleDrawerClose = () => setOpen(false);

  const getCompanyName = () => {
    if (restaurantData?.name) return restaurantData.name.toUpperCase();
    return (user?.Institution?.name || 'Restobook').toUpperCase();
  };

  const getCompanyIsologo = () => {
    return user?.Institution?.logo || 'https://img.icons8.com/?size=100&id=51071&format=png&color=8B4513';
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spin size="large" tip="Iniciando sistema..." />
    </div>
  );

  const siderContent = (
    <>
      <DrawerHeader>
        <Logo logo={getCompanyIsologo()} collapsed={!open} />
        {open && (
          <Text style={{ color: '#5d2e0a', fontWeight: 600, fontSize: 16, textAlign: 'center', padding: '0 16px 16px', lineHeight: 1.5 }}>
            {getCompanyName()}
          </Text>
        )}
      </DrawerHeader>
      <SidebarList handleOpen={handleOpen} collapsed={!open} user={user} />
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppBar open={open} style={{ background: 'linear-gradient(135deg, #c06320 0%, #944305 100%)', borderBottom: 'none' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space align="center" size={16}>
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 18 }} />}
              onClick={handleDrawerToggle}
              style={{ color: 'white', height: 40, width: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
            <Text style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>
              Sistema de Gestión - {restaurantData?.name || 'RestoBook'}
            </Text>
          </Space>
          <UserSettingMenu user={user} />
        </Space>
      </AppBar>

      {isMobile ? (
        <Drawer placement="left" onClose={handleDrawerClose} open={open} width={drawerWidth} styles={{ body: { padding: 0, background: '#ffffff' } }}>
          {siderContent}
        </Drawer>
      ) : (
        <Sider width={drawerWidth} collapsed={!open} collapsedWidth={72} trigger={null} style={{ background: '#ffffff', boxShadow: '2px 0 16px rgba(0, 0, 0, 0.06)', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 1000 }}>
          <div style={{ height: '100%', overflow: 'auto' }}>{siderContent}</div>
        </Sider>
      )}

      <Layout>
        <Main open={open}>
          {cloneElement(props.children, { 
         // Mantenemos tu lógica de stats pero pasamos el user completo
          stats: user?.role === 'admin' ? stats : null,
          user: user 
  })}
        </Main>
      </Layout>
    </Layout>
  );
};

export default Dashboard;