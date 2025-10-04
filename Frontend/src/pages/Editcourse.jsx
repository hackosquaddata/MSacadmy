import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function EditCourse() {
  const { courseId } = useParams(); // Changed from 'id' to 'courseId'
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/admin/courses/${courseId}`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          credentials: "include",
        });
        const data = await res.json();
        setCourse(data.course || data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourse();
  }, [courseId]); // Changed dependency from 'id' to 'courseId'

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      // Convert objectives string to array
      const objectivesStr = formData.get('objectives');
      const objectives = objectivesStr
        .split(',')
        .map(obj => obj.trim())
        .filter(obj => obj.length > 0);
      
      // Create a new FormData with properly formatted data
      const updatedFormData = new FormData();
      updatedFormData.append('title', formData.get('title'));
      updatedFormData.append('description', formData.get('description'));
      updatedFormData.append('price', formData.get('price'));
      updatedFormData.append('category', formData.get('category'));
      updatedFormData.append('prerequisites', formData.get('prerequisites'));
      updatedFormData.append('objectives', JSON.stringify(objectives));

      // Only append thumbnail if a new file is selected
      const thumbnailFile = formData.get('thumbnail');
      if (thumbnailFile.size > 0) {
        updatedFormData.append('thumbnail', thumbnailFile);
      }

      const res = await fetch(`http://localhost:3000/api/admin/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: updatedFormData,
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update course");
      }

      alert("Course updated successfully!");
      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      alert("Error updating course: " + err.message);
    }
  };

  if (!course) return <p>Loading...</p>;

  return (
    <form onSubmit={handleUpdate} className="space-y-4 max-w-md mx-auto mt-6 p-6 bg-white shadow-md rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input 
          name="title" 
          defaultValue={course.title} 
          placeholder="Course Title" 
          required 
          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea 
          name="description" 
          defaultValue={course.description} 
          placeholder="Course Description" 
          required 
          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
        <input 
          type="number" 
          name="price" 
          defaultValue={course.price} 
          placeholder="Course Price" 
          required 
          min="0"
          step="0.01"
          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <input 
          name="category" 
          defaultValue={course.category} 
          placeholder="Course Category" 
          required 
          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Prerequisites</label>
        <input 
          name="prerequisites" 
          defaultValue={course.prerequisites} 
          placeholder="Course Prerequisites" 
          required 
          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Objectives (comma-separated)</label>
        <textarea 
          name="objectives" 
          defaultValue={Array.isArray(course.objectives) ? course.objectives.join(', ') : course.objectives} 
          placeholder="Course Objectives (separate with commas)" 
          required 
          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
        <input 
          type="file" 
          name="thumbnail" 
          accept="image/*"
          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <button 
        type="submit" 
        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200"
      >
        Update Course
      </button>
    </form>
  );
}
