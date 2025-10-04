import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  PlayIcon,
  DocumentIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

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
      const response = await fetch(`http://localhost:3000/api/admin/courses/${courseId}/contents`, {
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
      const response = await fetch(`http://localhost:3000/api/admin/courses/contents/${contentId}`, {
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

  if (loading) return <div className="flex justify-center p-8">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Course Content Management</h1>
        <button
          onClick={() => navigate(`/admin/courses/${courseId}/upload`)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Content
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {contents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No content available. Click "Add Content" to get started.
          </div>
        ) : (
          <div className="divide-y">
            {contents.map((module) => (
              <div key={module.module_name} className="p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleModule(module.module_name)}
                >
                  <h3 className="text-lg font-medium">{module.module_name}</h3>
                  {expandedModules[module.module_name] ? (
                    <ChevronUpIcon className="w-5 h-5" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5" />
                  )}
                </div>

                {expandedModules[module.module_name] && (
                  <div className="mt-4 space-y-3">
                    {module.contents.map((content) => (
                      <div
                        key={content.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {content.file_type === 'video' ? (
                            <PlayIcon className="w-5 h-5 text-blue-500" />
                          ) : (
                            <DocumentIcon className="w-5 h-5 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium">{content.lesson_title}</p>
                            <p className="text-sm text-gray-500">
                              {content.file_type} {content.is_preview && '• Preview'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDeleteContent(content.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="w-5 h-5" />
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
  );
};

export default AdminCourseContent;