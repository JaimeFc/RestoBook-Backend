import React from 'react';
import { Menu, Tooltip } from 'antd';
import { useRouter } from 'next/router';
import { isMobile } from 'react-device-detect';
import * as Icons from '@ant-design/icons';
import styled from 'styled-components';

const StyledMenuItem = styled(Menu.Item)`
  /* Estilo clásico de Ant Design con toques modernos */
  font-size: 14px;
  height: 40px;
  line-height: 40px;
  margin: 0;
  padding-left: 24px !important;

  .anticon {
    font-size: 16px;
    min-width: 16px;
    margin-right: 10px;
  }
`;

const SidebarListItem = ({ icon, text, dir, urls, handleOpen }) => {
  const router = useRouter();
  
  // Limpiamos la construcción del link para evitar dobles barras o valores extraños
  const link = dir ? (urls ? `${dir}/${urls}` : dir) : '#';

  const onClick = async () => {
    if (link !== '#') {
      await router.push(link);
      if (isMobile) handleOpen();
    }
  };

  const getIcon = (iconName) => {
    if (!iconName) return null;

    // VALIDACIÓN CLAVE: Si el icono ya es un componente/objeto de React, devolverlo directamente
    if (typeof iconName !== 'string') {
      return iconName; 
    }

    const iconMap = {
      dashboard: 'DashboardOutlined',
      person: 'UserOutlined',
      settings: 'SettingOutlined',
      home: 'HomeOutlined',
      menu: 'MenuOutlined',
      folder: 'FolderOutlined',
      description: 'FileTextOutlined',
      assignment: 'FormOutlined',
      people: 'TeamOutlined',
      business: 'BankOutlined',
      list: 'UnorderedListOutlined',
      edit: 'EditOutlined',
      delete: 'DeleteOutlined',
      add: 'PlusOutlined',
      calendar: 'CalendarOutlined',
      field: 'FieldTimeOutlined',
      shop: 'ShopOutlined',
      pie: 'PieChartOutlined'
    };

    // Buscamos el nombre del icono en el mapa, si no existe usamos FileOutlined por defecto
    const antIconName = iconMap[iconName.toLowerCase()] || 'FileOutlined';
    const IconComponent = Icons[antIconName];

    return IconComponent ? <IconComponent /> : <Icons.FileOutlined />;
  };

  return (
    <Tooltip title={text} placement="right">
      <StyledMenuItem key={link} icon={getIcon(icon)} onClick={onClick}>
        {text}
      </StyledMenuItem>
    </Tooltip>
  );
};

export default SidebarListItem;