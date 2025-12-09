'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Alert, Spin, Table, Tag, Divider, message, Modal, Row, Col, Statistic } from 'antd';
import { 
  SyncOutlined, 
  CloudSyncOutlined, 
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  ShopOutlined,
  GlobalOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { adminAPI } from '@/lib/api/client';

const { Title, Text, Paragraph } = Typography;

interface JobLog {
  id: string;
  jobType: string;
  status: 'running' | 'success' | 'failed' | 'pending';
  startTime: string;
  endTime?: string;
  duration?: string;
  message?: string;
  details?: any;
}

interface SunHotelsStats {
  destinationCount: number;
  resortCount: number;
  mealCount: number;
  roomTypeCount: number;
  featureCount: number;
  themeCount: number;
  languageCount: number;
  transferTypeCount: number;
  noteTypeCount: number;
  hotelCount: number;
  roomCount: number;
  lastSyncTime: string | null;
}

export default function JobsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [jobLogs, setJobLogs] = useState<JobLog[]>([]);
  const [stats, setStats] = useState<SunHotelsStats | null>(null);

  // Load statistics on mount
  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setStatsLoading(true);
    try {
      const response = await adminAPI.getSunHotelsStatistics();
      setStats(response);
    } catch (error: any) {
      console.error('Failed to load statistics:', error);
      // Don't show error message on mount, just log it
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSyncAll = async () => {
    Modal.confirm({
      title: 'Full Sync Confirmation',
      content: 'This will sync ALL data from SunHotels API including destinations, resorts, hotels, rooms, features, etc. This may take several minutes. Continue?',
      okText: 'Yes, Start Sync',
      okType: 'primary',
      cancelText: 'Cancel',
      icon: <InfoCircleOutlined />,
      async onOk() {
        setLoading('sync-all');
        const startTime = new Date().toISOString();
        
        // Add pending log
        const tempLog: JobLog = {
          id: `temp-${Date.now()}`,
          jobType: 'Full Sync',
          status: 'running',
          startTime,
        };
        setJobLogs(prev => [tempLog, ...prev]);

        try {
          const response = await adminAPI.syncSunHotelsAll();
          
          // Update log with success
          setJobLogs(prev => prev.map(log => 
            log.id === tempLog.id 
              ? {
                  ...log,
                  id: response.jobId || log.id,
                  status: 'success',
                  endTime: new Date().toISOString(),
                  duration: calculateDuration(startTime, new Date().toISOString()),
                  message: response.message || 'Full sync completed successfully',
                  details: response,
                }
              : log
          ));
          
          message.success('Full sync completed successfully!');
          
          // Reload statistics after successful sync
          setTimeout(() => {
            loadStatistics();
          }, 2000);
        } catch (error: any) {
          console.error('Sync error:', error);
          
          // Update log with failure
          setJobLogs(prev => prev.map(log => 
            log.id === tempLog.id 
              ? {
                  ...log,
                  status: 'failed',
                  endTime: new Date().toISOString(),
                  duration: calculateDuration(startTime, new Date().toISOString()),
                  message: error.message || 'Sync failed',
                }
              : log
          ));
          
          message.error({
            content: error.message || 'Senkronizasyon başlatılamadı',
            duration: 5,
          });
        } finally {
          setLoading(null);
        }
      },
    });
  };

  const handleSyncBasic = async () => {
    Modal.confirm({
      title: 'Basic Sync Confirmation',
      content: 'This will sync basic reference data (destinations, resorts, meals, room types, features, themes, languages). This is faster than full sync. Continue?',
      okText: 'Yes, Start Sync',
      okType: 'primary',
      cancelText: 'Cancel',
      icon: <InfoCircleOutlined />,
      async onOk() {
        setLoading('sync-basic');
        const startTime = new Date().toISOString();
        
        const tempLog: JobLog = {
          id: `temp-${Date.now()}`,
          jobType: 'Basic Sync',
          status: 'running',
          startTime,
        };
        setJobLogs(prev => [tempLog, ...prev]);

        try {
          const response = await adminAPI.syncSunHotelsBasic();
          
          setJobLogs(prev => prev.map(log => 
            log.id === tempLog.id 
              ? {
                  ...log,
                  id: response.jobId || log.id,
                  status: 'success',
                  endTime: new Date().toISOString(),
                  duration: calculateDuration(startTime, new Date().toISOString()),
                  message: response.message || 'Basic sync completed successfully',
                  details: response,
                }
              : log
          ));
          
          message.success('Basic sync completed successfully!');
          
          // Reload statistics after successful sync
          setTimeout(() => {
            loadStatistics();
          }, 1000);
        } catch (error: any) {
          console.error('Sync error:', error);
          
          setJobLogs(prev => prev.map(log => 
            log.id === tempLog.id 
              ? {
                  ...log,
                  status: 'failed',
                  endTime: new Date().toISOString(),
                  duration: calculateDuration(startTime, new Date().toISOString()),
                  message: error.message || 'Sync failed',
                }
              : log
          ));
          
          message.error({
            content: error.message || 'Senkronizasyon başlatılamadı',
            duration: 5,
          });
        } finally {
          setLoading(null);
        }
      },
    });
  };

  const calculateDuration = (start: string, end: string): string => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const getStatusTag = (status: string) => {
    const config = {
      running: { color: 'processing', icon: <SyncOutlined spin />, text: 'Running' },
      success: { color: 'success', icon: <CheckCircleOutlined />, text: 'Success' },
      failed: { color: 'error', icon: <CloseCircleOutlined />, text: 'Failed' },
      pending: { color: 'default', icon: <ClockCircleOutlined />, text: 'Pending' },
    };
    const c = config[status as keyof typeof config] || config.pending;
    return <Tag color={c.color} icon={c.icon}>{c.text}</Tag>;
  };

  const columns = [
    {
      title: 'Job Type',
      dataIndex: 'jobType',
      key: 'jobType',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration?: string) => duration || '-',
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: (message?: string) => message || '-',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Background Jobs</Title>
        <Paragraph type="secondary">
          Manage and monitor background synchronization jobs for external services
        </Paragraph>
      </div>

      {/* Statistics Card */}
      <Card 
        title="SunHotels Cache Statistics" 
        loading={statsLoading}
        style={{ marginBottom: 24 }}
      >
        {stats ? (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={6}>
                <Statistic 
                  title="Hotels" 
                  value={stats.hotelCount} 
                  prefix={<ShopOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic 
                  title="Rooms" 
                  value={stats.roomCount} 
                  prefix={<HomeOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic 
                  title="Destinations" 
                  value={stats.destinationCount} 
                  prefix={<GlobalOutlined />}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic 
                  title="Resorts" 
                  value={stats.resortCount} 
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic 
                  title="Meal Types" 
                  value={stats.mealCount} 
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic 
                  title="Room Types" 
                  value={stats.roomTypeCount} 
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic 
                  title="Features" 
                  value={stats.featureCount} 
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic 
                  title="Themes" 
                  value={stats.themeCount} 
                />
              </Col>
            </Row>
            {stats.lastSyncTime && (
              <Alert
                message={`Last synchronized: ${new Date(stats.lastSyncTime).toLocaleString()}`}
                type="success"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </>
        ) : (
          <Alert
            message="No data available"
            description="Run a sync job to populate the cache"
            type="warning"
            showIcon
          />
        )}
      </Card>

      <Alert
        message="Important Information"
        description="These jobs synchronize hotel data from SunHotels API. Full sync includes all hotels and rooms which may take several minutes. Basic sync only updates reference data (destinations, meal types, etc.) and is much faster."
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* SunHotels Sync Jobs */}
      <Card 
        title={
          <Space>
            <CloudSyncOutlined style={{ fontSize: 20 }} />
            <span>SunHotels Data Synchronization</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Full Sync */}
          <Card 
            type="inner" 
            title={
              <Space>
                <DatabaseOutlined />
                <span>Full Data Sync</span>
              </Space>
            }
          >
            <Paragraph>
              Synchronizes all data from SunHotels API including:
            </Paragraph>
            <ul style={{ marginLeft: 20, marginBottom: 16 }}>
              <li>Destinations and Resorts</li>
              <li>Hotels with full details</li>
              <li>Room Types and Features</li>
              <li>Meal Types and Themes</li>
              <li>Languages and Transfer Types</li>
            </ul>
            <Alert
              message="This operation may take 5-10 minutes depending on data volume"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Button
              type="primary"
              size="large"
              icon={loading === 'sync-all' ? <Spin /> : <PlayCircleOutlined />}
              onClick={handleSyncAll}
              loading={loading === 'sync-all'}
              disabled={loading !== null}
            >
              Start Full Sync
            </Button>
          </Card>

          <Divider />

          {/* Basic Sync */}
          <Card 
            type="inner"
            title={
              <Space>
                <ThunderboltOutlined />
                <span>Basic Reference Data Sync</span>
              </Space>
            }
          >
            <Paragraph>
              Synchronizes only reference/lookup data:
            </Paragraph>
            <ul style={{ marginLeft: 20, marginBottom: 16 }}>
              <li>Destinations and Resorts</li>
              <li>Meal Types</li>
              <li>Room Types</li>
              <li>Features and Themes</li>
              <li>Languages</li>
              <li>Transfer and Note Types</li>
            </ul>
            <Alert
              message="Faster operation, typically completes in 1-2 minutes"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Button
              type="default"
              size="large"
              icon={loading === 'sync-basic' ? <Spin /> : <PlayCircleOutlined />}
              onClick={handleSyncBasic}
              loading={loading === 'sync-basic'}
              disabled={loading !== null}
            >
              Start Basic Sync
            </Button>
          </Card>
        </Space>
      </Card>

      {/* Job History */}
      <Card title="Job History" style={{ marginTop: 24 }}>
        <Table
          columns={columns}
          dataSource={jobLogs}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: 'No jobs have been executed yet',
          }}
        />
      </Card>
    </div>
  );
}
