import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from '@ui/layout/Dashboard';
import { 
  Button, Tag, Space, Typography, Card, Table, Modal, 
  Form, InputNumber, message, Select, Popconfirm, Divider , Badge
} from 'antd';
import { 
  PlusOutlined, CoffeeOutlined, EnvironmentOutlined, 
  ReloadOutlined, DeleteOutlined, EditOutlined,
  CheckCircleOutlined, StopOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const TablesManager = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [editingTable, setEditingTable] = useState(null);
  const [form] = Form.useForm();

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tables'); 
      const result = await response.json();
      
      if (response.ok) {
        const data = Array.isArray(result) ? result : (result.data || []);
        setDataSource(data);
      } else {
        const responseAlt = await fetch('/api/table');
        const dataAlt = await responseAlt.json();
        if (responseAlt.ok) {
          setDataSource(Array.isArray(dataAlt) ? dataAlt : (dataAlt.data || []));
        } else {
          message.error('Error al cargar mesas del servidor');
        }
      }
    } catch (error) {
      message.error('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const handleEdit = (record) => {
    setEditingTable(record);
    form.setFieldsValue({
      ...record,
      active: record.active ?? true 
    });
    setIsModalVisible(true);
  };

  const showModal = () => {
    setEditingTable(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingTable(null);
    form.resetFields();
  };

  const onFinish = async (values) => {
    const isEditing = !!editingTable;
    const url = isEditing ? `/api/tables?id=${editingTable.id}` : '/api/tables';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          number: parseInt(values.number),
          capacity: parseInt(values.capacity)
        }),
      });

      if (response.ok) {
        message.success(isEditing ? 'Mesa actualizada' : 'Mesa creada');
        handleCancel();
        fetchTables();
      } else {
        const res = await response.json();
        message.error(res.error || 'Error en la operación');
      }
    } catch (error) {
      message.error('Error de red');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/tables?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        message.success('Mesa eliminada');
        fetchTables();
      }
    } catch (error) {
      message.error('No se pudo eliminar');
    }
  };

  const columns = [
    {
      title: 'MESA #',
      dataIndex: 'number',
      key: 'number',
      sorter: (a, b) => a.number - b.number,
      // Color café para las etiquetas de mesa
      render: (num) => <Tag color="#8b4513" style={{ fontWeight: 'bold', borderRadius: '4px' }}>Mesa {num}</Tag>,
    },
    {
      title: 'UBICACIÓN',
      dataIndex: 'location',
      key: 'location',
      render: (loc) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#8b4513' }} /> 
          <Text strong style={{ color: '#555' }}>{loc || 'Sin asignar'}</Text>
        </Space>
      ),
    },
    {
      title: 'CAPACIDAD',
      dataIndex: 'capacity',
      key: 'capacity',
      align: 'center',
      render: (cap) => <Badge count={`${cap} Pax`} style={{ backgroundColor: '#52c41a' }} />,
    },
    {
      title: 'ESTADO',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const isAvailable = status === 'available';
        return (
          <Tag 
            color={isAvailable ? 'success' : 'error'} 
            icon={isAvailable ? <CheckCircleOutlined /> : <StopOutlined />}
            style={{ padding: '2px 10px', borderRadius: '12px' }}
          >
            {isAvailable ? 'DISPONIBLE' : 'OCUPADA'}
          </Tag>
        );
      },
    },
    {
      title: 'ACCIONES',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            size="small"
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)} 
            style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', borderRadius: '6px' }}
          >
            Editar
          </Button>
          <Popconfirm 
            title="¿Eliminar esta mesa?" 
            onConfirm={() => handleDelete(record.id)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />}>Borrar</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}><CoffeeOutlined /> Gestión de Activos: Mesas</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchTables}>Refrescar</Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showModal} 
            style={{ background: '#8b4513', borderColor: '#8b4513', borderRadius: '8px', height: '40px' }}
          >
            AÑADIR MESA
          </Button>
        </Space>
      </div>

      <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
        <Table 
          columns={columns} 
          dataSource={dataSource} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 8 }} 
        />
      </Card>

      <Modal 
        title={editingTable ? "🔧 Modificar Mesa" : "✨ Nueva Mesa"} 
        open={isModalVisible} 
        onCancel={handleCancel} 
        footer={null}
        destroyOnClose
        centered
      >
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ status: 'available' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item label="Número de Mesa" name="number" rules={[{ required: true, message: 'Falta número' }]}>
              <InputNumber min={1} style={{ width: '100%' }} placeholder="Ej: 1" /> 
            </Form.Item>

            <Form.Item label="Capacidad (Pax)" name="capacity" rules={[{ required: true, message: 'Falta capacidad' }]}>
              <InputNumber min={1} max={20} style={{ width: '100%' }} placeholder="Ej: 4" />
            </Form.Item>
          </div>

          <Form.Item label="Ubicación o Zona" name="location" rules={[{ required: true, message: 'Seleccione zona' }]}>
            <Select placeholder="Selecciona zona">
              <Option value="Terraza">🍀 Terraza</Option>
              <Option value="Centro">🏠 Salón Principal</Option>
              <Option value="VIP">💎 Zona VIP</Option>
              <Option value="Barra">🍺 Barra</Option>
              <Option value="Ventana">🪟 Ventana</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Estado Inicial" name="status">
            <Select>
              <Option value="available">🟢 Disponible</Option>
              <Option value="occupied">🔴 Ocupada</Option>
            </Select>
          </Form.Item>

          <Divider style={{ margin: '12px 0' }} />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel} style={{ borderRadius: '6px' }}>Cancelar</Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                style={{ background: '#8b4513', borderColor: '#8b4513', borderRadius: '6px' }}
              >
                {editingTable ? 'Guardar Cambios' : 'Crear Mesa'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

TablesManager.Layout = Dashboard;
export default TablesManager;