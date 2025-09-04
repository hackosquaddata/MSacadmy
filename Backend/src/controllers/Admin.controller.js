import connectSupabase from "../db/supabaseClient.js";
import { createClient } from '@supabase/supabase-js';
import multer from "multer";

const supabase = connectSupabase();
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Create admin client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // This bypasses RLS
);

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

    // Use admin client for storage upload
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

    // Use admin client for database insert (bypasses RLS)
    const { data, error } = await supabaseAdmin.from("courses").insert([
      {
        title,
        description,
        price: numericPrice,
        category,
        prerequisites,
        objectives: objectivesArray,
        thumbnail: thumbnailUrl,
        created_by: user.id,
        status: "active",
        created_at: new Date().toISOString(), // Explicitly set timestamp
      },
    ]).select();

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




export { createCourse  };