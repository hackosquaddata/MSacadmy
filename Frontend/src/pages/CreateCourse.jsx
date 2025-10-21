import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { apiUrl } from "../lib/api";

export default function CreateCourse() {
  const navigate = useNavigate();
  const { courseId } = useParams(); // For edit mode
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    duration: "",
    thumbnail: null,
    thumbnailUrl: "",
    prerequisites: "",
    objectives: [""],
    instructors: [],
    certification_preview: null,
    certificationPreviewUrl: "",
  });

  // Fetch course data in edit mode
  useEffect(() => {
    if (!courseId) return;
    const token = localStorage.getItem("token");
    fetch(apiUrl(`/api/admin/courses/${courseId}`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setCourseData({
          ...data,
          objectives: data.objectives || [""],
          instructors: data.instructors || [],
          thumbnail: null,
          thumbnailUrl: data.thumbnail || "",
          certification_preview: null,
          certificationPreviewUrl: data.certification_preview || "",
        });
      })
      .catch((err) => console.error("Error fetching course:", err));
  }, [courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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
      if (courseData.instructors?.length) {
        formData.append("instructors", JSON.stringify(courseData.instructors));
      }

      if (courseData.thumbnail) {
        formData.append("thumbnail", courseData.thumbnail);
      }
      if (courseData.certification_preview) {
        formData.append("certification_preview", courseData.certification_preview);
      }

      const url = courseId
        ? apiUrl(`/api/admin/courses/${courseId}`)
        : apiUrl('/api/admin/coursecreation');

      const method = courseId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/admin/dashboard");
      } else {
        const detail = typeof data?.details === 'string' ? `: ${data.details}` : '';
        setError((data.error || data.message || "Failed to save course") + detail);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleObjectiveChange = (index, value) => {
    const newObjectives = [...courseData.objectives];
    newObjectives[index] = value;
    setCourseData({ ...courseData, objectives: newObjectives });
  };

  const addObjective = () => {
    setCourseData({
      ...courseData,
      objectives: [...courseData.objectives, ""],
    });
  };

  const handleThumbnailChange = (file) => {
    setCourseData({
      ...courseData,
      thumbnail: file,
      thumbnailUrl: URL.createObjectURL(file),
    });
  };

  const handleCertPreviewChange = (file) => {
    setCourseData({
      ...courseData,
      certification_preview: file,
      certificationPreviewUrl: URL.createObjectURL(file),
    });
  };

  const loadSampleData = () => {
    setCourseData((prev) => ({
      ...prev,
      title: "Offensive Red Team Ops",
      description: "Hands-on red teaming course covering recon, initial access, privilege escalation, and lateral movement with real-world labs.",
      price: "1499",
      category: "red teamer",
      duration: "16",
      prerequisites: "Basic networking, Linux, and scripting",
      objectives: [
        "Plan and execute red team engagements",
        "Bypass EDR and persistence techniques",
        "Privilege escalation on Windows/Linux",
      ],
      instructors: ["Shaikh Minhaz"],
    }));
  };

  return (
    <AdminLayout title={courseId ? "Edit Course" : "Create Course"}>
      <div className="max-w-3xl mx-auto">
        {error && (
          <div className="mb-4 p-3 rounded border border-red-400/30 bg-red-500/10 text-red-200">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 border border-white/10 rounded-2xl p-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-400">Course Title</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md bg-black/30 border border-white/10 text-slate-100 placeholder:text-slate-500 p-2"
              value={courseData.title}
              onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
              placeholder="e.g., Red Teaming Fundamentals"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400">Description</label>
            <textarea
              required
              rows={4}
              className="mt-1 block w-full rounded-md bg-black/30 border border-white/10 text-slate-100 placeholder:text-slate-500 p-2"
              value={courseData.description}
              onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
              placeholder="Write a concise pitch for this course"
            />
          </div>

          {/* Price & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400">Price (₹)</label>
              <input
                type="number"
                required
                className="mt-1 block w-full rounded-md bg-black/30 border border-white/10 text-slate-100 p-2"
                value={courseData.price}
                onChange={(e) => setCourseData({ ...courseData, price: e.target.value })}
                placeholder="1499"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">Duration (hours)</label>
              <input
                type="number"
                required
                className="mt-1 block w-full rounded-md bg-black/30 border border-white/10 text-slate-100 p-2"
                value={courseData.duration}
                onChange={(e) => setCourseData({ ...courseData, duration: e.target.value })}
                placeholder="12"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-400">Category</label>
            <select
              required
              className="mt-1 block w-full rounded-md bg-black/30 border border-white/10 text-slate-100 p-2 capitalize"
              value={courseData.category}
              onChange={(e) => setCourseData({ ...courseData, category: e.target.value })}
            >
              <option value="">Select category</option>
              <option value="red teamer">Red Teamer</option>
              <option value="blue teamer">Blue Teamer</option>
              <option value="forensics">Forensics</option>
            </select>
          </div>

          {/* Instructors */}
          <div>
            <label className="block text-xs font-medium text-slate-400">Instructors</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {[
                "Shaikh Minhaz",
                "shaikh abubakar",
              ].map((name) => {
                const checked = courseData.instructors.includes(name);
                return (
                  <label key={name} className={`flex items-center gap-2 rounded-md border border-white/10 bg-black/30 p-2 text-sm ${checked ? 'ring-1 ring-emerald-400/40' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(courseData.instructors);
                        if (e.target.checked) next.add(name); else next.delete(name);
                        setCourseData({ ...courseData, instructors: Array.from(next) });
                      }}
                    />
                    <span className="capitalize">{name}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Pick one or more instructors.</p>
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-xs font-medium text-slate-400">Thumbnail</label>
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-slate-200"
              onChange={(e) => handleThumbnailChange(e.target.files[0])}
            />
            {courseData.thumbnailUrl && (
              <img
                src={courseData.thumbnailUrl}
                alt="Thumbnail preview"
                className="mt-2 h-32 object-cover rounded border border-white/10"
              />
            )}
          </div>

          {/* Certification Preview */}
          <div>
            <label className="block text-xs font-medium text-slate-400">Certification Preview</label>
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-slate-200"
              onChange={(e) => handleCertPreviewChange(e.target.files[0])}
            />
            {(courseData.certificationPreviewUrl) && (
              <img
                src={courseData.certificationPreviewUrl}
                alt="Certification preview"
                className="mt-2 h-32 object-cover rounded border border-white/10"
              />
            )}
            {!courseData.certificationPreviewUrl && courseData.certification_preview && (
              <p className="text-xs text-slate-400 mt-1">File selected: {courseData.certification_preview.name}</p>
            )}
          </div>

          {/* Prerequisites */}
          <div>
            <label className="block text-xs font-medium text-slate-400">Prerequisites</label>
            <textarea
              className="mt-1 block w-full rounded-md bg-black/30 border border-white/10 text-slate-100 placeholder:text-slate-500 p-2"
              value={courseData.prerequisites}
              onChange={(e) => setCourseData({ ...courseData, prerequisites: e.target.value })}
              placeholder="e.g., Basic networking, Linux fundamentals"
            />
          </div>

          {/* Objectives */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Learning Objectives</label>
            {courseData.objectives.map((obj, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="text"
                  className="flex-1 rounded-md bg-black/30 border border-white/10 text-slate-100 p-2 placeholder:text-slate-500"
                  value={obj}
                  onChange={(e) => handleObjectiveChange(index, e.target.value)}
                  placeholder="Enter an objective"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addObjective}
              className="mt-2 text-emerald-300 hover:text-emerald-200"
            >
              + Add another objective
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={loadSampleData}
              className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 text-sm"
            >
              Load sample data
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/dashboard")}
              className="px-4 py-2 rounded-md bg-black/30 border border-white/10 text-slate-200 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-md bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/25 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (courseId ? "Updating..." : "Creating...") : courseId ? "Update Course" : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
