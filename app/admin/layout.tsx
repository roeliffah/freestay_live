'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, theme, Button, App } from 'antd';
import type { MenuProps } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  GiftOutlined,
  TranslationOutlined,
  ApiOutlined,
  FileTextOutlined,
  MailOutlined,
  SettingOutlined,
  CreditCardOutlined,
  BellOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  GlobalOutlined,
  QuestionCircleOutlined,
  StarOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: string,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const menuItems: MenuItem[] = [
  getItem(<Link href="/admin">Dashboard</Link>, '/admin', <DashboardOutlined />),
  getItem('Management', 'management', <TeamOutlined />, [
    getItem(<Link href="/admin/users">Users</Link>, '/admin/users', <UserOutlined />),
    getItem(<Link href="/admin/customers">Customers</Link>, '/admin/customers', <TeamOutlined />),
  ]),
  getItem(<Link href="/admin/bookings">Bookings</Link>, '/admin/bookings', <CalendarOutlined />),
  getItem(<Link href="/admin/coupons">Coupons</Link>, '/admin/coupons', <GiftOutlined />),
  getItem(<Link href="/admin/featured-content">Featured Content</Link>, '/admin/featured-content', <StarOutlined />),
  getItem('Content', 'content', <FileTextOutlined />, [
    getItem(<Link href="/admin/translations">Translations</Link>, '/admin/translations', <TranslationOutlined />),
    getItem(<Link href="/admin/pages">Static Pages</Link>, '/admin/pages', <FileTextOutlined />),
    getItem(<Link href="/admin/email-templates">Email Templates</Link>, '/admin/email-templates', <MailOutlined />),
    getItem(<Link href="/admin/faq">FAQ</Link>, '/admin/faq', <QuestionCircleOutlined />),
  ]),
  getItem('System', 'system', <ApiOutlined />, [
    getItem(<Link href="/admin/services">External Services</Link>, '/admin/services', <ApiOutlined />),
    getItem(<Link href="/admin/jobs">Background Jobs</Link>, '/admin/jobs', <ApiOutlined />),
  ]),
  getItem('Settings', 'settings', <SettingOutlined />, [
    getItem(<Link href="/admin/settings">Site Settings</Link>, '/admin/settings', <GlobalOutlined />),
    getItem(<Link href="/admin/settings/seo">SEO Settings</Link>, '/admin/settings/seo', <HomeOutlined />),
    getItem(<Link href="/admin/settings/payment">Payment Settings</Link>, '/admin/settings/payment', <CreditCardOutlined />),
  ]),
];

