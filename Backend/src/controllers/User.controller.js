import connectSupabase from "../db/supabaseClient.js"

const supabase = connectSupabase()

 const signupUser =async(req,res)=>{

     
     try {
         
         const {email,password}=req.body;

         if(!email || !password){

            return res.status(400).json({error:"Email and password is missing"});
         }

        const {data,error}=await supabase.auth.signUp({
            email,
            password
        })

        if(error){

            return res.status(400).json({error:error.message})
        }

        return res.status(200).json({
            message:"user signed up successfully",
            user:data.user

        })

    } catch (error) {
        
        res.status(500).json({error:"server error"})
    }


}



export {signupUser}