import React, { useState, useEffect } from 'react';
import { Upload, Video, FileText, Image, X, Plus, Save, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';

const CourseContentUpload = () => {
  const { courseId } = useParams();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingContent, setUploadingContent] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [formData, setFormData] = useState({
    module_name: '',
    lesson_title: '',
    lesson_description: '',
    order_number: '',
    content_type: 'video',
    file_type: 'file',
    file: null,
    embed_url: '',
    is_preview: false,
    duration: '',
    prerequisites: ''
  });
  const [uploadType, setUploadType] = useState('file');
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

  const extractYoutubeVideoId = (url) => {
    // Handle different YouTube URL formats
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'embed_url') {
      // If it's the YouTube URL field
      const videoId = extractYoutubeVideoId(value);
      if (videoId) {
        // If valid YouTube URL, store just the video ID
        setFormData(prev => ({
          ...prev,
          embed_url: videoId
        }));
        setError('');
      } else if (value.trim() !== '') {
        // If there's a value but it's not a valid YouTube URL
        setError('Invalid YouTube URL. Please enter a valid YouTube video URL.');
      }
    } else {
      // For all other fields
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileSelect = (file) => {
    setFormData(prev => ({
      ...prev,
      file: file,
      embed_url: ''
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
    
    if (uploadType === 'youtube') {
      if (!formData.embed_url.trim()) {
        setError('Please enter a YouTube video URL');
        return false;
      }
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
      
      let requestConfig;

      if (uploadType === 'file' && formData.file) {
        // For file uploads, use FormData
        const formDataToSend = new FormData();
        formDataToSend.append('module_name', formData.module_name);
        formDataToSend.append('lesson_title', formData.lesson_title);
        formDataToSend.append('lesson_description', formData.lesson_description || '');
        formDataToSend.append('order_number', formData.order_number || '0');
        formDataToSend.append('content_type', formData.content_type);
        formDataToSend.append('file_type', 'file');
        formDataToSend.append('file', formData.file);
        formDataToSend.append('is_preview', formData.is_preview);
        
        requestConfig = {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        };
      } else if (uploadType === 'youtube') {
        // For YouTube videos, send JSON data
        const embedUrl = `https://www.youtube.com/embed/${formData.embed_url}`;
        const videoData = {
          module_name: formData.module_name,
          lesson_title: formData.lesson_title,
          lesson_description: formData.lesson_description || '',
          order_number: formData.order_number || '0',
          content_type: 'video',
          file_type: 'youtube',
          embed_url: embedUrl,
          is_preview: formData.is_preview || false,
          duration: formData.duration || ''
        };

        requestConfig = {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(videoData)
        };
      }
      
      console.log('Sending request with config:', requestConfig);
      
      const response = await fetch(`http://localhost:3000/api/admin/courses/${courseId}/contents`, requestConfig);
      
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
        fetchCourseContents();
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

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Course Content Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {success}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Add New Content</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Upload Type</label>
            <select
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="file">File Upload</option>
              <option value="youtube">YouTube Video</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Module Name</label>
            <input
              type="text"
              name="module_name"
              value={formData.module_name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Lesson Title</label>
            <input
              type="text"
              name="lesson_title"
              value={formData.lesson_title}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Order Number</label>
            <input
              type="number"
              name="order_number"
              value={formData.order_number}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {uploadType === 'youtube' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">YouTube Video URL</label>
              <input
                type="text"
                name="embed_url"
                value={formData.embed_url}
                onChange={handleInputChange}
                placeholder="Enter YouTube video URL"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700">File Upload</label>
              <input
                type="file"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="mt-1 block w-full"
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_preview"
              checked={formData.is_preview}
              onChange={(e) => setFormData(prev => ({ ...prev, is_preview: e.target.checked }))}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Make this content available as preview
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowUploadForm(false)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingContent}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {uploadingContent ? 'Uploading...' : 'Upload Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseContentUpload;