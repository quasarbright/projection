import React, { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';
import { uploadThumbnail, deleteThumbnail } from '../services/api';
import { resolveAdminPath } from '../utils/pathResolver';
import './ImageUpload.css';

interface ImageUploadProps {
  projectId: string;
  currentThumbnail?: string;
  onChange: (thumbnailLink: string | null) => void;
  isEditMode?: boolean; // Whether editing an existing project
}

// Generate a simple UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const SUPPORTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

export const ImageUpload: React.FC<ImageUploadProps> = ({
  projectId,
  currentThumbnail,
  onChange,
  isEditMode = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentThumbnail || null);
  const [uploadedWithId, setUploadedWithId] = useState<string | null>(null);
  const [isTempFile, setIsTempFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when currentThumbnail changes
  useEffect(() => {
    // Resolve admin:// paths to actual URLs
    const resolvedPath = resolveAdminPath(currentThumbnail);
    setPreviewUrl(resolvedPath);
  }, [currentThumbnail]);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      return 'Please upload a PNG, JPG, GIF, or WebP image';
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return `File too large (${sizeMB} MB). Maximum size is 5 MB`;
    }
    return null;
  };

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Use projectId if provided, otherwise generate a UUID
    const uploadId = projectId || generateUUID();

    // Upload file
    setIsUploading(true);
    try {
      const response = await uploadThumbnail(uploadId, file, isEditMode);
      setUploadedWithId(uploadId);
      setIsTempFile(response.isTemp || false);
      onChange(response.thumbnailLink);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      setPreviewUrl(currentThumbnail || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = async () => {
    if (!currentThumbnail && !previewUrl) return;

    setIsUploading(true);
    setError(null);

    try {
      // Use the ID that was used for upload, or current projectId
      const deleteId = uploadedWithId || projectId;
      await deleteThumbnail(deleteId, isTempFile);
      setPreviewUrl(null);
      setUploadedWithId(null);
      setIsTempFile(false);
      onChange(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="image-upload">
      <label className="image-upload-label">Thumbnail</label>
      
      <div
        className={`image-upload-dropzone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        {previewUrl ? (
          <div className="image-preview">
            <img src={previewUrl} alt="Thumbnail preview" />
            {isUploading && (
              <div className="upload-overlay">
                <div className="spinner"></div>
                <span>Uploading...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="upload-placeholder">
            {isUploading ? (
              <>
                <div className="spinner"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="upload-text">Drop image here or click to browse</p>
                <p className="upload-hint">Max 5MB • PNG, JPG, GIF, WebP</p>
              </>
            )}
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_TYPES.join(',')}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={isUploading}
        />
      </div>

      {error && (
        <div className="image-upload-error">
          {error}
        </div>
      )}

      {previewUrl && !isUploading && (
        <button
          type="button"
          className="image-upload-remove"
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
        >
          Remove Image
        </button>
      )}
    </div>
  );
};
