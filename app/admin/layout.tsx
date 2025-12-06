'use client';

import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, theme, Button } from 'antd';
import type { MenuProps } from 'antd';
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
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  getItem('Content', 'content', <FileTextOutlined />, [
    getItem(<Link href="/admin/translations">Translations</Link>, '/admin/translations', <TranslationOutlined />),
    getItem(<Link href="/admin/pages">Static Pages</Link>, '/admin/pages', <FileTextOutlined />),
    getItem(<Link href="/admin/email-templates">Email Templates</Link>, '/admin/email-templates', <MailOutlined />),
  ]),
  getItem('Settings', 'settings', <SettingOutlined />, [
    getItem(<Link href="/admin/services">External Services</Link>, '/admin/services', <ApiOutlined />),
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
  const pathname = usePathname();
  const { token } = theme.useToken();

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

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
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
                    
                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
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
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
