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
      const res = await fetch(`http://localhost:3000/api/admin/courses/${courseId}`, { // Changed from 'id' to 'courseId'
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update course");

      alert("Course updated successfully!");
      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      alert("Error updating course: " + err.message);
    }
  };

  if (!course) return <p>Loading...</p>;

  return (
    <form onSubmit={handleUpdate} className="space-y-4 max-w-md mx-auto mt-6">
      <input name="title" defaultValue={course.title} placeholder="Title" required className="w-full p-2 border rounded"/>
      <textarea name="description" defaultValue={course.description} placeholder="Description" className="w-full p-2 border rounded"/>
      <input type="number" name="price" defaultValue={course.price} placeholder="Price" required className="w-full p-2 border rounded"/>
      <input name="category" defaultValue={course.category} placeholder="Category" className="w-full p-2 border rounded"/>
      <input name="prerequisites" defaultValue={course.prerequisites} placeholder="Prerequisites" className="w-full p-2 border rounded"/>
      <input type="file" name="thumbnail" className="w-full"/>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Update Course</button>
    </form>
  );
}
