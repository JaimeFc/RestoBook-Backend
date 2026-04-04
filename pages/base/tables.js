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
        message.error('Error al cargar mesas del servidor');
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
    const url = '/api/tables'; 
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const payload = {
        ...values,
        number: parseInt(values.number),
        capacity: parseInt(values.capacity),
      };

      if (isEditing) {
        payload.id = editingTable.id;
      }

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await response.json();

      if (response.ok) {
        message.success(isEditing ? 'Mesa actualizada' : 'Mesa creada');
        handleCancel();
        fetchTables();
      } else {
        message.error(res.error || 'Error en la operación');
      }
    } catch (error) {
      message.error('Error de red');
    }
  };

  // --- ELIMINACIÓN CORREGIDA Y OPTIMIZADA ---
  const handleDelete = async (id) => {
    // 1. Mostramos un mensaje de carga que bloquea la pantalla brevemente
    const hideLoading = message.loading('Eliminando mesa y sus registros asociados...', 0);
    setLoading(true);

    try {
      // Enviamos el ID por URL (Query String) como espera el backend index.js
      const response = await fetch(`/api/tables?id=${id}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();

      if (response.ok) {
        message.success('Mesa eliminada con éxito');
        // 2. Refrescamos la lista inmediatamente
        await fetchTables(); 
      } else {
        // 3. Si el backend devuelve un error específico, lo mostramos
        Modal.error({
          title: 'Error al eliminar',
          content: result.error || 'No se pudo completar la acción.'
        });
      }
    } catch (error) {
      console.error("Error Delete:", error);
      message.error('Error de conexión al intentar borrar');
    } finally {
      // 4. Quitamos los estados de carga
      hideLoading();
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'MESA #',
      dataIndex: 'number',
      key: 'number',
      sorter: (a, b) => a.number - b.number,
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
  // Añadimos backgroundColor y borderColor al style existente
  style={{ 
    borderRadius: '6px',
    backgroundColor: '#1890ff', // Azul estándar
    borderColor: '#1890ff',
    color: '#fff'}}
          >
            Editar
          </Button>
          <Popconfirm 
            title="¿Eliminar esta mesa?" 
            description="Se eliminará la mesa y todo su historial de reservas. ¿Deseas continuar?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí, Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true, loading: loading }}
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
              <Button onClick={handleCancel}>Cancelar</Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                style={{ background: '#8b4513', borderColor: '#8b4513' }}
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