import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import {
  PlayIcon,
  DocumentIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { apiUrl } from '../lib/api';

const AdminCourseContent = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState({});

  // Fetch course contents
  useEffect(() => {
    fetchContents();
  }, [courseId]);

  const fetchContents = async () => {
    try {
      const response = await fetch(apiUrl(`/api/admin/courses/${courseId}/contents`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch contents');
      const data = await response.json();
      setContents(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load course contents');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContent = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;

    try {
      const response = await fetch(apiUrl(`/api/admin/courses/contents/${contentId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete content');
      
      toast.success('Content deleted successfully');
      fetchContents(); // Refresh the contents list
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete content');
    }
  };

  const toggleModule = (moduleName) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  if (loading) return <AdminLayout title="Course Content"><div className="flex justify-center p-8 text-slate-300">Loading...</div></AdminLayout>;

  return (
    <AdminLayout title="Course Content">
      <div className="max-w-6xl mx-auto p-0">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold text-slate-100">Course Content Management</h1>
          <button
            onClick={() => navigate(`/admin/courses/${courseId}/upload`)}
            className="inline-flex items-center px-4 py-2 rounded-md bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/25"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Content
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl">
          {contents.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No content available. Click "Add Content" to get started.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {contents.map((module) => (
                <div key={module.module_name} className="p-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleModule(module.module_name)}
                  >
                    <h3 className="text-base font-medium text-slate-100">{module.module_name}</h3>
                    {expandedModules[module.module_name] ? (
                      <ChevronUpIcon className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  {expandedModules[module.module_name] && (
                    <div className="mt-3 space-y-3">
                      {module.contents.map((content) => (
                        <div
                          key={content.id}
                          className="flex items-center justify-between p-3 bg-black/30 border border-white/10 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {content.file_type === 'video' ? (
                              <PlayIcon className="w-5 h-5 text-emerald-300" />
                            ) : (
                              <DocumentIcon className="w-5 h-5 text-emerald-300" />
                            )}
                            <div>
                              <p className="font-medium text-slate-100">{content.lesson_title}</p>
                              <p className="text-xs text-slate-500">
                                {content.file_type} {content.is_preview && '• Preview'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteContent(content.id)}
                              className="px-3 py-1.5 text-xs rounded bg-red-500/15 text-red-200 border border-red-400/30 hover:bg-red-500/25"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCourseContent;