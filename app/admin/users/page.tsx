'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  App,
  Typography,
  Avatar,
  Dropdown,
  Tooltip,
  Space,
} from 'antd';
import type { MenuProps, TablePaginationConfig } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  MoreOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { adminAPI } from '@/lib/api/client';

const { Title, Text } = Typography;

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'staff';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: number;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface UsersResponse {
  items: ApiUser[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const roleColors = {
  admin: 'purple',
  staff: 'cyan', // SuperAdmin
};

const roleLabels = {
  admin: 'Admin',
  staff: 'SuperAdmin', // Backend only accepts Admin (0) or SuperAdmin (2)
};

const statusColors = {
  active: 'green',
  inactive: 'red',
};

const statusLabels = {
  active: 'Active',
  inactive: 'Inactive',
};

export default function UsersPage() {
  const { message } = App.useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Load users on mount and when pagination/search changes
  useEffect(() => {
    loadUsers();
  }, [pagination.current, pagination.pageSize, searchText]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getUsers({
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: searchText || undefined,
      });
      
      // API'den gelen veriyi UI formatına dönüştür
      const mappedUsers: User[] = (response.items || []).map((apiUser: ApiUser) => ({
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        phone: apiUser.phone,
        role: apiUser.role === 2 ? 'admin' as const : 'staff' as const, // 2=Admin, 3=SuperAdmin (UI'da 'staff')
        status: apiUser.isActive ? 'active' as const : 'inactive' as const,
        createdAt: apiUser.createdAt,
        lastLogin: apiUser.lastLogin || '',
      }));
      
      setUsers(mappedUsers);
      setPagination(prev => ({
        ...prev,
        total: response.totalCount || 0,
      }));
    } catch (error: any) {
      console.error('Failed to load users:', error);
      // Don't show error message if session expired (user will be redirected)
      if (!error.message?.includes('Session expired')) {
        message.error(error.message || 'Failed to load users');
      }
      // Don't set mock data - if token expired, user will be redirected to login
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 20,
      total: pagination.total,
    });
  };

  const showModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      form.setFieldsValue(user);
    } else {
      setEditingUser(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleStatusChange = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      // PUT /admin/users/{id} ile status güncellemesi yap
      const apiResponse = await adminAPI.updateUser(userId, {
        status: newStatus,
      });
      
      // API yanıtını UI formatına dönüştür
      const updatedUser: User = {
        id: apiResponse.id,
        name: apiResponse.name,
        email: apiResponse.email,
        phone: apiResponse.phone,
        role: apiResponse.role === 2 ? 'admin' : 'staff',
        status: apiResponse.isActive ? 'active' : 'inactive',
        createdAt: apiResponse.createdAt,
        lastLogin: apiResponse.lastLogin || '',
      };
      
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      message.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('❌ Status update error:', error);
      message.error(error.message || 'Failed to update user status');
    }
  };

  const handleSendPasswordReset = async (email: string, name: string) => {
    try {
      await adminAPI.sendPasswordReset(email);
      message.success(`Password reset link sent to ${name}`);
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      message.error(error.message || 'Failed to send password reset link');
    }
  };

  const handleOk = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      
      console.log('📝 Form values:', JSON.stringify(values, null, 2));
      
      if (editingUser) {
        // Update user
        const apiResponse = await adminAPI.updateUser(editingUser.id, values);
        console.log('✅ Update response from backend:', JSON.stringify(apiResponse, null, 2));
        
        // API yanıtını UI formatına dönüştür
        const updatedUser: User = {
          id: apiResponse.id,
          name: apiResponse.name,
          email: apiResponse.email,
          phone: apiResponse.phone,
          role: apiResponse.role === 2 ? 'admin' : 'staff', // 2=Admin, 3=SuperAdmin
          status: apiResponse.isActive ? 'active' : 'inactive',
          createdAt: apiResponse.createdAt,
          lastLogin: apiResponse.lastLogin || '',
        };
        setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
        message.success('User updated successfully');
        setIsModalOpen(false);
        form.resetFields();
        // Reload users to get fresh data from backend
        await loadUsers();
      } else {
        // Create user
        const apiResponse = await adminAPI.createUser(values);
        // API yanıtını UI formatına dönüştür
        const newUser: User = {
          id: apiResponse.id,
          name: apiResponse.name,
          email: apiResponse.email,
          phone: apiResponse.phone,
          role: apiResponse.role === 2 ? 'admin' : 'staff', // 2=Admin, 3=SuperAdmin
          status: apiResponse.isActive ? 'active' : 'inactive',
          createdAt: apiResponse.createdAt,
          lastLogin: apiResponse.lastLogin || '',
        };
        setUsers([newUser, ...users]);
        setPagination(prev => ({ ...prev, total: prev.total + 1 }));
        message.success('User created successfully');
        setIsModalOpen(false);
        form.resetFields();
        await loadUsers();
      }
    } catch (error: any) {
      console.error('❌ Save error:', error);
      
      // If Ant Design form validation failed, don't show message
      if (error.errorFields) {
        return;
      }
      
      // If backend validation errors exist, set them in form
      if (error.validationErrors) {
        const formErrors = Object.entries(error.validationErrors).map(([field, messages]) => ({
          name: field.charAt(0).toLowerCase() + field.slice(1), // Convert to camelCase (Name -> name)
          errors: Array.isArray(messages) ? messages : [messages as string],
        }));
        form.setFields(formErrors as any);
        message.error('Please fix validation errors');
        return;
      }
      
      message.error(error.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (record: User) => {
    Modal.confirm({
      title: 'Delete User',
      content: `Are you sure you want to delete "${record.name}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await adminAPI.deleteUser(record.id);
          setUsers(users.filter(u => u.id !== record.id));
          setPagination(prev => ({ ...prev, total: prev.total - 1 }));
          message.success('User deleted successfully');
        } catch (error: any) {
          console.error('❌ Delete error:', error);
          message.error(error.message || 'Backend endpoint not available (405 Method Not Allowed)');
        }
      },
    });
  };



  const getActionItems = (record: User): MenuProps['items'] => {
    return [
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Edit User',
        onClick: () => showModal(record),
      },
      {
        key: 'status',
        icon: record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />,
        label: record.status === 'active' ? 'Deactivate' : 'Activate',
        onClick: () => handleStatusChange(record.id, record.status),
      },
      {
        key: 'password',
        icon: <KeyOutlined />,
        label: 'Send Password Reset',
        onClick: () => handleSendPasswordReset(record.email, record.name),
      },
      {
        type: 'divider',
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Delete User',
        danger: true,
        onClick: () => handleDelete(record),
      },
    ];
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      fixed: 'left' as const,
      width: 250,
      render: (_: any, record: User) => (
        <Space>
          <Avatar style={{ backgroundColor: record.role === 'admin' ? '#722ed1' : '#1890ff' }}>
            {record.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: keyof typeof roleLabels) => (
        <Tag color={roleColors[role]}>{roleLabels[role]}</Tag>
      ),
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'Staff', value: 'staff' },
      ],
      onFilter: (value: any, record: User) => record.role === value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: keyof typeof statusLabels, record: User) => (
        <Tooltip title={`Click to ${status === 'active' ? 'deactivate' : 'activate'}`}>
          <Tag 
            color={statusColors[status]}
            style={{ cursor: 'pointer' }}
            onClick={() => handleStatusChange(record.id, status)}
          >
            {statusLabels[status]}
          </Tag>
        </Tooltip>
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ],
      onFilter: (value: any, record: User) => record.status === value,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'Never',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 100,
      render: (_: any, record: User) => (
        <Dropdown
          menu={{
            items: getActionItems(record),
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Users Management</Title>
          <Text type="secondary">Manage admin and staff users</Text>
        </div>
        <Space wrap>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadUsers}
            loading={loading}
          >
            Refresh
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => showModal()}
          >
            New User
          </Button>
        </Space>
      </div>

      <Card>
        <div style={{ marginBottom: 16, width: '100%' }}>
          <Input.Search
            placeholder="Search by name or email..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            style={{ width: '100%', maxWidth: 400 }}
            allowClear
            enterButton
          />
        </div>

        <Table
          columns={columns}
          dataSource={users || []}
          rowKey={(record) => record.id || `user-${Math.random()}`}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`,
            pageSizeOptions: ['10', '20', '50', '100'],
            responsive: true,
          }}
          onChange={handleTableChange}
          loading={loading}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={editingUser ? 'Edit User' : 'New User'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        okText={editingUser ? 'Update' : 'Create'}
        cancelText="Cancel"
        width={600}
        confirmLoading={submitting}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ role: 'staff', status: 'active' }}
        >
          <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <Card size="small" title="Basic Information">
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Full name is required' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Full Name" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Enter a valid email' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="example@freestays.com" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Phone is required' }]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="+1 XXX XXX XXXX" />
              </Form.Item>
            </Card>

            {!editingUser && (
              <Card size="small" title="Security">
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: 'Password is required' },
                    { min: 8, message: 'Password must be at least 8 characters' },
                  ]}
                >
                  <Input.Password prefix={<KeyOutlined />} placeholder="Min 8 characters" />
                </Form.Item>
              </Card>
            )}

            <Card size="small" title="Role & Status">
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Role selection is required' }]}
              >
                <Select>
                  <Select.Option value="admin">Admin - Full access</Select.Option>
                  <Select.Option value="staff">SuperAdmin - Administrative access</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Status selection is required' }]}
              >
                <Select>
                  <Select.Option value="active">Active</Select.Option>
                  <Select.Option value="inactive">Inactive</Select.Option>
                </Select>
              </Form.Item>
            </Card>

            {editingUser && (
              <Card size="small" title="Account Information">
                <Space orientation="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary">Created:</Text>
                    <Text strong style={{ marginLeft: 8 }}>
                      {new Date(editingUser.createdAt).toLocaleString()}
                    </Text>
                  </div>
                  <div>
                    <Text type="secondary">Last Login:</Text>
                    <Text strong style={{ marginLeft: 8 }}>
                      {editingUser.lastLogin ? new Date(editingUser.lastLogin).toLocaleString() : 'Never'}
                    </Text>
                  </div>
                </Space>
              </Card>
            )}
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
