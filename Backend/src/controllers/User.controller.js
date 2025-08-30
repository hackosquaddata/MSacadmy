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



export {signupUser}