import connectSupabase from "../db/supabaseClient.js"

const supabase = connectSupabase()

 const signupUser =async(req,res)=>{

     
     try {
         
         const {email,password,full_name}=req.body;

         if(!email || !password || !full_name){

            return res.status(400).json({error:"Email or password or full_name is missing"});
         }

        const {data,error}=await supabase.auth.signUp({
            email,
            password,
            full_name
        })

        if(error){
            
            return res.status(400).json({error:error.message})
        }
        // inserting into the tables 

        const {error:dbError}=await supabase.from("users").insert([{
            id:data.user.id,
            email:data.user.email,
            full_name:full_name,
            role:"student"
        }])
        
        if(dbError) return res.status(500).json({error:dbError.message})
            

        return res.status(200).json({
            message:"user signed up successfully",
            user:data.user

        })

    } catch (error) {
        
        res.status(500).json({error:"server error"})
    }


}

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Supabase Auth sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Response contains session + access token (JWT)
    res.status(200).json({
      message: "Login successful",
      user: data.user,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCurrentUser = async (req, res) => {
    try {
        // Get the token from Authorization header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        // Get user data from Supabase using the token
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error) {
            return res.status(401).json({ error: error.message });
        }

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Get additional user data from your users table
        const { data: userData, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (dbError) {
            return res.status(500).json({ error: dbError.message });
        }

        return res.status(200).json({ user: userData });

    } catch (error) {
        console.error("Error in getCurrentUser:", error);
        res.status(500).json({ error: "Server error" });
    }
};

export { signupUser, loginUser, getCurrentUser };