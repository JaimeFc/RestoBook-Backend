import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from '@ui/layout/Dashboard';
import { 
  Button, Tag, Space, Typography, Card, Table, Modal, 
  Form, InputNumber, message, Select, Popconfirm, Switch 
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

  // Traer mesas (sin filtros restrictivos desde el backend idealmente)
  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      // Usamos la API que creamos para el mapa o la general de tablas
      const response = await fetch('/api/table'); 
      const data = await response.json();
      if (response.ok) {
        setDataSource(data);
      } else {
        message.error('Error al cargar datos');
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
      active: record.active ?? true // Aseguramos que el switch tenga valor
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
    // Si es edición usamos el ID en el query o body según tu API
    const url = isEditing ? `/api/table?id=${editingTable.id}` : '/api/table';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          // Forzamos conversión a número para evitar errores de Prisma/DB
          number: parseInt(values.number),
          capacity: parseInt(values.capacity)
        }),
      });

      if (response.ok) {
        message.success(isEditing ? 'Mesa actualizada con éxito' : 'Nueva mesa creada');
        handleCancel();
        fetchTables();
      } else {
        const res = await response.json();
        message.error(res.error || 'Error en la operación');
      }
    } catch (error) {
      message.error('Error de red al procesar la solicitud');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/table?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        message.success('Mesa eliminada del sistema');
        fetchTables();
      }
    } catch (error) {
      message.error('No se pudo eliminar la mesa');
    }
  };

  const columns = [
    {
      title: 'MESA #',
      dataIndex: 'number',
      key: 'number',
      sorter: (a, b) => a.number - b.number,
      render: (num) => <Tag color="volcano" style={{ fontWeight: 'bold' }}>Mesa {num}</Tag>,
    },
    {
      title: 'UBICACIÓN',
      dataIndex: 'location',
      key: 'location',
      render: (loc) => <Space><EnvironmentOutlined style={{ color: '#8b4513' }} /> {loc}</Space>,
    },
    {
      title: 'CAPACIDAD',
      dataIndex: 'capacity',
      key: 'capacity',
      align: 'center',
      render: (cap) => <Text strong>{cap} Pax</Text>,
    },
    {
      title: 'ESTADO',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'available' ? 'green' : 'red'} icon={status === 'available' ? <CheckCircleOutlined /> : <StopOutlined />}>
          {status === 'available' ? 'DISPONIBLE' : 'OCUPADA'}
        </Tag>
      ),
    },
    {
      title: 'VISIBILIDAD',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'blue' : 'default'}>
          {active ? 'ACTIVA' : 'INACTIVA'}
        </Tag>
      ),
    },
    {
      title: 'ACCIONES',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ color: '#1890ff' }}>
            Editar
          </Button>
          <Popconfirm 
            title="¿Estás seguro de eliminar esta mesa?" 
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
            style={{ background: '#8b4513', borderColor: '#8b4513', borderRadius: '8px' }}
          >
            AÑADIR MESA
          </Button>
        </Space>
      </div>

      <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Table 
          columns={columns} 
          dataSource={dataSource} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 8 }} 
        />
      </Card>

      <Modal 
        title={editingTable ? "🔧 Modificar Parámetros de Mesa" : "✨ Registrar Nueva Mesa"} 
        open={isModalVisible} 
        onCancel={handleCancel} 
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ active: true, status: 'available' }}>
          <Space style={{ display: 'flex' }} align="baseline">
            <Form.Item label="Número" name="number" rules={[{ required: true, message: 'Requerido' }]}>
              <InputNumber min={1} style={{ width: '100%' }} placeholder="Ej: 5" /> 
            </Form.Item>

            <Form.Item label="Capacidad" name="capacity" rules={[{ required: true, message: 'Requerido' }]}>
              <InputNumber min={1} max={20} style={{ width: '100%' }} placeholder="Pax" />
            </Form.Item>
            
            <Form.Item label="¿Visible/Activa?" name="active" valuePropName="checked">
              <Switch checkedChildren="SÍ" unCheckedChildren="NO" />
            </Form.Item>
          </Space>

          <Form.Item label="Ubicación o Zona" name="location" rules={[{ required: true, message: 'Selecciona zona' }]}>
            <Select placeholder="Selecciona dónde se ubica">
              <Option value="Terraza">🍀 Terraza</Option>
              <Option value="Centro">🏠 Salón Principal</Option>
              <Option value="VIP">💎 Zona VIP</Option>
              <Option value="Barra">🍺 Barra</Option>
              <Option value="Ventana">🪟 Ventana</Option>
            </Select>
          </Form.Item>

          {editingTable && (
            <Form.Item label="Estado Operativo" name="status">
              <Select>
                <Option value="available">🟢 Disponible (Libre)</Option>
                <Option value="occupied">🔴 Ocupada (En servicio)</Option>
              </Select>
            </Form.Item>
          )}

          <Divider style={{ margin: '12px 0' }} />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>Cancelar</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#8b4513', borderColor: '#8b4513' }}>
                {editingTable ? 'Guardar Cambios' : 'Crear Mesa'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Componente Divider simple (si no quieres importarlo de antd)
const Divider = ({ style }) => <div style={{ borderTop: '1px solid #f0f0f0', width: '100%', ...style }} />;

TablesManager.Layout = Dashboard;
export default TablesManager;