import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateCourse() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // ✅ For backend error messages
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    duration: '',
    thumbnail: null,
    prerequisites: '',
    objectives: ['']
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(""); // Clear previous errors

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("title", courseData.title);
      formData.append("description", courseData.description);
      formData.append("price", courseData.price);
      formData.append("category", courseData.category);
      formData.append("duration", courseData.duration);
      formData.append("prerequisites", courseData.prerequisites);
      formData.append("objectives", JSON.stringify(courseData.objectives));

      if (courseData.thumbnail) {
        formData.append("thumbnail", courseData.thumbnail);
      }

      const response = await fetch("http://localhost:3000/api/admin/coursecreation", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // ✅ required for auth
        },
        body: formData,
      });

      const data = await response.json();
      console.log("Course create response:", data);

      if (response.ok) {
        navigate("/admin/dashboard");
      } else {
        // Display backend error message
        setError(data.error || data.message || "Failed to create course");
      }

    } catch (err) {
      console.error("Error creating course:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addObjective = () => {
    setCourseData({
      ...courseData,
      objectives: [...courseData.objectives, '']
    });
  };

  const handleObjectiveChange = (index, value) => {
    const newObjectives = [...courseData.objectives];
    newObjectives[index] = value;
    setCourseData({ ...courseData, objectives: newObjectives });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Create New Course</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Course Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Course Title</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={courseData.title}
                  onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  required
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={courseData.description}
                  onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                />
              </div>

              {/* Price and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                  <input
                    type="number"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={courseData.price}
                    onChange={(e) => setCourseData({ ...courseData, price: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration (hours)</label>
                  <input
                    type="number"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    value={courseData.duration}
                    onChange={(e) => setCourseData({ ...courseData, duration: e.target.value })}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={courseData.category}
                  onChange={(e) => setCourseData({ ...courseData, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  <option value="web-development">Web Development</option>
                  <option value="mobile-development">Mobile Development</option>
                  <option value="data-science">Data Science</option>
                  <option value="machine-learning">Machine Learning</option>
                </select>
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Thumbnail</label>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full"
                  onChange={(e) => setCourseData({ ...courseData, thumbnail: e.target.files[0] })}
                />
              </div>

              {/* Prerequisites */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Prerequisites</label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={courseData.prerequisites}
                  onChange={(e) => setCourseData({ ...courseData, prerequisites: e.target.value })}
                />
              </div>

              {/* Learning Objectives */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Learning Objectives</label>
                {courseData.objectives.map((objective, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      className="flex-1 rounded-md border-gray-300 shadow-sm"
                      value={objective}
                      onChange={(e) => handleObjectiveChange(index, e.target.value)}
                      placeholder="Enter an objective"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addObjective}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  + Add Another Objective
                </button>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
