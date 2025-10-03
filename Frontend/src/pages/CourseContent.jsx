import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PlayIcon,
  DocumentIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const CourseContent = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(null);
  const [activeContent, setActiveContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Load course content
  useEffect(() => {
    checkAccessAndLoadContent();
  }, [courseId]);

  // Load comments when active content changes
  useEffect(() => {
    if (activeContent?.id) {
      fetchComments(activeContent.id);
    }
  }, [activeContent]);

  // Fetch comments
  const fetchComments = async (lessonId) => {
    try {
      setLoadingComments(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/auth/v1/lessons/${lessonId}/comments`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch comments');
      setComments(data);
    } catch (err) {
      console.error('Error fetching comments:', err);
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  // Submit comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/auth/v1/lessons/${activeContent.id}/comments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: commentText.trim() })
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to post comment');

      setComments(prev => [data, ...prev]);
      setCommentText('');
      toast.success('Comment posted successfully');
    } catch (err) {
      console.error('Error posting comment:', err);
      toast.error('Failed to post comment');
    }
  };

  // Check course access and load content
  const checkAccessAndLoadContent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to access the course');
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:3000/api/auth/v1/courses/${courseId}/access`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 403) {
          toast.error('You need to enroll in this course to access the content');
          navigate(`/courses/${courseId}`);
          return;
        }
        throw new Error(data.message || 'Failed to verify course access');
      }

      if (!data || !data.course) throw new Error('Invalid course data received');
      setCourseData(data);
      if (data.content && data.content.length > 0) setActiveContent(data.content[0]);
    } catch (err) {
      console.error('Error loading course:', err);
      setError(err.message || 'Failed to load course content');
      toast.error(err.message || 'Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleName) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-100"><div>Loading course content...</div></div>;
  if (error) return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-red-600">{error}</div></div>;
  if (!courseData || !courseData.content) return <div className="flex items-center justify-center h-screen bg-gray-100"><div>No content available for this course</div></div>;

  const modules = courseData.content.reduce((acc, item) => {
    if (!acc[item.module_name]) acc[item.module_name] = [];
    acc[item.module_name].push(item);
    return acc;
  }, {});

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">{courseData.course.title}</h2>
          <p className="text-sm text-gray-600 mt-1">Course Content</p>
        </div>
        <div className="p-4">
          {Object.entries(modules).map(([moduleName, lessons], moduleIndex) => (
            <div key={moduleIndex} className="mb-4">
              <button
                onClick={() => toggleModule(moduleName)}
                className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <BookOpenIcon className="w-5 h-5 mr-2 text-gray-500" />
                  <h3 className="font-medium text-gray-700">{moduleName}</h3>
                </div>
                {expandedModules[moduleName] ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
              </button>
              {expandedModules[moduleName] && (
                <div className="ml-4 mt-2 space-y-2">
                  {lessons.map(lesson => (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveContent(lesson)}
                      className={`flex items-center w-full p-2 rounded-lg ${activeContent?.id === lesson.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                    >
                      {lesson.file_type === 'video' ? <PlayIcon className="w-5 h-5 mr-3 text-blue-500" /> : <DocumentIcon className="w-5 h-5 mr-3 text-red-500" />}
                      <div className="text-left">
                        <p className="font-medium">{lesson.lesson_title}</p>
                        <p className="text-sm text-gray-500">{lesson.file_type.charAt(0).toUpperCase() + lesson.file_type.slice(1)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {activeContent ? (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-6 border-b">
                <h1 className="text-2xl font-semibold">{activeContent.lesson_title}</h1>
                {activeContent.lesson_description && <p className="text-gray-600 mt-2">{activeContent.lesson_description}</p>}
              </div>

              <div className="p-6">
                {activeContent.file_type === 'video' ? (
                  <>
                    <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                      <iframe
                        src={activeContent.file_url.includes('youtube.com') ? activeContent.file_url.replace('watch?v=', 'embed/') : activeContent.file_url}
                        className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                        style={{ minHeight: '480px' }}
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      ></iframe>
                    </div>

                    {/* Comments */}
                    <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
                      <h3 className="text-xl font-semibold mb-6">Comments</h3>

                      <form onSubmit={handleCommentSubmit} className="mb-8">
                        <textarea
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows="3"
                          placeholder="Write your comment here..."
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                        ></textarea>
                        <button
                          type="submit"
                          className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          disabled={!commentText.trim()}
                        >
                          Post Comment
                        </button>
                      </form>

                      <div className="space-y-6">
                        {comments.length ? comments.map(comment => (
                          <div key={comment.id} className="flex space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-600 font-semibold">
                                  {comment.user?.full_name?.charAt(0).toUpperCase() || comment.user?.email?.charAt(0).toUpperCase() || "U"}
                                </span>
                              </div>
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold">{comment.user?.full_name || comment.user?.email || "Unknown User"}</span>
                                <span className="text-gray-500 text-sm">{new Date(comment.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="mt-1 text-gray-700">{comment.content}</p>
                            </div>
                          </div>
                        )) : <p className="text-gray-500 text-center">No comments yet. Be the first to comment!</p>}
                      </div>
                    </div>
                  </>
                ) : activeContent.file_type === 'pdf' ? (
                  <div className="h-[800px]">
                    <iframe src={activeContent.file_url} className="w-full h-full rounded-lg" title={activeContent.lesson_title}></iframe>
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg">
                    <a href={activeContent.file_url} download className="flex items-center text-blue-600 hover:text-blue-800">
                      <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                      Download Resource
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a lesson to begin</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseContent;
