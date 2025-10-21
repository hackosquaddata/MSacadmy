import React, { useState, useEffect } from 'react';
import { Upload, Video, FileText, Image, X, Plus, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import QuizBuilder from '../components/QuizBuilder';
import { apiUrl } from '../lib/api';

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
      quiz: '',
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
            quiz: '',
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

  // Extract Dailymotion video ID
  const extractDailymotionId = (url) => {
    if (!url) return null;
    try {
      if (url.includes('dailymotion.com/video/')) {
        const after = url.split('/video/')[1] || '';
        return after.split(/[\?_]/)[0];
      }
      if (url.includes('dai.ly/')) {
        const after = url.split('dai.ly/')[1] || '';
        return after.split('?')[0];
      }
      // Might already be an ID
      return url.trim();
    } catch {
      return null;
    }
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

          if (content.type === 'dailymotion' && content.embed_url) {
            // Extract video ID from URL
            const videoId = extractDailymotionId(content.embed_url);
            if (!videoId) {
              toast.error(`Invalid Dailymotion URL for lesson: ${content.lesson_title}`);
              continue;
            }
            
            formData.append('embed_url', videoId);
            formData.append('file_type', 'video');
          } else if (content.type === 'file' && content.file) {
            // For file uploads
            formData.append('file', content.file);
            formData.append('file_type', content.file.type.includes('video') ? 'video' : 'pdf');
          } else if (content.type === 'quiz' && content.quiz) {
            // Validate JSON
            try {
              const parsed = JSON.parse(content.quiz);
              formData.append('quiz', JSON.stringify(parsed));
              formData.append('file_type', 'quiz');
            } catch (e) {
              toast.error(`Invalid quiz JSON for lesson: ${content.lesson_title}`);
              continue;
            }
          } else {
            continue; // Skip invalid content
          }

          const response = await fetch(apiUrl(`/api/admin/courses/${courseId}/contents`), {
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
    <AdminLayout title="Upload Course Content">
      <div className="max-w-5xl mx-auto p-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          {modules.map((module, moduleIndex) => (
            <div key={module.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  placeholder="Module Name"
                  value={module.name}
                  onChange={(e) => updateModuleName(module.id, e.target.value)}
                  className="text-lg font-semibold bg-transparent border-b border-white/10 focus:border-emerald-400/50 outline-none w-full text-slate-100 placeholder:text-slate-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                  className="text-slate-400 hover:text-slate-200 ml-3"
                >
                  {expandedModule === module.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {expandedModule === module.id && (
                <div className="space-y-4">
                  {module.contents.map((content, contentIndex) => (
                    <div key={content.id} className="border border-white/10 rounded-lg p-4 bg-black/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Lesson Title"
                          value={content.lesson_title}
                          onChange={(e) => updateContent(module.id, content.id, { lesson_title: e.target.value })}
                          className="w-full p-2 bg-black/30 border border-white/10 rounded text-slate-100 placeholder:text-slate-500"
                          required
                        />
                        <select
                          value={content.type}
                          onChange={(e) => updateContent(module.id, content.id, { type: e.target.value })}
                          className="w-full p-2 bg-black/30 border border-white/10 rounded text-slate-100"
                        >
                          <option value="file">File Upload</option>
                          <option value="dailymotion">Dailymotion Video</option>
                          <option value="quiz">MCQ Quiz</option>
                        </select>
                      </div>

                      <div className="mt-4">
                        {content.type === 'file' ? (
                          <input
                            type="file"
                            onChange={(e) => handleFileSelect(module.id, content.id, e.target.files[0])}
                            className="w-full text-slate-200"
                          />
                        ) : content.type === 'dailymotion' ? (
                          <input
                            type="text"
                            placeholder="Dailymotion URL (e.g., https://www.dailymotion.com/video/x7u5g4...) or https://dai.ly/x7u5g4"
                            value={content.embed_url}
                            onChange={(e) => {
                              const url = e.target.value;
                              const videoId = extractDailymotionId(url);
                              if (videoId) {
                                updateContent(module.id, content.id, { 
                                  embed_url: url,
                                  file_type: 'video' 
                                });
                              } else if (url && !videoId) {
                                toast.error('Please enter a valid Dailymotion URL');
                              }
                            }}
                            className="w-full p-2 bg-black/30 border border-white/10 rounded text-slate-100 placeholder:text-slate-500"
                          />
                        ) : (
                          <div className="p-0">
                            <QuizBuilder
                              value={(() => { try { return content.quiz ? JSON.parse(content.quiz) : undefined; } catch { return undefined; } })()}
                              onChange={(quizObj) => updateContent(module.id, content.id, { quiz: JSON.stringify(quizObj) })}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center mt-4">
                        <input
                          type="checkbox"
                          checked={content.is_preview}
                          onChange={(e) => updateContent(module.id, content.id, { is_preview: e.target.checked })}
                          className="mr-2"
                        />
                        <label className="text-sm text-slate-400">Preview Content</label>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addContent(module.id)}
                    className="flex items-center text-emerald-300 hover:text-emerald-200 mt-2"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Lesson
                  </button>
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-between mt-4">
            <button
              type="button"
              onClick={addModule}
              className="flex items-center px-4 py-2 text-emerald-200 bg-emerald-500/15 border border-emerald-400/30 rounded-md hover:bg-emerald-500/25"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 rounded-md hover:bg-emerald-500/25 disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Save All Content'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default CourseContentUpload;