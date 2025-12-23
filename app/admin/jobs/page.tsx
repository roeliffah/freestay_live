'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Alert, Spin, Table, Tag, Divider, App, Row, Col, Statistic, Popconfirm } from 'antd';
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
  return (
    <App>
      <JobsContent />
    </App>
  );
}

function JobsContent() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [jobLogs, setJobLogs] = useState<JobLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [stats, setStats] = useState<SunHotelsStats | null>(null);

  // Load statistics on mount
  useEffect(() => {
    loadStatistics();
    loadJobHistory();
  }, [currentPage, pageSize]);

  // Auto-refresh job history when there are running jobs
  useEffect(() => {
    const hasRunningJobs = jobLogs.some(job => job.status === 'running');
    
    if (hasRunningJobs) {
      const intervalId = setInterval(() => {
        loadJobHistory();
        loadStatistics();
      }, 5000); // Refresh every 5 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [jobLogs]);

  const loadStatistics = async () => {
    setStatsLoading(true);
    try {
      const response = await adminAPI.getSunHotelsStatistics();
      console.log('📊 SunHotels Statistics:', response);
      setStats(response);
    } catch (error: any) {
      console.error('❌ Failed to load statistics:', error);
      message.error(error.message || 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadJobHistory = async () => {
    try {
      const response = await adminAPI.getJobHistory({ page: currentPage, pageSize });
      console.log('📋 Job History:', response);
      
      // Map API response to UI format
      const mappedJobs: JobLog[] = response.items.map(item => ({
        id: item.id,
        jobType: item.jobType,
        status: item.status as 'running' | 'success' | 'failed' | 'pending',
        startTime: item.startTime,
        endTime: item.endTime,
        duration: item.duration ? formatDuration(item.duration) : undefined,
        message: item.message || item.errorMessage,
      }));
      
      setJobLogs(mappedJobs);
      setTotalCount(response.totalCount || mappedJobs.length);
    } catch (error: any) {
      console.error('❌ Failed to load job history:', error);
      // Don't show error to user on initial load
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleSyncAll = async () => {
    setLoading('sync-all');
    const startTime = new Date().toISOString();
    
    // Add pending log
    const tempLog: JobLog = {
      id: `temp-${Date.now()}`,
      jobType: 'SunHotels Full Sync',
      status: 'running',
      startTime,
    };
    setJobLogs(prev => [tempLog, ...prev]);

    try {
      const response = await adminAPI.syncSunHotels();
      
      message.success(response.message || 'Sync job started successfully!');
      
      // Reload job history and statistics after starting
      setTimeout(() => {
        loadJobHistory();
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
              message: error.message || 'Failed to start sync',
            }
          : log
      ));
      
      message.error({
        content: error.message || 'Failed to start synchronization',
        duration: 5,
      });
    } finally {
      setLoading(null);
    }
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
                  value={stats.hotelCount || 0} 
                  prefix={<ShopOutlined />}
                  styles={{ content: { color: '#3f8600' } }}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic 
                  title="Rooms" 
                  value={stats.roomCount || 0} 
                  prefix={<HomeOutlined />}
                  styles={{ content: { color: '#1890ff' } }}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic 
                  title="Destinations" 
                  value={stats.destinationCount || 0} 
                  prefix={<GlobalOutlined />}
                  styles={{ content: { color: '#722ed1' } }}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic 
                  title="Resorts" 
                  value={stats.resortCount || 0} 
                  prefix={<DatabaseOutlined />}
                  styles={{ content: { color: '#eb2f96' } }}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic 
                  title="Features" 
                  value={stats.featureCount || 0} 
                  prefix={<CheckCircleOutlined />}
                  styles={{ content: { color: '#13c2c2' } }}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic 
                  title="Room Types" 
                  value={stats.roomTypeCount || 0} 
                  prefix={<DatabaseOutlined />}
                  styles={{ content: { color: '#fa8c16' } }}
                />
              </Col>
            </Row>
            {stats.lastSyncTime && (
              <Alert
                title={`Last synchronized: ${new Date(stats.lastSyncTime).toLocaleString()}`}
                type="success"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
            {!stats.lastSyncTime && (
              <Alert
                title="No synchronization performed yet"
                description="Click one of the sync buttons below to start synchronizing data"
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </>
        ) : (
          <Alert
            title="No data available"
            description="Run a sync job to populate the cache"
            type="warning"
            showIcon
          />
        )}
      </Card>

      <Alert
        title="Important Information"
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
            title="This operation runs in the background and may take several minutes"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Popconfirm
            title="Start Synchronization"
            description="This will sync all data from SunHotels API. The job will run in the background. Continue?"
            onConfirm={handleSyncAll}
            okText="Yes, Start Sync"
            cancelText="Cancel"
            disabled={loading !== null}
          >
            <Button
              type="primary"
              size="large"
              icon={loading === 'sync-all' ? <Spin /> : <PlayCircleOutlined />}
              loading={loading === 'sync-all'}
              disabled={loading !== null}
            >
              Start Synchronization
            </Button>
          </Popconfirm>
        </Card>
      </Card>

      {/* Job History */}
      <Card 
        title="Job History" 
        style={{ marginTop: 24 }}
        extra={
          <Button
            icon={<SyncOutlined />}
            onClick={loadJobHistory}
            size="small"
          >
            Refresh
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={jobLogs}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalCount,
            showSizeChanger: true,
            onChange: (page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) {
                setPageSize(size);
                setCurrentPage(1);
              }
            },
          }}
          locale={{
            emptyText: 'No jobs have been executed yet',
          }}
        />
      </Card>
    </div>
  );
}
