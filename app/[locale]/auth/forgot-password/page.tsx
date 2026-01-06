'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Card, Typography, App, Form, Input, Row, Col, Spin, Button } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { isValidEmail } from '@/lib/security/input-validator';

interface ForgotPasswordFormData {
  email: string;
}

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('auth.forgotPassword');
  const appMessage = App.useApp();
  const message = appMessage?.message;
  const [email, setEmail] = useState('');
  const [form] = Form.useForm();
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (values: ForgotPasswordFormData) => {
    try {
      setFormSubmitting(true);

      if (!isValidEmail(values.email)) {
        if (message) {
          message.error(t('validation.invalidEmail') || 'Please enter a valid email address');
        }
        setFormSubmitting(false);
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (message) {
        message.success(t('emailSent') || 'Password reset link sent to your email!');
      }
      setSubmitted(true);

      setTimeout(() => {
        router.push(`/${locale}/auth/login`);
      }, 2000);
    } catch (error: any) {
      console.error('❌ Forgot password error:', error);
      const errorMessage = error?.message || t('error') || 'Failed to send reset link';
      if (message) {
        message.error(errorMessage, 5);
      } else {
        console.error('Error (message not available):', errorMessage);
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-6 text-6xl">📧</div>
          <Title level={2} className="!mb-4">
            {t('checkEmail') || 'Check Your Email'}
          </Title>
          <Text type="secondary" className="text-lg mb-6 block">
            {t('checkEmailDesc') || 'We have sent you a password reset link. Please check your email.'}
          </Text>
          <Link
            href={`/${locale}/auth/login`}
            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center justify-center gap-2"
          >
            <ArrowLeftOutlined />
            {t('backToLogin') || 'Back to Login'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <Row gutter={[48, 48]} justify="center">
          <Col xs={24} sm={22} md={20} lg={10}>
            <div className="max-w-md mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
                  <MailOutlined className="text-2xl text-white" />
                </div>

                <Title level={2} className="!mb-2 !font-bold">
                  {t('title') || 'Forgot Password?'}
                </Title>

                <Text type="secondary">
                  {t('subtitle') || "Enter your email and we'll send you a password reset link"}
                </Text>
              </div>

              {/* Form */}
              <div className="relative">
                <Spin spinning={formSubmitting} delay={0} size="large" className="w-full">
                  <Form
                    form={form}
                    name="forgot-password"
                    layout="vertical"
                    onFinish={handleSubmit}
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

                    {/* Submit Button */}
                    <Form.Item className="!mb-0 mt-6">
                      <button
                        type="submit"
                        disabled={formSubmitting}
                        className="w-full h-11 text-base font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                      >
                        {formSubmitting ? t('sending') || 'Sending...' : (t('submit') || 'Send Reset Link')}
                      </button>
                    </Form.Item>
                  </Form>
                </Spin>
              </div>

              {/* Back to Login */}
              <div className="text-center mt-6">
                <Text type="secondary">
                  {t('rememberPassword') || 'Remember your password?'}{' '}
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

          {/* Right Side - Info */}
          <Col xs={24} sm={22} md={20} lg={10} className="hidden lg:block">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <Title level={3} className="!mb-6">
                {t('infoTitle') || 'Password Reset Process'}
              </Title>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    1
                  </div>
                  <div>
                    <Text strong className="block mb-1">
                      {t('step1Title') || 'Enter Your Email'}
                    </Text>
                    <Text type="secondary" className="text-sm">
                      {t('step1Desc') || 'Provide the email address associated with your account'}
                    </Text>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    2
                  </div>
                  <div>
                    <Text strong className="block mb-1">
                      {t('step2Title') || 'Receive Email'}
                    </Text>
                    <Text type="secondary" className="text-sm">
                      {t('step2Desc') || 'Check your inbox for a password reset link (valid for 24 hours)'}
                    </Text>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    3
                  </div>
                  <div>
                    <Text strong className="block mb-1">
                      {t('step3Title') || 'Create New Password'}
                    </Text>
                    <Text type="secondary" className="text-sm">
                      {t('step3Desc') || 'Click the link and set your new password securely'}
                    </Text>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <Text className="text-sm text-blue-900">
                  💡 {t('tip') || 'Did not receive the email? Check your spam folder or try again with the correct email address.'}
                </Text>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}
