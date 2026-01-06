'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Typography, Form, Input, Button, Row, Col, Divider, Avatar, App } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const locale = useLocale();
  const t = useTranslations('profile');
  const router = useRouter();
  const { message } = App.useApp();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [form] = Form.useForm();
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/auth/login`);
    }
  }, [isAuthenticated, isLoading, router, locale]);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [user, form]);

  const handleUpdate = async (values: any) => {
    try {
      setUpdating(true);
      // Call update profile API here
      message.success(t('updateSuccess') || 'Profile updated successfully');
      setUpdating(false);
    } catch (error) {
      message.error(t('updateError') || 'Failed to update profile');
      setUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Typography.Text>Loading...</Typography.Text>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Title level={1}>{t('title') || 'My Profile'}</Title>
          <Text type="secondary">{t('subtitle') || 'Manage your account information'}</Text>
        </div>

        <Row gutter={[24, 24]}>
          {/* Profile Avatar */}
          <Col xs={24} sm={8}>
            <Card className="text-center rounded-lg shadow-md">
              <Avatar 
                size={120} 
                icon={<UserOutlined />}
                className="mx-auto mb-4"
              />
              <Title level={4}>{user.name}</Title>
              <Text type="secondary" className="block mb-4">{user.email}</Text>
              <Divider />
              <div className="text-sm text-gray-600">
                <div className="mb-2">
                  <Text type="secondary">{t('memberSince') || 'Member Since'}</Text>
                  <br />
                  <Text>{new Date(user.createdAt).toLocaleDateString()}</Text>
                </div>
              </div>
            </Card>
          </Col>

          {/* Profile Form */}
          <Col xs={24} sm={16}>
            <Card className="rounded-lg shadow-md">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdate}
              >
                <Form.Item
                  label={<Text strong>{t('fields.name') || 'Full Name'}</Text>}
                  name="name"
                  rules={[
                    { required: true, message: t('validation.nameRequired') || 'Name is required' }
                  ]}
                >
                  <Input 
                    prefix={<UserOutlined />}
                    disabled
                    className="!rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  label={<Text strong>{t('fields.email') || 'Email Address'}</Text>}
                  name="email"
                  rules={[
                    { required: true, message: t('validation.emailRequired') || 'Email is required' },
                    { type: 'email', message: t('validation.invalidEmail') || 'Invalid email' }
                  ]}
                >
                  <Input 
                    prefix={<MailOutlined />}
                    disabled
                    className="!rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  label={<Text strong>{t('fields.phone') || 'Phone Number'}</Text>}
                  name="phone"
                >
                  <Input 
                    prefix={<PhoneOutlined />}
                    type="tel"
                    className="!rounded-lg"
                  />
                </Form.Item>

                {/* Referral Code Display */}
                {(user as any).referralCode && (
                  <>
                    <Divider />
                    <Form.Item
                      label={<Text strong>{t('fields.referralCode') || 'Your Referral Code'}</Text>}
                    >
                      <Input 
                        value={(user as any).referralCode}
                        disabled
                        className="!rounded-lg font-mono"
                      />
                      <Text type="secondary" className="text-xs mt-2 block">
                        {t('referralCodeInfo') || 'Share this code with friends to earn rewards'}
                      </Text>
                    </Form.Item>
                  </>
                )}

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={updating}
                    className="rounded-lg"
                  >
                    {t('saveChanges') || 'Save Changes'}
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            {/* Referral Program Link */}
            <Card className="rounded-lg shadow-md mt-4">
              <Title level={5}>{t('referralProgram') || 'Referral Program'}</Title>
              <Text type="secondary">{t('referralInfo') || 'Invite friends and earn rewards'}</Text>
              <br />
              <Link href={`/${locale}/refer-a-friend`}>
                <Button type="default" size="small" style={{ marginTop: 12 }}>
                  {t('viewProgram') || 'View Program'}
                </Button>
              </Link>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
