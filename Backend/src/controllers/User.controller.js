import { connectSupabase } from "../db/supabaseClient.js";

const supabase = connectSupabase();

const signupUser = async (req, res) => {
  try {
    const { email, password, full_name, is_admin = false } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: "Missing email, password, or full_name" });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, is_admin },
      },
    });

    if (error) return res.status(400).json({ error: error.message });

    // Insert user into your "users" table with the same UID
    const { error: dbError } = await supabase.from("users").insert([
      {
        id: data.user.id,
        email,
        full_name,
        is_admin,
      },
    ]);

    if (dbError) return res.status(500).json({ error: dbError.message });

    return res.status(200).json({ message: "User signed up", user: data.user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) return res.status(400).json({ error: error?.message || "Login failed" });

    // Fetch user from "users" table
    const { data: userData, error: dbError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (dbError) return res.status(500).json({ error: dbError.message });

    return res.status(200).json({ message: "Login successful", user: userData, session: data.session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data: userData, error: dbError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (dbError) return res.status(500).json({ error: dbError.message });

    return res.status(200).json({ user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCourse = async (req,res)=>{

  try {
    const {error,data}=await supabase.from("courses").select("*");

    if(error) return res.status(400).json({error:error.message});

    res.status(200).json(data)
  }
   catch (error) {
    
    res.status(500).json({error:"server error"})
  }

}

export { signupUser, loginUser, getCurrentUser, getCourse };
