import React, { useState, useEffect } from 'react';
import { Upload, Video, FileText, Image, X, Plus, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const CourseContentUpload = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [modules, setModules] = useState([{
    id: Date.now(),
    name: '',
    contents: [{
      id: Date.now(),
      lesson_title: '',
      type: 'file',
      file: null,
      embed_url: '',
      is_preview: false,
      order_number: 1
    }]
  }]);
  const [loading, setLoading] = useState(false);
  const [expandedModule, setExpandedModule] = useState(null);
  const [error, setError] = useState('');

  // Add a new module
  const addModule = () => {
    setModules(prev => [...prev, {
      id: Date.now(),
      name: '',
      contents: [{
        id: Date.now(),
        lesson_title: '',
        type: 'file',
        file: null,
        embed_url: '',
        is_preview: false,
        order_number: 1
      }]
    }]);
  };

  // Add content to a module
  const addContent = (moduleId) => {
    setModules(prev => prev.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          contents: [...module.contents, {
            id: Date.now(),
            lesson_title: '',
            type: 'file',
            file: null,
            embed_url: '',
            is_preview: false,
            order_number: module.contents.length + 1
          }]
        };
      }
      return module;
    }));
  };

  // Update module name
  const updateModuleName = (moduleId, name) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId ? { ...module, name } : module
    ));
  };

  // Update content
  const updateContent = (moduleId, contentId, updates) => {
    setModules(prev => prev.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          contents: module.contents.map(content => 
            content.id === contentId ? { ...content, ...updates } : content
          )
        };
      }
      return module;
    }));
  };

  // Handle file selection
  const handleFileSelect = (moduleId, contentId, file) => {
    updateContent(moduleId, contentId, { file, type: 'file', embed_url: '' });
  };

  // Extract YouTube video ID
  const extractYoutubeVideoId = (url) => {
    let videoId = null;
    // Handle different YouTube URL formats
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1];
    }
    // Remove any additional parameters
    if (videoId) {
      const ampersandPosition = videoId.indexOf('&');
      if (ampersandPosition !== -1) {
        videoId = videoId.substring(0, ampersandPosition);
      }
    }
    return videoId;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      for (const module of modules) {
        if (!module.name.trim()) {
          toast.error('Module name is required');
          continue;
        }

        for (const content of module.contents) {
          const formData = new FormData();
          formData.append('module_name', module.name);
          formData.append('lesson_title', content.lesson_title);
          formData.append('order_number', content.order_number.toString());
          formData.append('is_preview', content.is_preview);

          if (content.type === 'youtube' && content.embed_url) {
            // Extract video ID from URL
            const videoId = extractYoutubeVideoId(content.embed_url);
            if (!videoId) {
              toast.error(`Invalid YouTube URL for lesson: ${content.lesson_title}`);
              continue;
            }
            
            formData.append('embed_url', videoId);
            formData.append('file_type', 'video');
          } else if (content.type === 'file' && content.file) {
            // For file uploads
            formData.append('file', content.file);
            formData.append('file_type', content.file.type.includes('video') ? 'video' : 'pdf');
          } else {
            continue; // Skip invalid content
          }

          const response = await fetch(`http://localhost:3000/api/admin/courses/${courseId}/contents`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          if (!response.ok) {
            throw new Error(`Failed to upload content: ${content.lesson_title}`);
          }
        }
      }

      toast.success('Course contents uploaded successfully!');
      navigate(`/admin/course/${courseId}/content`);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
      toast.error('Failed to upload course contents');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Course Content Upload</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {modules.map((module, moduleIndex) => (
          <div key={module.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <input
                type="text"
                placeholder="Module Name"
                value={module.name}
                onChange={(e) => updateModuleName(module.id, e.target.value)}
                className="text-xl font-semibold bg-transparent border-b-2 border-gray-200 focus:border-indigo-500 outline-none w-full"
                required
              />
              <button
                type="button"
                onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                className="text-gray-500 hover:text-gray-700"
              >
                {expandedModule === module.id ? <ChevronUp /> : <ChevronDown />}
              </button>
            </div>

            {expandedModule === module.id && (
              <div className="space-y-4">
                {module.contents.map((content, contentIndex) => (
                  <div key={content.id} className="border rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Lesson Title"
                        value={content.lesson_title}
                        onChange={(e) => updateContent(module.id, content.id, { lesson_title: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                      />
                      <select
                        value={content.type}
                        onChange={(e) => updateContent(module.id, content.id, { type: e.target.value })}
                        className="w-full p-2 border rounded"
                      >
                        <option value="file">File Upload</option>
                        <option value="youtube">YouTube Video</option>
                      </select>
                    </div>

                    <div className="mt-4">
                      {content.type === 'file' ? (
                        <input
                          type="file"
                          onChange={(e) => handleFileSelect(module.id, content.id, e.target.files[0])}
                          className="w-full"
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder="YouTube Video URL (e.g., https://youtube.com/watch?v=...)"
                          value={content.embed_url}
                          onChange={(e) => {
                            const url = e.target.value;
                            const videoId = extractYoutubeVideoId(url);
                            if (videoId) {
                              updateContent(module.id, content.id, { 
                                embed_url: url,
                                file_type: 'video' 
                              });
                            } else if (url && !videoId) {
                              toast.error('Please enter a valid YouTube URL');
                            }
                          }}
                          className="w-full p-2 border rounded"
                        />
                      )}
                    </div>

                    <div className="flex items-center mt-4">
                      <input
                        type="checkbox"
                        checked={content.is_preview}
                        onChange={(e) => updateContent(module.id, content.id, { is_preview: e.target.checked })}
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-600">Preview Content</label>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addContent(module.id)}
                  className="flex items-center text-indigo-600 hover:text-indigo-700 mt-4"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Lesson
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={addModule}
            className="flex items-center px-4 py-2 text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Module
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Save All Content'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseContentUpload;