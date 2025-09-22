import connectSupabase from "../db/supabaseClient.js";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";

const supabase = connectSupabase();
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Create admin client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔹 Create Course
const createCourse = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized - No token" });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ message: "Unauthorized - Invalid token" });

    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userError || !userRecord || !userRecord.is_admin) {
      return res.status(403).json({ message: "Forbidden - Admins only" });
    }

    const { title, description, price, category, prerequisites, objectives } = req.body;
    const thumbnailFile = req.file;
    if (!thumbnailFile) return res.status(400).json({ message: "Thumbnail required" });
    if (!title?.trim()) return res.status(400).json({ message: "Title required" });

    const numericPrice = Number(price);
    if (isNaN(numericPrice)) return res.status(400).json({ message: "Price must be a number" });

    const fileExt = thumbnailFile.originalname.split(".").pop();
    const fileName = `thumbnails/${Date.now()}.${fileExt}`;

    // Upload thumbnail
    const { error: uploadError } = await supabaseAdmin.storage
      .from("course-thumbnails")
      .upload(fileName, thumbnailFile.buffer, { contentType: thumbnailFile.mimetype });

    if (uploadError) return res.status(500).json({ error: uploadError.message });

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("course-thumbnails")
      .getPublicUrl(fileName);

    const thumbnailUrl = publicUrlData.publicUrl;

    let objectivesArray = [];
    if (objectives && typeof objectives === "string") {
      objectivesArray = JSON.parse(objectives);
    }

    // Insert into DB
    const { data, error } = await supabaseAdmin
      .from("courses")
      .insert([{
        title,
        description,
        price: numericPrice,
        category,
        prerequisites,
        objectives: objectivesArray,
        thumbnail: thumbnailUrl,
        created_by: user.id,
        status: "active",
        created_at: new Date().toISOString(),
      }])
      .select();

    if (error) {
      console.error("Database insert error:", error);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: "Course created successfully", course: data[0] });
  } catch (err) {
    console.error("Course creation error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 Edit Course
const editCourse = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized - No token" });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ message: "Unauthorized - Invalid token" });

    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userError || !userRecord || !userRecord.is_admin) {
      return res.status(403).json({ message: "Forbidden - Admins only" });
    }

    const { id } = req.params; // <-- matches /courses/:id
    const { title, description, price, category, prerequisites, objectives, status } = req.body;

    let updatedFields = { title, description, category, prerequisites, status };

    if (price) {
      const numericPrice = Number(price);
      if (isNaN(numericPrice)) return res.status(400).json({ message: "Price must be a number" });
      updatedFields.price = numericPrice;
    }

    if (objectives) {
      updatedFields.objectives = Array.isArray(objectives)
        ? objectives
        : JSON.parse(objectives);
    }

    if (req.file) {
      const fileExt = req.file.originalname.split(".").pop();
      const fileName = `thumbnails/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("course-thumbnails")
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

      if (uploadError) return res.status(500).json({ error: uploadError.message });

      const { data: publicUrlData } = supabaseAdmin.storage
        .from("course-thumbnails")
        .getPublicUrl(fileName);

      updatedFields.thumbnail = publicUrlData.publicUrl;
    }

    const { data, error } = await supabaseAdmin
      .from("courses")
      .update(updatedFields)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Database update error:", error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: "Course updated successfully", course: data[0] });
  } catch (err) {
    console.error("Course update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 Delete Course
const deleteCourse = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized - No token" });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ message: "Unauthorized - Invalid token" });

    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userError || !userRecord || !userRecord.is_admin) {
      return res.status(403).json({ message: "Forbidden - Admins only" });
    }

    const { id } = req.params; // <-- matches /courses/:id

    const { error } = await supabaseAdmin
      .from("courses")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Database delete error:", error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error("Course delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 Get all courses
const getCourses = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from("courses").select("*");

    if (error) {
      console.error("Error fetching courses:", error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Server error fetching courses:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔹 Get single course by ID
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params; // match /courses/:id
    const { data, error } = await supabaseAdmin
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return res.status(404).json({ error: error.message });

    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching course:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { createCourse, editCourse, deleteCourse, getCourses, getCourseById };
