import React, { useState, useEffect } from 'react';
import Dashboard from '@ui/layout/Dashboard';
import { 
  Button, Tag, Space, Typography, Card, Table, Modal, 
  Form, InputNumber, message, Select, Popconfirm 
} from 'antd';
import { 
  PlusOutlined, CoffeeOutlined, EnvironmentOutlined, 
  ReloadOutlined, DeleteOutlined, EditOutlined 
} from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const TablesManager = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [editingTable, setEditingTable] = useState(null); // Nuevo: rastrea si editamos
  const [form] = Form.useForm();

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/table');
      const data = await response.json();
      if (response.ok) setDataSource(data);
    } catch (error) {
      message.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTables(); }, []);

  // Función para abrir modal en modo edición
  const handleEdit = (record) => {
    setEditingTable(record);
    form.setFieldsValue(record); // Carga los datos de la mesa en el formulario
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
    const url = isEditing ? `/api/table?id=${editingTable.id}` : '/api/table';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
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
      const response = await fetch(`/api/table?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        message.success('Mesa eliminada');
        fetchTables();
      }
    } catch (error) {
      message.error('Error al eliminar');
    }
  };

  const columns = [
    {
      title: 'MESA #',
      dataIndex: 'number',
      key: 'number',
      render: (num) => <Tag color="orange">Mesa {num}</Tag>,
    },
    {
      title: 'UBICACIÓN',
      dataIndex: 'location',
      key: 'location',
      render: (loc) => <span><EnvironmentOutlined /> {loc}</span>,
    },
    {
      title: 'CAPACIDAD',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (cap) => <span>{cap} Personas</span>,
    },
    {
      title: 'ESTADO',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'available' ? 'green' : 'red'}>
          {status === 'available' ? 'DISPONIBLE' : 'OCUPADA'}
        </Tag>
      ),
    },
    {
      title: 'ACCIONES',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Modificar
          </Button>
          <Popconfirm title="¿Eliminar mesa?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>Eliminar</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Title level={3}><CoffeeOutlined /> Gestión de Mesas</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchTables}>Actualizar</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={showModal} style={{ background: '#8b4513', borderColor: '#8b4513' }}>
            CREAR MESA
          </Button>
        </Space>
      </div>

      <Card bordered={false} style={{ borderRadius: '16px' }}>
        <Table columns={columns} dataSource={dataSource} rowKey="id" loading={loading} />
      </Card>

      <Modal 
        title={editingTable ? "Modificar Mesa" : "Añadir Nueva Mesa"} 
        open={isModalVisible} 
        onCancel={handleCancel} 
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="Número de Mesa" name="number" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} disabled={!!editingTable} /> 
          </Form.Item>

          <Form.Item label="Ubicación / Zona" name="location" rules={[{ required: true }]}>
            <Select>
              <Option value="Terraza">Terraza</Option>
              <Option value="Centro">Centro (Salón)</Option>
              <Option value="VIP">Zona VIP</Option>
              <Option value="Barra">Barra</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Capacidad" name="capacity" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          {editingTable && (
            <Form.Item label="Estado" name="status">
              <Select>
                <Option value="available">Disponible</Option>
                <Option value="occupied">Ocupada</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>Cancelar</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#8b4513', borderColor: '#8b4513' }}>
                {editingTable ? 'Actualizar Cambios' : 'Guardar Mesa'}
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