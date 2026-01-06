'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Card, Typography, App, Form, Input, Checkbox, Row, Col, Spin } from 'antd';
import { MailOutlined, LockOutlined, ThunderboltOutlined, EyeInvisibleOutlined, EyeTwoTone, CheckSquareOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/hooks/useAuth';
import SecureForm from '@/components/forms/SecureForm';
import { isValidEmail } from '@/lib/security/input-validator';

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

const { Title, Text } = Typography;

// FEATURES array - titles and descriptions come from translations
const FEATURES = [
  { id: 0 },
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 5 }
];

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('auth.login');
  const appMessage = App.useApp();
  const message = appMessage?.message;
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [form] = Form.useForm();
  const [formSubmitting, setFormSubmitting] = useState(false);

  const handleSubmit = async (values: LoginFormData) => {
    try {
      setFormSubmitting(true);
      
      if (!isValidEmail(values.email)) {
        if (message) {
          message.error(t('validation.invalidEmail') || 'Please enter a valid email address');
        }
        setFormSubmitting(false);
        return;
      }

      await login(values.email.toLowerCase(), values.password);

      if (message) {
        message.success(t('success') || 'Login successful! Redirecting...');
      }
      
      // Redirect to bookings or home
      setTimeout(() => {
        router.push(`/${locale}/bookings`);
      }, 500);
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const errorMessage = error?.message || t('error') || 'Login failed';
      if (message) {
        message.error(errorMessage, 5);
      } else {
        console.error('Error (message not available):', errorMessage);
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <Row gutter={[48, 48]} align="middle">
          {/* Left Side - Form */}
          <Col xs={24} lg={12}>
            <div className="max-w-md mx-auto lg:mx-0">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
                  <ThunderboltOutlined className="text-2xl text-white" />
                </div>
                
                <Title level={2} className="!mb-2 !font-bold">
                  {t('title') || 'Welcome Back'}
                </Title>
                
                <Text type="secondary">
                  {t('subtitle') || 'Sign in to your FreeStays account'}
                </Text>
              </div>

              <div className="relative">
                <Spin 
                  spinning={formSubmitting}
                  delay={0}
                  size="large"
                  className="w-full"
                >
                  <SecureForm
                    form={form}
                    name="customer-login"
                    layout="vertical"
                    onSecureFinish={handleSubmit}
                    identifier={email || 'default'}
                    enableRateLimit={true}
                    enableHoneypot={true}
                    enableCsrf={true}
                  >
                  {/* Email */}
                  <Form.Item
                    name="email"
                    label={<Text strong>{t('fields.email') || 'Email Address'}</Text>}
                    rules={[
                      { required: true, message: t('validation.emailRequired') || 'Email is required' },
                      { type: 'email', message: t('validation.invalidEmail') || 'Please enter a valid email' }
                    ]}
                  >
                    <Input
                      disabled={formSubmitting}
                      prefix={<MailOutlined className="text-gray-400" />}
                      placeholder="user@example.com"
                      type="email"
                      className="!h-11 !rounded-lg"
                      onChange={(e) => setEmail(e.target.value.toLowerCase())}
                      autoComplete="email"
                    />
                  </Form.Item>

                  {/* Password */}
                  <Form.Item
                    name="password"
                    label={<Text strong>{t('fields.password') || 'Password'}</Text>}
                    rules={[{ required: true, message: t('validation.passwordRequired') || 'Password is required' }]}
                  >
                    <Input.Password
                      disabled={formSubmitting}
                      prefix={<LockOutlined className="text-gray-400" />}
                      placeholder="••••••••"
                      iconRender={(visible: boolean) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                      className="!h-11 !rounded-lg"
                      autoComplete="current-password"
                    />
                  </Form.Item>

                  {/* Remember & Forgot Password */}
                  <Form.Item className="!mb-6 flex items-center justify-between">
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                      <Checkbox disabled={formSubmitting}>{t('fields.remember') || 'Remember me'}</Checkbox>
                    </Form.Item>
                    <Link 
                      href={`/${locale}/auth/forgot-password`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {t('fields.forgot') || 'Forgot Password?'}
                    </Link>
                  </Form.Item>

                  {/* Submit Button */}
                  <Form.Item className="!mb-4">
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="w-full h-11 text-base font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      {formSubmitting ? t('signingIn') || 'Signing in...' : (t('submit') || 'Sign In')}
                    </button>
                  </Form.Item>
                </SecureForm>
                </Spin>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <Text type="secondary">
                  {t('noAccount') || "Don't have an account?"}{' '}
                  <Link 
                    href={`/${locale}/auth/register`}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    {t('registerLink') || 'Sign Up'}
                  </Link>
                </Text>
              </div>
            </div>
          </Col>

          {/* Right Side - Features */}
          <Col xs={24} lg={12}>
            <div>
              <div className="mb-8">
                <div className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-2 mb-4">
                  <Text className="text-sm font-medium text-blue-600">
                    ✓ {t('features.title') || 'What We Offer'}
                  </Text>
                </div>
                <Title level={2} className="!mb-4">
                  {t('features.subtitle') || 'Experience Unbeatable Hotel Deals'}
                </Title>
                <Text type="secondary" className="text-lg">
                  {t('features.description') || 'Get the best value on luxury and budget hotels worldwide'}
                </Text>
              </div>

              <div className="space-y-4">
                {FEATURES.map((feature, index) => (
                  <div key={index} className="flex gap-4 p-4 rounded-lg bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="text-xl flex-shrink-0 text-green-500 pt-1">
                      <CheckSquareOutlined />
                    </div>
                    <div>
                      <Title level={5} className="!mb-1">
                        {t(`features.items.${index}.title`)}
                      </Title>
                      <Text type="secondary" className="text-sm">
                        {t(`features.items.${index}.description`)}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-blue-600">450K+</div>
                    <Text type="secondary" className="text-sm">{t('features.hotels') || 'Partner Hotels'}</Text>
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-blue-600">50%</div>
                    <Text type="secondary" className="text-sm">{t('features.savings') || 'Average Savings'}</Text>
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-blue-600">24/7</div>
                    <Text type="secondary" className="text-sm">{t('features.support') || 'Support'}</Text>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}
