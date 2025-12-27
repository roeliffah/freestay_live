'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input, Button, Checkbox, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined, ThunderboltOutlined, EyeInvisibleOutlined, EyeTwoTone, SafetyCertificateOutlined } from '@ant-design/icons';
import { authAPI } from '@/lib/api/client';
import { isValidEmail } from '@/lib/security/input-validator';
import { loginRateLimiter } from '@/lib/security/rate-limiter';
import SecureForm from '@/components/forms/SecureForm';
import { Form } from 'antd';

const { Title, Text } = Typography;

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

export default function AdminLoginPage() {
  return (
    <App>
      <LoginContent />
    </App>
  );
}

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const { message } = App.useApp();

  const handleSubmit = async (values: LoginFormData) => {
    if (!isValidEmail(values.email)) {
      message.error('Please enter a valid email address!');
      throw new Error('Invalid email address');
    }

    setLoading(true);
    
    console.log('📧 Login attempt with:', {
      email: values.email,
      apiUrl: process.env.NEXT_PUBLIC_API_URL
    });
    
    try {
      const response = await authAPI.login(values.email, values.password);

      console.log('✅ Login response received:', {
        hasToken: !!response.accessToken,
        hasUser: !!response.user,
        userRole: response.user?.role
      });

      // Backend returns accessToken/refreshToken/user; persist under admin_* keys for layout checks
      if (response.accessToken) {
        localStorage.setItem('admin_token', response.accessToken);
        
        // Cookie'ye de kaydet (middleware için)
        document.cookie = `admin_token=${response.accessToken}; path=/; max-age=${30 * 24 * 60 * 60}`; // 30 gün
      }
      if (response.refreshToken) {
        localStorage.setItem('admin_refresh_token', response.refreshToken);
      }
      if (response.user) {
        localStorage.setItem('admin_user', JSON.stringify(response.user));
      }

      message.success('Login successful!');
      
      // Token'ın set edilmesini bekle, sonra redirect yap
      setTimeout(() => {
        // Next.js routing kullan
        window.location.replace('/admin');
      }, 100);
    } catch (error: any) {
      console.error('❌ Login error details:', {
        message: error.message,
        validationErrors: error.validationErrors,
        fullError: error
      });
      
      let errorMessage = 'Login failed. Please check your credentials.';
      
      // Validation errors varsa göster
      if (error.validationErrors) {
        const validationMessages = Object.entries(error.validationErrors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
        errorMessage = validationMessages;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage, 5); // 5 saniye göster
      setLoading(false);
      throw error;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #9333ea 100%)' }}>
      {/* Animated Background */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* Login Card */}
      <Card 
        style={{
          position: 'relative',
          zIndex: 10,
          width: '450px',
          maxWidth: 'calc(100vw - 48px)',
          margin: '24px',
          backdropFilter: 'blur(16px)',
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        styles={{
          body: { padding: '40px' }
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 mb-4 shadow-lg">
            <SafetyCertificateOutlined className="text-3xl text-white" />
          </div>
          
          <Title level={2} style={{ marginBottom: '8px', fontWeight: 700 }}>
            Admin Panel
          </Title>
          
          <Text type="secondary" style={{ fontSize: '14px' }}>
            Enter your credentials to access the dashboard
          </Text>
        </div>

        {/* Form */}
        <SecureForm
          name="admin-login"
          initialValues={{ remember: true }}
          onSecureFinish={handleSubmit}
          identifier={email || 'default'}
          enableRateLimit={true}
          enableHoneypot={true}
          enableCsrf={true}
          customRateLimitConfig={loginRateLimiter}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="email"
            label={<Text strong>Email Address</Text>}
            rules={[
              { required: true, message: 'Email is required!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="admin@freestays.com"
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              style={{ 
                height: '48px',
                borderRadius: '12px',
                fontSize: '15px'
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<Text strong>Password</Text>}
            rules={[{ required: true, message: 'Password is required!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="••••••••"
              autoComplete="current-password"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              style={{ 
                height: '48px',
                borderRadius: '12px',
                fontSize: '15px'
              }}
            />
          </Form.Item>

          <Form.Item>
            <div className="flex items-center justify-between">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
              <Link 
                href="/admin/forgot-password" 
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Forgot Password?
              </Link>
            </div>
          </Form.Item>

          <Form.Item style={{ marginBottom: '20px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              icon={!loading && <ThunderboltOutlined />}
              style={{
                height: '48px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Form.Item>
        </SecureForm>
      </Card>
    </div>
  );
}
