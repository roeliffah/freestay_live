'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Space,
  Input,
  InputNumber,
  Form,
  Alert,
  Spin,
  Table,
  Tag,
  Empty,
  Divider,
  Row,
  Col,
  Statistic,
  App,
  Modal,
  Typography,
  Popconfirm,
} from 'antd';
import {
  ThunderboltOutlined,
  SyncOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { adminAPI } from '@/lib/api/client';

const { Title, Text, Paragraph } = Typography;

interface WarmupJob {
  id: string;
  jobId: string;
  cron: string;
  lastExecution?: string;
  nextExecution?: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  message?: string;
}

interface JobStatus {
  processingJobs: any[];
  scheduledJobs: any[];
  enqueuedJobs: any[];
}

export default function PopularDestinationsWarmup() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [cron, setCron] = useState('0 3 * * *'); // Default: 03:00 every day
  const [maxCount, setMaxCount] = useState(50);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [msg, setMsg] = useState<string>('');
  const [msgType, setMsgType] = useState<'success' | 'error' | 'info'>('info');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Cron presets
  const cronPresets = [
    { label: '03:00 (Every day)', value: '0 3 * * *' },
    { label: '04:00 (Every day)', value: '0 4 * * *' },
    { label: 'Every 6 hours', value: '0 */6 * * *' },
    { label: 'Every 12 hours', value: '0 */12 * * *' },
    { label: 'Midnight', value: '0 0 * * *' },
  ];

  // Load job status on mount and at intervals
  useEffect(() => {
    loadStatus();
    const intervalId = setInterval(loadStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(intervalId);
  }, []);

  const loadStatus = async () => {
    setStatusLoading(true);
    try {
      const response = await adminAPI.getPopularDestinationsWarmupStatus();
      console.log('📊 Warmup Status:', response);
      setStatus(response as JobStatus);
    } catch (error: any) {
      console.error('❌ Failed to load warmup status:', error);
      // Don't show error toast on auto-refresh
    } finally {
      setStatusLoading(false);
    }
  };

  const handleScheduleWarmup = async () => {
    setLoading(true);
    setMsg('');
    try {
      const response = await adminAPI.schedulePopularDestinationsWarmup(cron, maxCount);
      setMsg((response as any).message || 'Warmup scheduled successfully!');
      setMsgType('success');
      setShowScheduleModal(false);
      form.resetFields();
      await loadStatus();
    } catch (error: any) {
      setMsg(error.message || 'Failed to schedule warmup');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerNow = async () => {
    setLoading(true);
    setMsg('');
    try {
      const response = await adminAPI.triggerPopularDestinationsWarmup();
      setMsg((response as any).message || 'Warmup triggered successfully!');
      setMsgType('success');
      message.success('Warmup job triggered!');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await loadStatus();
    } catch (error: any) {
      setMsg(error.message || 'Failed to trigger warmup');
      setMsgType('error');
      message.error(error.message || 'Failed to trigger warmup');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    setLoading(true);
    setMsg('');
    try {
      const response = await adminAPI.cleanupRecurringJobs();
      setMsg((response as any).message || 'Recurring jobs cleaned up!');
      setMsgType('success');
      message.success('Recurring jobs cleaned up!');
      await loadStatus();
    } catch (error: any) {
      setMsg(error.message || 'Failed to cleanup jobs');
      setMsgType('error');
      message.error(error.message || 'Failed to cleanup jobs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      running: 'processing',
      scheduled: 'default',
      completed: 'success',
      failed: 'error',
      enqueued: 'warning',
    };
    return colorMap[status] || 'default';
  };

  const processingColumns = [
    {
      title: 'Job ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'jobType',
      key: 'jobType',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Started',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => new Date(time).toLocaleString(),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>
          <ThunderboltOutlined /> Popular Destinations Warmup
        </Title>
        <Paragraph type="secondary">
          Schedule and manage cache warmup jobs for popular destinations to ensure fast search results
        </Paragraph>
      </div>

      {msg && (
        <Alert
          title={msg}
          type={msgType}
          showIcon
          closable
          style={{ marginBottom: 16 }}
          onClose={() => setMsg('')}
        />
      )}

      {/* Schedule Section */}
      <Card
        title="Schedule Nightly Warmup"
        style={{ marginBottom: 24 }}
        extra={
          <Button
            type="primary"
            loading={loading}
            onClick={() => setShowScheduleModal(true)}
          >
            Schedule
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <div>
              <Text strong>Current Cron: </Text>
              <Text code>{cron}</Text>
            </div>
            <Paragraph type="secondary" style={{ marginTop: 8 }}>
              Max Count: <Text code>{maxCount}</Text>
            </Paragraph>
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Quick Presets:</Text>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {cronPresets.map((preset) => (
                <Button
                  key={preset.value}
                  size="small"
                  onClick={() => setCron(preset.value)}
                  type={cron === preset.value ? 'primary' : 'default'}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </Col>
        </Row>
      </Card>

      {/* Actions Section */}
      <Card title="Actions" style={{ marginBottom: 24 }}>
        <Space orientation="horizontal" style={{ width: '100%', flexWrap: 'wrap' }}>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={loading}
            onClick={handleTriggerNow}
          >
            Trigger Now
          </Button>
          <Popconfirm
            title="Cleanup Recurring Jobs"
            description="Are you sure you want to clean up all recurring jobs? This action cannot be undone."
            onConfirm={handleCleanup}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={loading}
            >
              Cleanup Recurring
            </Button>
          </Popconfirm>
          <Button
            icon={<ReloadOutlined />}
            loading={statusLoading}
            onClick={loadStatus}
          >
            Refresh Status
          </Button>
        </Space>
      </Card>

      {/* Status Section */}
      <Card
        title="Job Status"
        loading={statusLoading}
        style={{ marginBottom: 24 }}
      >
        {!status ? (
          <Empty description="No jobs found" />
        ) : (
          <div>
            {/* Processing Jobs */}
            {status.processingJobs && status.processingJobs.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <Title level={4}>
                  <ClockCircleOutlined /> Processing ({status.processingJobs.length})
                </Title>
                <Table
                  columns={processingColumns}
                  dataSource={status.processingJobs}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </div>
            )}

            {/* Scheduled Jobs */}
            {status.scheduledJobs && status.scheduledJobs.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <Divider />
                <Title level={4}>
                  <CheckCircleOutlined /> Scheduled ({status.scheduledJobs.length})
                </Title>
                <Table
                  columns={[
                    {
                      title: 'Job ID',
                      dataIndex: 'id',
                      key: 'id',
                      render: (text: string) => <Text code>{text}</Text>,
                    },
                    {
                      title: 'Cron Expression',
                      dataIndex: 'cron',
                      key: 'cron',
                      render: (cron: string) => <Text code>{cron}</Text>,
                    },
                    {
                      title: 'Next Execution',
                      dataIndex: 'nextExecution',
                      key: 'nextExecution',
                      render: (time: string) =>
                        time ? new Date(time).toLocaleString() : 'N/A',
                    },
                  ]}
                  dataSource={status.scheduledJobs}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </div>
            )}

            {/* Enqueued Jobs */}
            {status.enqueuedJobs && status.enqueuedJobs.length > 0 && (
              <div>
                <Divider />
                <Title level={4}>
                  <ThunderboltOutlined /> Enqueued ({status.enqueuedJobs.length})
                </Title>
                <Table
                  columns={[
                    {
                      title: 'Job ID',
                      dataIndex: 'id',
                      key: 'id',
                      render: (text: string) => <Text code>{text}</Text>,
                    },
                    {
                      title: 'Enqueued At',
                      dataIndex: 'enqueuedAt',
                      key: 'enqueuedAt',
                      render: (time: string) =>
                        time ? new Date(time).toLocaleString() : 'N/A',
                    },
                  ]}
                  dataSource={status.enqueuedJobs}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </div>
            )}

            {!status.processingJobs?.length &&
              !status.scheduledJobs?.length &&
              !status.enqueuedJobs?.length && <Empty description="No jobs found" />}
          </div>
        )}
      </Card>

      {/* Schedule Modal */}
      <Modal
        title="Schedule Popular Destinations Warmup"
        open={showScheduleModal}
        onOk={() => form.submit()}
        onCancel={() => setShowScheduleModal(false)}
        loading={loading}
      >
        <Form 
          layout="vertical"
          form={form}
          onFinish={handleScheduleWarmup}
        >
          <Form.Item label="Cron Expression" required>
            <Input
              value={cron}
              onChange={(e) => setCron(e.target.value)}
              placeholder="0 3 * * *"
            />
            <Paragraph type="secondary" style={{ marginTop: 8 }}>
              Format: minute hour day month dayOfWeek
            </Paragraph>
          </Form.Item>

          <Form.Item label="Max Destinations to Warmup" required>
            <InputNumber
              value={maxCount}
              onChange={(val) => setMaxCount(val || 50)}
              min={1}
              max={1000}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <div>
            <Text strong>Presets:</Text>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {cronPresets.map((preset) => (
                <Button
                  key={preset.value}
                  size="small"
                  onClick={() => setCron(preset.value)}
                  type={cron === preset.value ? 'primary' : 'default'}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