const userMenuItems: MenuProps['items'] = [
  {
    key: 'profile',
    icon: <UserOutlined />,
    label: <Link href="/admin/profile">Profile</Link>,
  },
  {
    key: 'site',
    icon: <HomeOutlined />,
    label: <Link href="/" target="_blank">View Site</Link>,
  },
  {
    type: 'divider',
  },
  {
    key: 'logout',
    icon: <LogoutOutlined />,
    label: 'Logout',
    danger: true,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const { token } = theme.useToken();

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    // Cookie'yi temizle
    document.cookie = 'admin_token=; path=/; max-age=0';
    window.location.href = '/admin/login';
  };

  // Handle menu clicks
  const handleUserMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key === 'logout') {
      handleLogout();
    }
  };

  // Check authentication only on mount
  useEffect(() => {
    // Must be client-side only
    if (typeof window === 'undefined') return;

    // Always allow login page
    if (pathname === '/admin/login') {
      // Use timeout to avoid setState during render
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }

    // Check token for other pages
    const adminToken = localStorage.getItem('admin_token');
    
    if (!adminToken) {
      // No token, redirect to login
      window.location.replace('/admin/login');
    } else {
      // Token exists, allow access
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Find the selected keys based on current path
  const getSelectedKeys = () => {
    if (pathname === '/admin') return ['/admin'];
    const matched = menuItems.flatMap((item: any) => {
      if (item?.children) {
        return item.children.map((child: any) => child?.key);
      }
      return [item?.key];
    }).filter((key: string) => pathname.startsWith(key));
    return matched.length > 0 ? [matched[matched.length - 1]] : [];
  };

  // Find open keys for submenus
  const getOpenKeys = () => {
    for (const item of menuItems as any[]) {
      if (item?.children) {
        for (const child of item.children) {
          if (pathname.startsWith(child?.key)) {
            return [item.key];
          }
        }
      }
    }
    return [];
  };

  // Show loading spinner during authentication check
  if (loading) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body style={{ margin: 0 }} suppressHydrationWarning>
          <AntdRegistry>
            <ConfigProvider
              locale={enUS}
              theme={{
                token: {
                  colorPrimary: '#6366f1',
                  borderRadius: 8,
                },
              }}
            >
              <App>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100vh',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid rgba(255,255,255,0.3)',
                    borderTop: '4px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              </App>
            </ConfigProvider>
          </AntdRegistry>
        </body>
      </html>
    );
  }

  // Show login page without sidebar
  if (pathname === '/admin/login') {
    return (
      <html lang="en" suppressHydrationWarning>
        <body style={{ margin: 0 }} suppressHydrationWarning>
          <AntdRegistry>
            <ConfigProvider
              locale={enUS}
              theme={{
                token: {
                  colorPrimary: '#6366f1',
                  borderRadius: 8,
                },
              }}
            >
              <App>
                {children}
              </App>
            </ConfigProvider>
          </AntdRegistry>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0 }} suppressHydrationWarning>
        <AntdRegistry>
          <ConfigProvider
            locale={enUS}
            theme={{
              token: {
                colorPrimary: '#6366f1',
                borderRadius: 8,
              },
            }}
          >
            <App>
              <Layout style={{ minHeight: '100vh' }}>
              <Sider 
                trigger={null} 
                collapsible 
                collapsed={collapsed}
                style={{
                  overflow: 'auto',
                  height: '100vh',
                  position: 'fixed',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  background: token.colorBgContainer,
                  borderRight: `1px solid ${token.colorBorderSecondary}`,
                }}
                theme="light"
                width={260}
              >
                <div style={{ 
                  height: 64, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? 0 : '0 24px',
                  borderBottom: `1px solid ${token.colorBorderSecondary}`,
                }}>
                  {collapsed ? (
                    <span style={{ fontSize: 24, fontWeight: 'bold', color: token.colorPrimary }}>F</span>
                  ) : (
                    <span style={{ fontSize: 20, fontWeight: 'bold', color: token.colorPrimary }}>
                      FreeStays Admin
                    </span>
                  )}
                </div>
                <Menu
                  mode="inline"
                  selectedKeys={getSelectedKeys()}
                  defaultOpenKeys={getOpenKeys()}
                  items={menuItems}
                  style={{ 
                    border: 'none',
                    padding: '8px',
                  }}
                />
              </Sider>
              
              <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.2s' }}>
                <Header 
                  style={{ 
                    padding: '0 24px', 
                    background: token.colorBgContainer,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                  }}
                >
                  <Button
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={() => setCollapsed(!collapsed)}
                    style={{ fontSize: 16 }}
                  />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Badge count={5} size="small">
                      <Button type="text" icon={<BellOutlined />} />
                    </Badge>
                    
                    <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <Avatar style={{ backgroundColor: token.colorPrimary }}>
                          <UserOutlined />
                        </Avatar>
                        <span style={{ fontWeight: 500 }}>Admin</span>
                      </div>
                    </Dropdown>
                  </div>
                </Header>
                
                <Content style={{ 
                  margin: 24,
                  padding: 24,
                  background: token.colorBgContainer,
                  borderRadius: token.borderRadius,
                  minHeight: 'calc(100vh - 64px - 48px)',
                }}>
                  {children}
                </Content>
              </Layout>
            </Layout>
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
