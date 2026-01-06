'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Card, Typography, App, Form, Input, Checkbox, Divider, Row, Col, Spin } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, CheckCircleOutlined, EyeInvisibleOutlined, EyeTwoTone, CheckOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSiteSettings } from '@/lib/hooks/useSiteSettings';
import SecureForm from '@/components/forms/SecureForm';
import { isValidEmail } from '@/lib/security/input-validator';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  referralCode?: string;
  termsAccepted: boolean;
}

const { Title, Text } = Typography;

// BENEFITS array - titles and descriptions come from translations
const BENEFITS = [
  { id: 0 },
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 5 }
];

export default function RegisterPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('auth.register');
  const { message } = App.useApp();
  const { register, isLoading } = useAuth();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [email, setEmail] = useState('');
  const [form] = Form.useForm();
  const [formSubmitting, setFormSubmitting] = useState(false);

  const handleSubmit = async (values: RegisterFormData) => {
    try {
      setFormSubmitting(true);
      
      // Validate inputs
      if (!values.name?.trim()) {
        message.error(t('validation.nameRequired') || 'Name is required');
        setFormSubmitting(false);
        return;
      }

      if (!isValidEmail(values.email)) {
        message.error(t('validation.invalidEmail') || 'Invalid email address');
        setFormSubmitting(false);
        return;
      }

      if (!values.password || values.password.length < 6) {
        message.error(t('validation.passwordTooShort') || 'Password must be at least 6 characters');
        setFormSubmitting(false);
        return;
      }

      if (values.password !== values.confirmPassword) {
        message.error(t('validation.passwordMismatch') || 'Passwords do not match');
        setFormSubmitting(false);
        return;
      }

      if (!values.termsAccepted) {
        message.error(t('validation.termsRequired') || 'You must accept the terms and conditions');
        setFormSubmitting(false);
        return;
      }

      // Call register API
      await register(
        values.name.trim(),
        values.email.toLowerCase(),
        values.password,
        values.phone?.trim(),
        values.referralCode?.trim(),
        locale
      );

      message.success(t('success') || 'Registration successful! Redirecting...');
      
      // Redirect to home immediately
      setTimeout(() => {
        router.push(`/${locale}/bookings`);
      }, 500);
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      const errorMessage = error?.message || t('error') || 'Registration failed';
      message.error(errorMessage, 5);
    } finally {
      setFormSubmitting(false);
    }
  };

  const termsPageLink = settings?.termsOfService 
    ? `/${locale}/pages/${settings.termsOfService}` 
    : '#';
  const privacyPageLink = settings?.privacyPolicy 
    ? `/${locale}/pages/${settings.privacyPolicy}` 
    : '#';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <Row gutter={[48, 48]} align="middle">
          {/* Left Side - Form */}
          <Col xs={24} lg={12}>
            <div className="max-w-md mx-auto lg:mx-0">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
                  <CheckCircleOutlined className="text-2xl text-white" />
                </div>
                
                <Title level={2} className="!mb-2 !font-bold">
                  {t('title') || 'Create Account'}
                </Title>
                
                <Text type="secondary">
                  {t('subtitle') || 'Join FreeStays for exclusive travel deals'}
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
                    name="register"
                    layout="vertical"
                    onSecureFinish={handleSubmit}
                    identifier={email || 'register'}
                    enableRateLimit={true}
                    enableHoneypot={true}
                    enableCsrf={true}
                  >
                  {/* Name */}
                  <Form.Item
                    name="name"
                    label={<Text strong>{t('fields.name') || 'Full Name'}</Text>}
                    rules={[
                      { required: true, message: t('validation.nameRequired') || 'Name is required' },
                      { min: 2, message: t('validation.nameMinLength') || 'Name must be at least 2 characters' }
                    ]}
                  >
                    <Input
                      disabled={formSubmitting}
                      prefix={<UserOutlined className="text-gray-400" />}
                      placeholder={t('fields.namePlaceholder') || 'John Doe'}
                      className="!h-11 !rounded-lg"
                    />
                  </Form.Item>

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
                    />
                  </Form.Item>

                  {/* Phone (Optional) */}
                  <Form.Item
                    name="phone"
                    label={<Text strong>{t('fields.phone') || 'Phone Number'} <span className="text-gray-400 text-xs">{t('fields.optional') || '(Optional)'}</span></Text>}
                  >
                    <Input
                      disabled={formSubmitting}
                      prefix={<PhoneOutlined className="text-gray-400" />}
                      placeholder="+90 555 123 4567"
                      type="tel"
                      className="!h-11 !rounded-lg"
                    />
                  </Form.Item>

                  {/* Password */}
                  <Form.Item
                    name="password"
                    label={<Text strong>{t('fields.password') || 'Password'}</Text>}
                    rules={[
                      { required: true, message: t('validation.passwordRequired') || 'Password is required' },
                      { min: 6, message: t('validation.passwordTooShort') || 'Password must be at least 6 characters' }
                    ]}
                  >
                    <Input.Password
                      disabled={formSubmitting}
                      prefix={<LockOutlined className="text-gray-400" />}
                      placeholder="••••••••"
                      iconRender={(visible: boolean) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                      className="!h-11 !rounded-lg"
                    />
                  </Form.Item>

                  {/* Confirm Password */}
                  <Form.Item
                    name="confirmPassword"
                    label={<Text strong>{t('fields.confirmPassword') || 'Confirm Password'}</Text>}
                    rules={[
                      { required: true, message: t('validation.confirmPasswordRequired') || 'Please confirm your password' }
                    ]}
                  >
                    <Input.Password
                      disabled={formSubmitting}
                      prefix={<LockOutlined className="text-gray-400" />}
                      placeholder="••••••••"
                      iconRender={(visible: boolean) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                      className="!h-11 !rounded-lg"
                    />
                  </Form.Item>

                  {/* Referral Code (Optional) */}
                  <Form.Item
                    name="referralCode"
                    label={<Text strong>{t('fields.referralCode') || 'Referral Code'} <span className="text-gray-400 text-xs">{t('fields.optional') || '(Optional)'}</span></Text>}
                  >
                    <Input
                      disabled={formSubmitting}
                      placeholder="ABC12345"
                      className="!h-11 !rounded-lg"
                      maxLength={10}
                    />
                  </Form.Item>

                  {/* Terms & Conditions */}
                  <Form.Item
                    name="termsAccepted"
                    valuePropName="checked"
                    rules={[
                      { 
                        validator: (_, value) => 
                          value ? Promise.resolve() : Promise.reject(new Error(t('validation.termsRequired') || 'You must accept the terms'))
                      }
                    ]}
                  >
                    <Checkbox disabled={formSubmitting}>
                      <Text type="secondary" className="text-xs">
                        {t('fields.termsPrefix') || 'I agree to the'}{' '}
                        <Link 
                          href={termsPageLink}
                          target={termsPageLink !== '#' ? '_blank' : undefined}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {t('fields.termsLink') || 'Terms and Conditions'}
                        </Link>{' '}
                        {t('fields.termsAndPrivacy') || 'and'}{' '}
                        <Link 
                          href={privacyPageLink}
                          target={privacyPageLink !== '#' ? '_blank' : undefined}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {t('fields.privacyLink') || 'Privacy Policy'}
                        </Link>
                      </Text>
                    </Checkbox>
                  </Form.Item>

                  {/* Submit Button */}
                  <Form.Item className="!mb-0 mt-6">
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="w-full h-11 text-base font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      {formSubmitting ? t('registering') || 'Creating Account...' : (t('submit') || 'Create Account')}
                    </button>
                  </Form.Item>
                </SecureForm>
                </Spin>
              </div>

              {/* Divider */}
              <Divider className="!my-6">{t('fields.or') || 'or'}</Divider>

              {/* Login Link */}
              <div className="text-center">
                <Text type="secondary">
                  {t('haveAccount') || 'Already have an account?'}{' '}
                  <Link 
                    href={`/${locale}/auth/login`}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    {t('loginLink') || 'Sign In'}
                  </Link>
                </Text>
              </div>
            </div>
          </Col>

          {/* Right Side - Benefits */}
          <Col xs={24} lg={12}>
            <div>
              <div className="mb-8">
                <div className="inline-block rounded-full border border-blue-200 bg-blue-50 px-4 py-2 mb-4">
                  <Text className="text-sm font-medium text-blue-600">
                    ✓ {t('benefits.title') || 'What You Get'}
                  </Text>
                </div>
                <Title level={2} className="!mb-4">
                  {t('benefits.subtitle') || 'Join Thousands of Happy Travelers'}
                </Title>
                <Text type="secondary" className="text-lg">
                  {t('benefits.description') || 'Unlock exclusive benefits and save on your next vacation'}
                </Text>
              </div>

              <div className="space-y-4">
                {BENEFITS.map((benefit, index) => (
                  <div key={index} className="flex gap-4 p-4 rounded-lg bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="text-xl flex-shrink-0 text-green-500 pt-1">
                      <CheckSquareOutlined />
                    </div>
                    <div>
                      <Title level={5} className="!mb-1">
                        {t(`benefits.items.${index}.title`)}
                      </Title>
                      <Text type="secondary" className="text-sm">
                        {t(`benefits.items.${index}.description`)}
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
                    <Text type="secondary" className="text-sm">{t('benefits.hotels') || 'Partner Hotels'}</Text>
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-blue-600">50%</div>
                    <Text type="secondary" className="text-sm">{t('benefits.savings') || 'Average Savings'}</Text>
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-blue-600">24/7</div>
                    <Text type="secondary" className="text-sm">{t('benefits.support') || 'Support'}</Text>
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
