'use client';

import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  message,
  Typography,
  Avatar,
  Upload,
  Divider,
  Row,
  Col,
  Switch,
  Select,
  Tabs,
  Tag,
  List,
  Descriptions,
} from 'antd';
import type { TabsProps } from 'antd';
import {
  UserOutlined,
  SaveOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UploadOutlined,
  SafetyOutlined,
  HistoryOutlined,
  BellOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  language: string;
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  createdAt: string;
  lastLogin: string;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  date: string;
  ip: string;
}

// Mock data
const mockUser: AdminUser = {
  id: '1',
  name: 'Admin User',
  email: 'admin@freestays.com',
  phone: '+90 555 123 4567',
  avatar: '',
  role: 'Super Admin',
  language: 'tr',
  twoFactorEnabled: false,
  emailNotifications: true,
  pushNotifications: true,
  createdAt: '2023-06-15',
  lastLogin: '2024-01-15 14:30',
};

const mockActivityLogs: ActivityLog[] = [
  { id: '1', action: 'Logged in', details: 'Chrome - MacOS', date: '2024-01-15 14:30', ip: '192.168.1.1' },
  { id: '2', action: 'Coupon created', details: 'WINTER2024 coupon code', date: '2024-01-15 14:00', ip: '192.168.1.1' },
  { id: '3', action: 'User edited', details: 'user@example.com', date: '2024-01-15 13:45', ip: '192.168.1.1' },
  { id: '4', action: 'Logged in', details: 'Safari - iOS', date: '2024-01-14 18:00', ip: '192.168.1.2' },
  { id: '5', action: 'Password changed', details: 'Successful', date: '2024-01-10 10:00', ip: '192.168.1.1' },
];

export default function ProfilePage() {
  const [user, setUser] = useState<AdminUser>(mockUser);
  const [loading, setLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [notificationForm] = Form.useForm();

  const handleProfileSave = async (values: any) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUser({ ...user, ...values });
    message.success('Profile updated');
    setLoading(false);
  };

  const handlePasswordChange = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    message.success('Password changed successfully');
    passwordForm.resetFields();
    setLoading(false);
  };

  const handleNotificationSave = async (values: any) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUser({ ...user, ...values });
    message.success('Notification settings updated');
    setLoading(false);
  };

  const languages = [
    { value: 'tr', label: '🇹🇷 Türkçe' },
    { value: 'en', label: '🇬🇧 English' },
    { value: 'de', label: '🇩🇪 Deutsch' },
  ];

  const tabItems: TabsProps['items'] = [
    {
      key: 'profile',
      label: <Space><UserOutlined />Profile Information</Space>,
      children: (
        <Form
          form={profileForm}
          layout="vertical"
          initialValues={user}
          onFinish={handleProfileSave}
        >
          <Row gutter={24}>
            <Col span={8}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Avatar size={120} icon={<UserOutlined />} src={user.avatar} />
                <div style={{ marginTop: 16 }}>
                  <Upload beforeUpload={() => false} showUploadList={false}>
                    <Button icon={<UploadOutlined />}>Upload Photo</Button>
                  </Upload>
                </div>
              </div>
              
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Role">
                  <Tag color="purple">{user.role}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Registered">
                  {user.createdAt}
                </Descriptions.Item>
                <Descriptions.Item label="Last Login">
                  {user.lastLogin}
                </Descriptions.Item>
              </Descriptions>
            </Col>
            
            <Col span={16}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Full name is required' }]}
              >
                <Input prefix={<UserOutlined />} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Email is required' },
                      { type: 'email', message: 'Enter a valid email' },
                    ]}
                  >
                    <Input prefix={<MailOutlined />} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="phone" label="Phone">
                    <Input prefix={<PhoneOutlined />} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="language" label="Language Preference">
                <Select options={languages} style={{ width: 200 }} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  Save
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      ),
    },
    {
      key: 'security',
      label: <Space><SafetyOutlined />Security</Space>,
      children: (
        <div>
          <Card title="Change Password" size="small" style={{ marginBottom: 24 }}>
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordChange}
              style={{ maxWidth: 400 }}
            >
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[{ required: true, message: 'Current password is required' }]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: 'New password is required' },
                  { min: 8, message: 'Password must be at least 8 characters' },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                rules={[{ required: true, message: 'Password confirmation is required' }]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<LockOutlined />} loading={loading}>
                  Change Password
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Card title="Two-Factor Authentication" size="small">
            <Row align="middle" justify="space-between">
              <Col>
                <Space direction="vertical" size={0}>
                  <Text strong>Two-Factor Authentication (2FA)</Text>
                  <Text type="secondary">Protect your account with an extra layer of security</Text>
                </Space>
              </Col>
              <Col>
                <Switch 
                  checked={user.twoFactorEnabled}
                  onChange={(checked) => {
                    setUser({ ...user, twoFactorEnabled: checked });
                    message.success(checked ? '2FA enabled' : '2FA disabled');
                  }}
                  checkedChildren="Active"
                  unCheckedChildren="Inactive"
                />
              </Col>
            </Row>
          </Card>
        </div>
      ),
    },
    {
      key: 'notifications',
      label: <Space><BellOutlined />Notifications</Space>,
      children: (
        <Form
          form={notificationForm}
          layout="vertical"
          initialValues={user}
          onFinish={handleNotificationSave}
          style={{ maxWidth: 500 }}
        >
          <Form.Item name="emailNotifications" label="Email Notifications" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
          <Text type="secondary" style={{ display: 'block', marginTop: -16, marginBottom: 24 }}>
            Receive important system notifications via email
          </Text>

          <Form.Item name="pushNotifications" label="Push Notifications" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
          <Text type="secondary" style={{ display: 'block', marginTop: -16, marginBottom: 24 }}>
            Receive instant notifications in your browser
          </Text>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
              Save
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'activity',
      label: <Space><HistoryOutlined />Activity History</Space>,
      children: (
        <List
          itemLayout="horizontal"
          dataSource={mockActivityLogs}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<HistoryOutlined />} />}
                title={
                  <Space>
                    <Text strong>{item.action}</Text>
                    <Text type="secondary">- {item.details}</Text>
                  </Space>
                }
                description={
                  <Space>
                    <Text type="secondary">{item.date}</Text>
                    <Tag>{item.ip}</Tag>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <UserOutlined style={{ marginRight: 12 }} />
          Profile
        </Title>
      </div>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
