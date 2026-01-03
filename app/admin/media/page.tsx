'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Space,
  Upload,
  Input,
  Tag,
  Modal,
  Form,
  Image,
  Popconfirm,
  Select,
  Statistic,
  Row,
  Col,
  App,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderOutlined,
  SearchOutlined,
  PictureOutlined,
  FileImageOutlined,
  DatabaseOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';

interface MediaFile {
  id: string;
  filename: string;
  originalFilename: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  folder?: string;
  altText?: string;
  tags?: string[];
  createdAt: string;
}

interface MediaListResponse {
  items: MediaFile[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

function MediaManagementPageContent() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [form] = Form.useForm();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Stats
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    totalSizeFormatted: '0 MB',
  });

  useEffect(() => {
    loadMediaFiles();
    loadFolders();
    loadStats();
  }, [currentPage, selectedFolder, searchTerm]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return {
      'Authorization': `Bearer ${token}`,
    };
  };

  const loadMediaFiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      if (selectedFolder) {
        params.append('folder', selectedFolder);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Media?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to load media files');
      }

      const data: MediaListResponse = await response.json();

      console.log('📋 Media files loaded:', {
        totalItems: data.items?.length || 0,
        firstItem: data.items?.[0],
        firstItemUrl: data.items?.[0]?.url,
        firstItemThumbnail: data.items?.[0]?.thumbnailUrl,
      });

      setFiles(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
      setCurrentPage(data.currentPage || 1);
    } catch (error) {
      console.error('❌ Load error:', error);
      message.error('Failed to load media files');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Media/folders`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to load folders');
      }

      const data = await response.json();
      setFolders(data || []);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Media/stats/storage`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to load stats');
      }

      const data = await response.json();
      setStats(data || { totalFiles: 0, totalSize: 0, totalSizeFormatted: '0 MB' });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;

    setUploading(true);

    try {
      const token = localStorage.getItem('admin_token');
      const formData = new FormData();
      formData.append('file', file as File);

      if (selectedFolder) {
        formData.append('folder', selectedFolder);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      
      console.log('📤 Upload successful - Response:', data);
      console.log('📸 Uploaded file URL:', data.url);
      console.log('🆔 File ID:', data.id);

      message.success('File uploaded successfully');

      if (onSuccess) {
        onSuccess(data);
      }

      loadMediaFiles();
      loadStats();
    } catch (error) {
      console.error('❌ Upload error:', error);
      message.error('Failed to upload file');

      if (onError) {
        onError(new Error('Upload failed'));
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Media/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      message.success('File deleted successfully');
      loadMediaFiles();
      loadStats();
    } catch (error) {
      message.error('Failed to delete file');
    }
  };

  const handleEdit = (file: MediaFile) => {
    setEditingFile(file);
    form.setFieldsValue({
      altText: file.altText || '',
      tags: file.tags || [],
      folder: file.folder || '',
    });
    setEditModalVisible(true);
  };

  const handleUpdate = async (values: any) => {
    if (!editingFile) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Media/${editingFile.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to update file');
      }

      message.success('File updated successfully');
      setEditModalVisible(false);
      loadMediaFiles();
    } catch (error) {
      message.error('Failed to update file');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      message.warning('Please enter a folder name');
      return;
    }

    // Since backend doesn't have folder creation endpoint, 
    // we'll just add it to local state and it will be created on upload
    if (folders.includes(newFolderName.trim())) {
      message.warning('Folder already exists');
      return;
    }

    setFolders([...folders, newFolderName.trim()]);
    message.success(`Folder "${newFolderName.trim()}" will be created on first upload`);
    setFolderModalVisible(false);
    setNewFolderName('');
  };

  const columns = [
    {
      title: 'Preview',
      dataIndex: 'thumbnailUrl',
      key: 'preview',
      width: 100,
      responsive: ['md'] as any,
      render: (thumbnailUrl: string, record: MediaFile) => {
        const imageSrc = thumbnailUrl || record.url;
        const fullUrl = imageSrc.startsWith('http') 
          ? imageSrc 
          : `${process.env.NEXT_PUBLIC_API_URL}${imageSrc}`;
        const previewUrl = record.url.startsWith('http') 
          ? record.url 
          : `${process.env.NEXT_PUBLIC_API_URL}${record.url}`;
        
        return (
          <Image
            src={fullUrl}
            alt={record.altText || record.originalFilename}
            width={60}
            height={60}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={{ src: previewUrl }}
          />
        );
      },
    },
    {
      title: 'Filename',
      dataIndex: 'originalFilename',
      key: 'filename',
      ellipsis: true,
    },
    {
      title: 'Dimensions',
      dataIndex: 'width',
      key: 'dimensions',
      responsive: ['lg'] as any,
      render: (width: number, record: MediaFile) =>
        width && record.height ? `${width}x${record.height}` : '-',
    },
    {
      title: 'Size',
      dataIndex: 'sizeBytes',
      key: 'size',
      responsive: ['md'] as any,
      render: (size: number) => `${(size / 1024).toFixed(1)} KB`,
    },
    {
      title: 'Folder',
      dataIndex: 'folder',
      key: 'folder',
      responsive: ['lg'] as any,
      render: (folder: string) =>
        folder ? <Tag icon={<FolderOutlined />}>{folder}</Tag> : '-',
    },
    {
      title: 'Alt Text',
      dataIndex: 'altText',
      key: 'altText',
      ellipsis: true,
      responsive: ['xl'] as any,
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      responsive: ['xl'] as any,
      render: (tags: string[]) =>
        tags && tags.length > 0 ? (
          <Space size={[0, 4]} wrap>
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right' as any,
      render: (_: any, record: MediaFile) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this file?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
          <FileImageOutlined /> Media Library
        </h1>
        <p style={{ color: '#666' }}>
          Manage your images and media files
        </p>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Files"
              value={stats.totalFiles}
              prefix={<PictureOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Size"
              value={stats.totalSizeFormatted}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="Folders" value={folders.length} prefix={<FolderOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: 16 }}>
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap style={{ width: '100%' }}>
            <Upload customRequest={handleUpload} showUploadList={false} accept="image/*" multiple>
              <Button icon={<UploadOutlined />} loading={uploading} type="primary">
                Upload File
              </Button>
            </Upload>

            <Button
              icon={<PlusOutlined />}
              onClick={() => setFolderModalVisible(true)}
            >
              New Folder
            </Button>

            <Select
              style={{ minWidth: 150, width: '100%', maxWidth: 200 }}
              placeholder="Select folder"
              allowClear
              value={selectedFolder || undefined}
              onChange={(value) => {
                setSelectedFolder(value || '');
                setCurrentPage(1);
              }}
            >
              {folders.map((folder) => (
                <Select.Option key={folder} value={folder}>
                  <FolderOutlined /> {folder}
                </Select.Option>
              ))}
            </Select>

            <Input.Search
              placeholder="Search files..."
              allowClear
              onSearch={(value) => {
                setSearchTerm(value);
                setCurrentPage(1);
              }}
              onChange={(e) => {
                if (!e.target.value) {
                  setSearchTerm('');
                  setCurrentPage(1);
                }
              }}
              prefix={<SearchOutlined />}
              style={{ minWidth: 200, flex: 1, maxWidth: 400 }}
            />
          </Space>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          loading={loading}
          dataSource={files || []}
          columns={columns}
          rowKey={(record) => record.id || `file-${Math.random()}`}
          scroll={{ x: 800 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalCount,
            onChange: (page) => setCurrentPage(page),
            showTotal: (total) => `Total ${total} files`,
            responsive: true,
          }}
        />
      </Card>

      {/* Edit Modal */}
      <Modal
        title="Edit Media"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => form.submit()}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item label="Alt Text" name="altText">
            <Input placeholder="Description text for the image" />
          </Form.Item>

          <Form.Item label="Tags" name="tags">
            <Select mode="tags" placeholder="Add tags">
              {/* Tags will be created dynamically */}
            </Select>
          </Form.Item>

          <Form.Item label="Folder" name="folder">
            <Select placeholder="Select folder" allowClear>
              {folders.map((folder) => (
                <Select.Option key={folder} value={folder}>
                  {folder}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Folder Modal */}
      <Modal
        title="Create New Folder"
        open={folderModalVisible}
        onCancel={() => {
          setFolderModalVisible(false);
          setNewFolderName('');
        }}
        onOk={handleCreateFolder}
        okText="Create"
        cancelText="Cancel"
      >
        <Input
          placeholder="Enter folder name (e.g., banners, logos, hotels)"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onPressEnter={handleCreateFolder}
          autoFocus
        />
        <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
          Note: Folder will be created when you upload the first file to it.
        </div>
      </Modal>
    </div>
  );
}

export default function MediaManagementPage() {
  return (
    <App>
      <MediaManagementPageContent />
    </App>
  );
}
