'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Alert, Spin, Table, Tag, Divider, App, Row, Col, Statistic, Popconfirm, Tabs, Input, Modal, Form } from 'antd';
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
  SettingOutlined,
  DeleteOutlined,
  StopOutlined,
  ReloadOutlined,
  ClockCircleTwoTone,
} from '@ant-design/icons';
import { adminAPI } from '@/lib/api/client';

const { Title, Text, Paragraph } = Typography;

interface JobLog {
  id: string;
  jobType: string;
  status: 'running' | 'success' | 'failed' | 'pending';
  startTime: string;
  endTime?: string | null;
  durationSeconds?: number | null;
  message?: string | null;
  details?: string | null;
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
  
  // Hangfire Management states
  const [recurringJobs, setRecurringJobs] = useState<any[]>([]);
  const [processingJobs, setProcessingJobs] = useState<any[]>([]);
  const [queueStats, setQueueStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('sync');
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [scheduleForm] = Form.useForm();
  const [hangfireAccessDenied, setHangfireAccessDenied] = useState(false);

  // Load statistics on mount
  useEffect(() => {
    loadStatistics();
    if (activeTab === 'management') {
      loadHangfireData();
    }
  }, []);

  // Load Hangfire data when switching to management tab
  useEffect(() => {
    if (activeTab === 'management') {
      loadHangfireData();
    }
  }, [activeTab]);

  // Reload job history when page or pageSize changes
  useEffect(() => {
    loadJobHistory();
  }, [currentPage, pageSize]);

  // Auto-refresh job history when there are running jobs
  useEffect(() => {
    const hasRunningJobs = jobLogs.some(job => job.status === 'running');
    
    if (hasRunningJobs) {
      const intervalId = setInterval(() => {
        loadJobHistory();
      }, 5000); // Refresh every 5 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [jobLogs.some(job => job.status === 'running')]);

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

  const loadHangfireData = async () => {
    try {
      const [recurring, processing, stats] = await Promise.all([
        adminAPI.getRecurringJobs().catch(err => {
          console.error('Recurring jobs error:', err);
          if (err.response?.status === 403) {
            setHangfireAccessDenied(true);
          }
          return [];
        }),
        adminAPI.getProcessingJobs().catch(err => {
          console.error('Processing jobs error:', err);
          if (err.response?.status === 403) {
            setHangfireAccessDenied(true);
          }
          return [];
        }),
        adminAPI.getQueueStats().catch(err => {
          console.error('Queue stats error:', err);
          if (err.response?.status === 403) {
            setHangfireAccessDenied(true);
          }
          return null;
        }),
      ]);
      
      if (!hangfireAccessDenied) {
        setRecurringJobs(recurring as any);
        setProcessingJobs(processing as any);
        setQueueStats(stats);
      }
    } catch (error: any) {
      console.error('Failed to load Hangfire data:', error);
    }
  };

  const handleTriggerRecurringJob = async (jobId: string) => {
    try {
      await adminAPI.triggerRecurringJob(jobId);
      message.success('Job triggered successfully');
      loadHangfireData();
    } catch (error: any) {
      message.error(error.message || 'Failed to trigger job');
    }
  };

  const handleDeleteRecurringJob = async (jobId: string) => {
    try {
      await adminAPI.deleteRecurringJob(jobId);
      message.success('Recurring job deleted');
      loadHangfireData();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete job');
    }
  };

  const handleCancelProcessingJob = async (jobId: string) => {
    try {
      await adminAPI.cancelJob(jobId);
      message.success('Job cancelled');
      loadHangfireData();
    } catch (error: any) {
      message.error(error.message || 'Failed to cancel job');
    }
  };

  const handleClearFailedJobs = async () => {
    try {
      await adminAPI.clearFailedJobs();
      message.success('Failed jobs cleared');
      loadHangfireData();
    } catch (error: any) {
      message.error(error.message || 'Failed to clear jobs');
    }
  };

  const handleCleanupStuckJobs = async () => {
    try {
      const result = await adminAPI.cleanupStuckJobs(30);
      message.success(`Cleaned up stuck jobs: ${JSON.stringify(result)}`);
      loadJobHistory();
    } catch (error: any) {
      message.error(error.message || 'Failed to cleanup stuck jobs');
    }
  };

  const handleUpdateSchedule = async (values: any) => {
    try {
      await adminAPI.updateJobSchedule(editingJob.id, values.cronExpression);
      message.success('Schedule updated successfully');
      setScheduleModalVisible(false);
      scheduleForm.resetFields();
      loadHangfireData();
    } catch (error: any) {
      message.error(error.message || 'Failed to update schedule');
    }
  };

  const loadJobHistory = async () => {
    try {
      const response = await adminAPI.getJobHistory({ page: currentPage, pageSize });
      console.log('📋 Job History:', response);
      
      // Map API response to UI format
      // Status: 0 = Running, 1 = Success, 2 = Failed
      const mappedJobs: JobLog[] = response.items.map((item: any) => {
        let status: 'running' | 'success' | 'failed' | 'pending' = 'pending';
        if (item.status === 0 && item.endTime === null) {
          status = 'running';
        } else if (item.status === 1) {
          status = 'success';
        } else if (item.status === 2) {
          status = 'failed';
        }
        
        return {
          id: item.id,
          jobType: item.jobType,
          status,
          startTime: item.startTime,
          endTime: item.endTime,
          durationSeconds: item.durationSeconds,
          message: item.message,
          details: item.details,
        };
      });
      
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
    // Prevent double execution
    if (loading !== null) {
      console.warn('⚠️ Sync already in progress, ignoring duplicate call');
      return;
    }
    
    console.log('🚀 Starting SunHotels sync job...');
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
      console.log('📡 Calling adminAPI.syncSunHotels()...');
      const response = await adminAPI.syncSunHotels();
      console.log('✅ Sync job started:', response);
      
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
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (time?: string | null) => time ? new Date(time).toLocaleString('tr-TR') : '-',
    },
    {
      title: 'Duration',
      dataIndex: 'durationSeconds',
      key: 'durationSeconds',
      render: (seconds?: number | null) => {
        if (!seconds) return '-';
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
      },
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: (message?: string | null) => message || '-',
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      render: (details?: string | null) => {
        if (!details) return '-';
        try {
          const parsed = JSON.parse(details);
          return (
            <Text code style={{ fontSize: 11 }}>
              {Object.entries(parsed).map(([key, value]) => `${key}: ${value}`).join(', ')}
            </Text>
          );
        } catch {
          return <Text type="secondary">{details.substring(0, 50)}...</Text>;
        }
      },
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

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'sync',
            label: <Space><CloudSyncOutlined />SunHotels Sync</Space>,
            children: (
              <div>
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
          dataSource={jobLogs || []}
          rowKey={(record) => record.id || `job-${Math.random()}`}
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
            ),
          },
          {
            key: 'management',
            label: <Space><SettingOutlined />Hangfire Management</Space>,
            children: hangfireAccessDenied ? (
              <Alert
                type="warning"
                showIcon
                message="Access Denied"
                description={
                  <div>
                    <Paragraph>
                      You don't have permission to access Hangfire Management features. 
                      This section requires elevated privileges.
                    </Paragraph>
                    <Paragraph type="secondary">
                      Hangfire Management allows direct control over background job scheduling, 
                      queue management, and job execution. These features are restricted to super administrators.
                    </Paragraph>
                    <Paragraph type="secondary">
                      <strong>Available Actions:</strong>
                      <ul>
                        <li>View and trigger recurring jobs</li>
                        <li>Monitor processing jobs</li>
                        <li>Update cron schedules</li>
                        <li>Clear failed jobs</li>
                        <li>Cleanup stuck jobs</li>
                      </ul>
                    </Paragraph>
                    <Text type="secondary">
                      Please contact your system administrator if you need access to these features.
                    </Text>
                  </div>
                }
                style={{ margin: '40px 0' }}
              />
            ) : (
              <div>
                {/* Queue Statistics */}
                {queueStats && (
                  <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="Enqueued"
                          value={queueStats.enqueued || 0}
                          prefix={<ClockCircleOutlined />}
                          styles={{ content: { color: '#1890ff' } }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="Processing"
                          value={queueStats.processing || 0}
                          prefix={<SyncOutlined spin />}
                          styles={{ content: { color: '#52c41a' } }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="Succeeded"
                          value={queueStats.succeeded || 0}
                          prefix={<CheckCircleOutlined />}
                          styles={{ content: { color: '#52c41a' } }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="Failed"
                          value={queueStats.failed || 0}
                          prefix={<CloseCircleOutlined />}
                          styles={{ content: { color: '#ff4d4f' } }}
                        />
                      </Card>
                    </Col>
                  </Row>
                )}

                {/* Recurring Jobs */}
                <Card 
                  title="Recurring Jobs (Scheduled)"
                  style={{ marginBottom: 24 }}
                  extra={
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={loadHangfireData}
                    >
                      Refresh
                    </Button>
                  }
                >
                  <Table
                    dataSource={recurringJobs || []}
                    rowKey={(record) => record.id || `recurring-${Math.random()}`}
                    size="small"
                    pagination={false}
                    columns={[
                      {
                        title: 'Job ID',
                        dataIndex: 'id',
                        key: 'id',
                        render: (id: string) => <Text code>{id}</Text>,
                      },
                      {
                        title: 'Cron',
                        dataIndex: 'cron',
                        key: 'cron',
                        render: (cron: string) => <Tag color="blue">{cron}</Tag>,
                      },
                      {
                        title: 'Next Execution',
                        dataIndex: 'nextExecution',
                        key: 'nextExecution',
                        render: (date: string) => date ? new Date(date).toLocaleString() : '-',
                      },
                      {
                        title: 'Last Execution',
                        dataIndex: 'lastExecution',
                        key: 'lastExecution',
                        render: (date: string) => date ? new Date(date).toLocaleString() : 'Never',
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        render: (_: any, record: any) => (
                          <Space>
                            <Button
                              size="small"
                              icon={<PlayCircleOutlined />}
                              onClick={() => handleTriggerRecurringJob(record.id)}
                            >
                              Trigger
                            </Button>
                            <Button
                              size="small"
                              icon={<ClockCircleTwoTone />}
                              onClick={() => {
                                setEditingJob(record);
                                scheduleForm.setFieldsValue({ cronExpression: record.cron });
                                setScheduleModalVisible(true);
                              }}
                            >
                              Schedule
                            </Button>
                            <Popconfirm
                              title="Delete this recurring job?"
                              onConfirm={() => handleDeleteRecurringJob(record.id)}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button size="small" danger icon={<DeleteOutlined />}>
                                Delete
                              </Button>
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </Card>

                {/* Processing Jobs */}
                <Card 
                  title="Currently Processing Jobs"
                  style={{ marginBottom: 24 }}
                >
                  <Table
                    dataSource={processingJobs || []}
                    rowKey={(record) => record.id || `processing-${Math.random()}`}
                    size="small"
                    pagination={false}
                    columns={[
                      {
                        title: 'Job ID',
                        dataIndex: 'id',
                        key: 'id',
                        render: (id: string) => <Text code>{id}</Text>,
                      },
                      {
                        title: 'Job Name',
                        dataIndex: 'job',
                        key: 'job',
                      },
                      {
                        title: 'Started At',
                        dataIndex: 'startedAt',
                        key: 'startedAt',
                        render: (date: string) => date ? new Date(date).toLocaleString() : '-',
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        render: (_: any, record: any) => (
                          <Popconfirm
                            title="Cancel this job?"
                            description="This will attempt to cancel the running job."
                            onConfirm={() => handleCancelProcessingJob(record.id)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button size="small" danger icon={<StopOutlined />}>
                              Cancel
                            </Button>
                          </Popconfirm>
                        ),
                      },
                    ]}
                  />
                </Card>

                {/* Management Actions */}
                <Card title="Management Actions">
                  <Space>
                    <Popconfirm
                      title="Clear all failed jobs?"
                      description="This will remove all failed jobs from the queue."
                      onConfirm={handleClearFailedJobs}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        Clear Failed Jobs
                      </Button>
                    </Popconfirm>
                    
                    <Popconfirm
                      title="Cleanup stuck jobs?"
                      description="This will clean up jobs that have been running for more than 30 minutes."
                      onConfirm={handleCleanupStuckJobs}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button icon={<ReloadOutlined />}>
                        Cleanup Stuck Jobs
                      </Button>
                    </Popconfirm>
                  </Space>
                </Card>
              </div>
            ),
          },
        ]}
      />

      {/* Schedule Update Modal */}
      <Modal
        title="Update Job Schedule"
        open={scheduleModalVisible}
        onOk={() => scheduleForm.submit()}
        onCancel={() => {
          setScheduleModalVisible(false);
          scheduleForm.resetFields();
        }}
      >
        <Form
          form={scheduleForm}
          layout="vertical"
          onFinish={handleUpdateSchedule}
        >
          <Form.Item
            name="cronExpression"
            label="Cron Expression"
            rules={[{ required: true, message: 'Please enter cron expression' }]}
          >
            <Input placeholder="0 0 * * *" />
          </Form.Item>
          <Alert
            message="Cron Expression Examples"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>Every minute: * * * * *</li>
                <li>Every hour: 0 * * * *</li>
                <li>Every day at midnight: 0 0 * * *</li>
                <li>Every Monday at 9 AM: 0 9 * * 1</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </Form>
      </Modal>
    </div>
  );
}
