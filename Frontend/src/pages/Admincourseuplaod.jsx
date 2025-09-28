import React, { useState, useEffect } from 'react';
import { Upload, Video, FileText, Image, X, Plus, Save, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';

const CourseContentUpload = () => {
  const { courseId } = useParams(); // Get courseId from URL params
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingContent, setUploadingContent] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [formData, setFormData] = useState({
    module_name: '',
    lesson_title: '',
    order_number: '',
    embed_url: '',
    file: null
  });
  const [uploadType, setUploadType] = useState('file'); // 'file' or 'youtube'
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchCourseContents();
    }
  }, [courseId]);

  const fetchCourseContents = async () => {
    try {
      if (!courseId) {
        setError('No course selected');
        return;
      }
      
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/admin/courses/${courseId}/contents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setContents(data);
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to load course contents');
      }
    } catch (err) {
      setError('Failed to load course contents');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (file) => {
    setFormData(prev => ({
      ...prev,
      file: file,
      embed_url: '' // Clear YouTube URL if file is selected
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'video' || fileType?.startsWith('video/')) {
      return <Video className="w-5 h-5 text-blue-500" />;
    } else if (fileType === 'pdf' || fileType === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else {
      return <Image className="w-5 h-5 text-green-500" />;
    }
  };

  const validateForm = () => {
    if (!formData.lesson_title.trim()) {
      setError('Lesson title is required');
      return false;
    }
    
    if (uploadType === 'file' && !formData.file) {
      setError('Please select a file to upload');
      return false;
    }
    
    if (uploadType === 'youtube' && !formData.embed_url.trim()) {
      setError('Please enter a YouTube embed URL');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) return;
    
    try {
      setUploadingContent(true);
      const token = localStorage.getItem('token');
      
      const formDataToSend = new FormData();
      formDataToSend.append('module_name', formData.module_name);
      formDataToSend.append('lesson_title', formData.lesson_title);
      formDataToSend.append('order_number', formData.order_number || '0');
      
      if (uploadType === 'file' && formData.file) {
        formDataToSend.append('file', formData.file);
      } else if (uploadType === 'youtube') {
        formDataToSend.append('embed_url', formData.embed_url);
      }
      
      // Fixed: Use the correct endpoint with full URL
      const response = await fetch(`http://localhost:3000/api/admin/courses/${courseId}/contents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSuccess('Content uploaded successfully!');
        setFormData({
          module_name: '',
          lesson_title: '',
          order_number: '',
          embed_url: '',
          file: null
        });
        setShowUploadForm(false);
        fetchCourseContents(); // Refresh the list
      } else {
        setError(result.error || result.message || 'Failed to upload content');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploadingContent(false);
    }
  };

  const handleDelete = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      // Fixed: Use the correct endpoint with full URL
      const response = await fetch(`http://localhost:3000/api/admin/courses/contents/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setSuccess('Content deleted successfully');
        fetchCourseContents();
      } else {
        const result = await response.json();
        setError(result.error || result.message || 'Failed to delete content');
      }
    } catch (err) {
      setError('Delete failed. Please try again.');
      console.error('Delete error:', err);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!courseId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please select a course to upload content</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 mt-2">Loading course contents...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Course Content Management</h2>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Content
        </button>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-700 hover:text-green-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Upload New Content</h3>
            <button
              onClick={() => setShowUploadForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Upload Type Selection */}
            <div className="flex gap-4 mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="uploadType"
                  value="file"
                  checked={uploadType === 'file'}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="mr-2"
                />
                Upload File
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="uploadType"
                  value="youtube"
                  checked={uploadType === 'youtube'}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="mr-2"
                />
                YouTube Embed
              </label>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  name="lesson_title"
                  value={formData.lesson_title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module Name
                </label>
                <input
                  type="text"
                  name="module_name"
                  value={formData.module_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Number
                </label>
                <input
                  type="number"
                  name="order_number"
                  value={formData.order_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>

            {/* File Upload or YouTube Embed */}
            {uploadType === 'file' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File *
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    {formData.file 
                      ? `Selected: ${formData.file.name}` 
                      : 'Drag and drop a file here, or click to select'
                    }
                  </p>
                  <input
                    type="file"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                    accept="video/*,image/*,.pdf"
                  />
                  <label
                    htmlFor="file-upload"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block transition-colors"
                  >
                    Select File
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Supported: Video files, Images, PDFs
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube Embed URL *
                </label>
                <input
                  type="url"
                  name="embed_url"
                  value={formData.embed_url}
                  onChange={handleInputChange}
                  placeholder="https://www.youtube.com/embed/VIDEO_ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use the embed URL format from YouTube
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSubmit}
                disabled={uploadingContent}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                {uploadingContent ? 'Uploading...' : 'Upload Content'}
              </button>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Uploaded Content</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading content...</p>
          </div>
        ) : contents.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No content uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload your first lesson above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contents.map((content, index) => (
              <div key={content.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  {getFileIcon(content.file_type || content.content_type)}
                  <div>
                    <h4 className="font-medium text-gray-800">{content.lesson_title || content.title}</h4>
                    {content.module_name && (
                      <p className="text-sm text-gray-600">Module: {content.module_name}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Order: {content.order_number} | Type: {content.file_type || content.content_type}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {(content.file_url || content.content_url) && (
                    <a
                      href={content.file_url || content.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(content.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete content"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseContentUpload;