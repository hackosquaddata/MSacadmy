import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PlayIcon,
  DocumentIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  ChatBubbleLeftIcon
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
  const [progress, setProgress] = useState({});
  const [overallProgress, setOverallProgress] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Load course content
  useEffect(() => {
    checkAccessAndLoadContent();
    fetchProgress();
  }, [courseId]);

  // Load comments when active content changes
  useEffect(() => {
    if (activeContent?.id) {
      fetchComments(activeContent.id);
    }
  }, [activeContent]);

  // Fetch course progress
  const fetchProgress = async () => {
    try {
      setLoadingProgress(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/auth/v1/courses/${courseId}/progress`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }

      const data = await response.json();
      setProgress(data.contentProgress || {});
      setOverallProgress(data.progress || 0);

      // Update progress indicators in content list
      if (courseData?.content) {
        const updatedContent = courseData.content.map(content => ({
          ...content,
          completed: data.contentProgress[content.id]?.completed || false,
          watch_time: data.contentProgress[content.id]?.watch_time || 0,
          last_position: data.contentProgress[content.id]?.last_position || 0
        }));
        setCourseData(prev => ({
          ...prev,
          content: updatedContent
        }));
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
      toast.error('Failed to load progress');
    } finally {
      setLoadingProgress(false);
    }
  };

  // Update content progress
  const updateProgress = async (contentId, completed) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/auth/v1/content/${contentId}/progress`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ completed })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      const data = await response.json();
      setProgress(prev => ({
        ...prev,
        [contentId]: data
      }));
      
      // Refresh overall progress
      fetchProgress();
      toast.success('Progress updated');
    } catch (err) {
      console.error('Error updating progress:', err);
      toast.error('Failed to update progress');
    }
  };

  // Handle content completion
  const handleContentComplete = async () => {
    if (!activeContent?.id) return;
    await updateProgress(activeContent.id, true);
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

  // Fetch comments
  const fetchComments = async (contentId) => {
    try {
      setLoadingComments(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3000/api/auth/v1/content/${contentId}/comments`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
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
        `http://localhost:3000/api/auth/v1/content/${activeContent.id}/comments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: commentText.trim() })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }

      await fetchComments(activeContent.id);
      setCommentText('');
      toast.success('Comment posted successfully');
    } catch (err) {
      console.error('Error posting comment:', err);
      toast.error('Failed to post comment');
    }
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-96 bg-white shadow-lg overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">{courseData?.course?.title}</h2>
          <p className="text-sm text-gray-600 mt-2">Course Content</p>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Course Progress</span>
              <span className="text-blue-600">{Math.round(overallProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Module List */}
        <div className="p-4 space-y-2">
          {Object.entries(modules).map(([moduleName, lessons], moduleIndex) => (
            <div key={moduleIndex} className="bg-white rounded-lg shadow-sm">
              <button
                onClick={() => toggleModule(moduleName)}
                className="flex items-center justify-between w-full p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <BookOpenIcon className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <h3 className="font-medium text-gray-800">{moduleName}</h3>
                    <p className="text-sm text-gray-500">{lessons.length} lessons</p>
                  </div>
                </div>
                {expandedModules[moduleName] ? 
                  <ChevronUpIcon className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                }
              </button>

              {expandedModules[moduleName] && (
                <div className="ml-4 mr-2 mb-4 space-y-1">
                  {lessons.map(lesson => (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveContent(lesson)}
                      className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                        activeContent?.id === lesson.id 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative flex items-center w-full">
                        <div className="flex-shrink-0 mr-3">
                          {lesson.file_type === 'video' ? (
                            <PlayIcon className="w-5 h-5 text-blue-600" />
                          ) : (
                            <DocumentIcon className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div className="flex-grow text-left">
                          <p className="font-medium text-gray-800 line-clamp-1">{lesson.lesson_title}</p>
                          <div className="flex items-center text-sm text-gray-500 space-x-2">
                            <span>{lesson.file_type}</span>
                            {lesson.is_preview && <span className="text-green-600">• Preview</span>}
                          </div>
                        </div>
                        {progress[lesson.id]?.completed && (
                          <CheckCircleIcon className="w-5 h-5 text-green-500 ml-2" />
                        )}
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
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Content Header */}
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">{activeContent.lesson_title}</h1>
                    {activeContent.lesson_description && (
                      <p className="mt-2 text-gray-600">{activeContent.lesson_description}</p>
                    )}
                  </div>
                  <button
                    onClick={handleContentComplete}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                      progress[activeContent.id]?.completed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    disabled={progress[activeContent.id]?.completed}
                  >
                    {progress[activeContent.id]?.completed ? (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>Mark Complete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-6">
                {activeContent.file_type === 'video' ? (
                  <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
                    <iframe
                      src={activeContent.embed_url}
                      className="absolute top-0 left-0 w-full h-full"
                      title={activeContent.lesson_title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* PDF Viewer */}
                    <div className="relative w-full rounded-lg overflow-hidden bg-gray-50" style={{ height: '600px' }}>
                      <object
                        data={activeContent.file_url}
                        type="application/pdf"
                        className="absolute top-0 left-0 w-full h-full"
                      >
                        <p>PDF cannot be displayed. <a href={activeContent.file_url} target="_blank" rel="noopener noreferrer">Download PDF</a></p>
                      </object>
                    </div>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="border-t bg-gray-50 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Discussion</h3>
                <form onSubmit={handleCommentSubmit} className="mb-6">
                  <textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Add to the discussion"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                  />
                  <button
                    type="submit"
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    disabled={!commentText.trim()}
                  >
                    <ChatBubbleLeftIcon className="w-5 h-5" />
                    <span>Post Comment</span>
                  </button>
                </form>

                <div className="space-y-4">
                  {loadingComments ? (
                    <div className="text-center text-gray-500">Loading comments...</div>
                  ) : comments.length > 0 ? (
                    comments.map(comment => (
                      <div key={comment.id} className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserIcon className="w-6 h-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-800">
                                {comment.user?.full_name || comment.user?.email || "Anonymous"}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-1 text-gray-600">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500">No comments yet. Be the first to comment!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a lesson to begin learning</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseContent;