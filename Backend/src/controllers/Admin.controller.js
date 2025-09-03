import connectSupabase from "../db/supabaseClient.js";
import multer from "multer";

const supabase = connectSupabase();

const storage = multer.memoryStorage();
export const upload = multer({ storage });

const createCourse = async (req, res) => {
  try {
    // --- AUTHORIZATION REMOVED FOR TESTING ---
    /*
    // Get the authenticated user first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ message: "Unauthorized - Please login" });
    }
    */
    // Placeholder user ID for testing purposes.
    const DUMMY_USER_ID = "00000000-0000-0000-0000-000000000000";
    // --- END OF TESTING CHANGES ---

    const { title, description, price, category, prerequisites, objectives } = req.body;
    const thumbnailFile = req.file;

    // Detailed logging of received data
    console.log('Received data:', {
      title: title,
      description: description,
      price: price,
      category: category,
      prerequisites: prerequisites,
      objectives: objectives,
      created_by: DUMMY_USER_ID, // Using dummy ID
      hasFile: !!thumbnailFile
    });

    // Individual field validation with specific messages
    if (!thumbnailFile) {
      return res.status(400).json({
        message: "Thumbnail file is required"
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ message: "Description is required" });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({ message: "Category is required" });
    }

    if (!prerequisites || !prerequisites.trim()) {
      return res.status(400).json({ message: "Prerequisites are required" });
    }

    if (!objectives) {
      return res.status(400).json({ message: "Objectives are required" });
    }

    if (!price) {
      return res.status(400).json({ message: "Price is required" });
    }

    // Validate price is a number
    const numericPrice = Number(price);
    if (isNaN(numericPrice)) {
      return res.status(400).json({
        message: "Price must be a valid number"
      });
    }

    // ✅ Upload file to Supabase
    const fileExt = thumbnailFile.originalname.split(".").pop();
    const fileName = `thumbnails/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("course-thumbnails")
      .upload(fileName, thumbnailFile.buffer, {
        contentType: thumbnailFile.mimetype,
      });

    if (uploadError) {
      return res.status(500).json({ error: uploadError.message });
    }

    const { data: publicUrlData } = supabase.storage
      .from("course-thumbnails")
      .getPublicUrl(fileName);

    // The public URL of the uploaded thumbnail
    const thumbnailUrl = publicUrlData.publicUrl;

    // ✅ Parse objectives
    let objectivesArray = [];
    if (objectives && typeof objectives === "string") {
      try {
        objectivesArray = JSON.parse(objectives);
      } catch {
        return res.status(400).json({
          message: "Objectives must be a valid JSON array string",
        });
      }
    }

    // ✅ Insert into DB with the new thumbnail URL
    const { data, error } = await supabase.from("courses").insert([
      {
        title,
        description,
        price: Number(price),
        category,
        prerequisites,
        objectives: objectivesArray,
        thumbnail: thumbnailUrl,
        created_by: DUMMY_USER_ID, // Using dummy ID
        status: 'active'
      },
    ]).select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: "Course created successfully",
      course: data[0],
    });

  } catch (error) {
    console.log("Course creation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { createCourse };