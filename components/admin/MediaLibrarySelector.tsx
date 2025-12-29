'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Upload, Input, Image, Empty, Spin, Tag, App } from 'antd';
import { UploadOutlined, DeleteOutlined, FolderOutlined, SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
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

interface MediaLibrarySelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  currentUrl?: string;
  folder?: string; // Varsayılan klasör
}

const MediaLibrarySelectorContent: React.FC<MediaLibrarySelectorProps> = ({
  visible,
  onClose,
  onSelect,
  currentUrl,
  folder: defaultFolder = 'general'
}) => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>(defaultFolder);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Get auth headers with Bearer token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return { 'Authorization': `Bearer ${token}` };
  };

  // Load media files
  const loadMediaFiles = useCallback(async () => {
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

      const response = await fetch(`/api/Media?${params}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to load media files');
      }

      const data = await response.json();
      
      setFiles(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
      setCurrentPage(data.currentPage || 1);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.error('Error loading media files: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedFolder, searchTerm]);

  // Load folders
  const loadFolders = async () => {
    try {
      const response = await fetch('/api/Media/folders', {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to load folders');
      }

      const data = await response.json();
      setFolders(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error loading folders:', errorMessage);
    }
  };

  useEffect(() => {
    if (visible) {
      loadMediaFiles();
      loadFolders();
    }
  }, [visible, loadMediaFiles]);

  // File upload
  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file as File);
      
      if (selectedFolder) {
        formData.append('folder', selectedFolder);
      }

      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/Media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      
      message.success('File uploaded successfully');
      
      if (onSuccess) {
        onSuccess(data);
      }
      
      // Refresh list
      loadMediaFiles();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.error('Error uploading file: ' + errorMessage);
      
      if (onError) {
        onError(new Error(errorMessage));
      }
    } finally {
      setUploading(false);
    }
  };

  // Delete file
  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Delete File',
      content: 'Are you sure you want to delete this file?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await fetch(`/api/Media/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });

          if (!response.ok) {
            throw new Error('Failed to delete file');
          }

          message.success('File deleted successfully');
          loadMediaFiles();
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          message.error('Error deleting file: ' + errorMessage);
        }
      },
    });
  };

  // File selection
  const handleSelectFile = (file: MediaFile) => {
    setSelectedFileId(file.id);
  };

  // Confirm selection
  const handleConfirmSelection = () => {
    const selectedFile = files.find(f => f.id === selectedFileId);
    if (selectedFile) {
      onSelect(selectedFile.url);
      onClose();
    } else {
      message.warning('Please select a file');
    }
  };

  // Search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Go to first page when searching
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      message.warning('Please enter a folder name');
      return;
    }

    if (folders.includes(newFolderName.trim())) {
      message.warning('Folder already exists');
      return;
    }

    setFolders([...folders, newFolderName.trim()]);
    setSelectedFolder(newFolderName.trim());
    message.success(`Folder "${newFolderName.trim()}" will be created on first upload`);
    setFolderModalVisible(false);
    setNewFolderName('');
  };

  return (
    <Modal
      title="Media Library"
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button 
          key="select" 
          type="primary" 
          onClick={handleConfirmSelection}
          disabled={!selectedFileId}
        >
          Select
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        {/* Upload and search */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Upload
            customRequest={handleUpload}
            showUploadList={false}
            accept="image/*"
            multiple={false}
          >
            <Button 
              icon={<UploadOutlined />} 
              loading={uploading}
              type="primary"
            >
              Upload New
            </Button>
          </Upload>

          <Button
            icon={<PlusOutlined />}
            onClick={() => setFolderModalVisible(true)}
          >
            New Folder
          </Button>
          
          <Input.Search
            placeholder="Search files..."
            allowClear
            onSearch={handleSearch}
            onChange={(e) => {
              if (!e.target.value) {
                handleSearch('');
              }
            }}
            prefix={<SearchOutlined />}
            style={{ flex: 1 }}
          />
          
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => loadMediaFiles()}
          >
            Refresh
          </Button>
        </div>

        {/* Folder selection */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Tag 
              icon={<FolderOutlined />}
              color={!selectedFolder ? 'blue' : 'default'}
              style={{ cursor: 'pointer', padding: '4px 12px' }}
              onClick={() => {
                setSelectedFolder('');
                setCurrentPage(1);
              }}
            >
              All
            </Tag>
            {folders.map(folder => (
              <Tag
                key={folder}
                icon={<FolderOutlined />}
                color={selectedFolder === folder ? 'blue' : 'default'}
                style={{ cursor: 'pointer', padding: '4px 12px' }}
                onClick={() => {
                  setSelectedFolder(folder);
                  setCurrentPage(1);
                }}
              >
                {folder}
              </Tag>
            ))}
          </div>
        </div>
      </div>

      {/* Media grid */}
      <div style={{ minHeight: 400, maxHeight: 500, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" />
          </div>
        ) : files.length === 0 ? (
          <Empty 
            description="No media files found" 
            style={{ padding: '100px 0' }}
          />
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
            gap: 16 
          }}>
            {files.map(file => (
              <div
                key={file.id}
                style={{
                  border: selectedFileId === file.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  borderRadius: 8,
                  padding: 8,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s',
                  backgroundColor: selectedFileId === file.id ? '#e6f7ff' : '#fff'
                }}
                onClick={() => handleSelectFile(file)}
              >
                <div style={{ 
                  position: 'relative', 
                  paddingBottom: '100%', 
                  backgroundColor: '#f0f0f0',
                  borderRadius: 4,
                  overflow: 'hidden'
                }}>
                  {(() => {
                    const imageSrc = file.thumbnailUrl || file.url;
                    const fullUrl = imageSrc.startsWith('http') 
                      ? imageSrc 
                      : `${process.env.NEXT_PUBLIC_API_URL}${imageSrc}`;
                    const previewUrl = file.url.startsWith('http') 
                      ? file.url 
                      : `${process.env.NEXT_PUBLIC_API_URL}${file.url}`;
                    
                    return (
                      <Image
                        src={fullUrl}
                        alt={file.altText || file.originalFilename}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        preview={{
                          src: previewUrl
                        }}
                      />
                    );
                  })()}
                </div>
                
                <div style={{ 
                  marginTop: 8, 
                  fontSize: 12,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {file.originalFilename}
                </div>
                
                <div style={{ 
                  marginTop: 4, 
                  fontSize: 11,
                  color: '#999'
                }}>
                  {file.width && file.height && `${file.width}x${file.height}`}
                  {file.width && file.height && ' • '}
                  {(file.sizeBytes / 1024).toFixed(0)} KB
                </div>

                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(file.id);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          marginTop: 16, 
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8
        }}>
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span>
            Page {currentPage} / {totalPages} ({totalCount} files)
          </span>
          <Button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
      
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
          placeholder="Enter folder name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onPressEnter={handleCreateFolder}
          autoFocus
        />
      </Modal>
    </Modal>
  );
};

const MediaLibrarySelector: React.FC<MediaLibrarySelectorProps> = (props) => {
  return (
    <App>
      <MediaLibrarySelectorContent {...props} />
    </App>
  );
};

export default MediaLibrarySelector;
