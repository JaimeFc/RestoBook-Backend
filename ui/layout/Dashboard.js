import { Layout, Drawer, Button, Space, Typography } from 'antd';
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
import { useState, useEffect } from 'react';
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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.public.user();
        setUser(user);
        const access = await userService.getAccess();
        dispatch(set(access || {}));
        const roles = await userService.roles();
        dispatch(setRoles(roles || {}));
      } catch (error) {
        if (error === 'No autorizado' || error === 'Sesión caducada')
          return await router.replace('/auth/signin');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [dispatch, router]);

  const handleOpen = () => {
    isMobile ? setOpen(!open) : null;
  };

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const getCompanyName = () => {
    const name = user?.Institution?.name;
    return (name || 'Restobook').toUpperCase();
  };

  const getCompanyIsologo = () => {
    return user?.Institution?.logo || 'https://img.icons8.com/?size=100&id=51071&format=png&color=8B4513';
  };

  if (loading) return <></>;

  const siderContent = (
    <>
      <DrawerHeader>
        <Logo logo={getCompanyIsologo()} collapsed={!open} />
        {open && (
          <Text
            style={{
              color: '#5d2e0a',
              fontWeight: 600,
              fontSize: 16,
              textAlign: 'center',
              padding: '0 16px 16px',
              lineHeight: 1.5,
            }}
          >
            {getCompanyName()}
          </Text>
        )}
      </DrawerHeader>
      <SidebarList handleOpen={handleOpen} collapsed={!open} />
    </>
  );

  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        '--dashboard-header': 'linear-gradient(135deg, #8b4513 0%, #5d2e0a 100%)',
        '--dashboard-bg': '#f8fafc',
        '--sidebar-bg': '#ffffff',
      }}
    >
      {/* SE AGREGÓ EL STYLE DIRECTO PARA FORZAR EL COLOR SOBRE EL AZUL */}
      <AppBar 
        open={open} 
        style={{ 
          background: 'linear-gradient(135deg, #c06320 0%, #944305 100%)',
          borderBottom: 'none'
        }}
      >
        <Space
          style={{
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space align="center" size={16}>
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 18 }} />}
              onClick={handleDrawerToggle}
              style={{
                color: 'white',
                height: 40,
                width: 40,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            />
            <Text style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>
              Sistema de Gestión - RestoBook
            </Text>
          </Space>
          <UserSettingMenu user={user} />
        </Space>
      </AppBar>

      {isMobile ? (
        <Drawer
          placement="left"
          onClose={handleDrawerClose}
          open={open}
          width={drawerWidth}
          styles={{
            header: {
              background: 'linear-gradient(135deg, #8b4513 0%, #5d2e0a 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            },
            body: {
              padding: 0,
              background: '#ffffff',
            },
          }}
        >
          {siderContent}
        </Drawer>
      ) : (
        <Sider
          width={drawerWidth}
          collapsed={!open}
          collapsedWidth={72}
          trigger={null}
          style={{
            background: '#ffffff',
            boxShadow: '2px 0 16px rgba(0, 0, 0, 0.06)',
            borderRight: '1px solid #f1f5f9',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            overflow: 'hidden',
            zIndex: 1000,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div
            style={{
              height: '100%',
              overflow: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#8b4513 transparent',
            }}
          >
            {siderContent}
          </div>
        </Sider>
      )}

      <Layout>
        <Main open={open}>{props.children}</Main>
      </Layout>
    </Layout>
  );
};

export default Dashboard;