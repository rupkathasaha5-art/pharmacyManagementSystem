import { User } from "../models/User.model.js";
import bcrypt from "bcrypt";

export const seedSuperAdmin=async ()=>{
    try{
        await User.deleteMany({ role: 'SuperAdmin' });
        const user=await User.findOne({role:'SuperAdmin'});
       if(!user){
           //we need to create the super admin
           //the password of the super admin must be encrypted before being stored in the db 
           const salt=await bcrypt.genSalt(10);
           const hashedPassword=await bcrypt.hash("Rupkatha@PharmaStream",salt);

           //create the super admin
           const superAdmin=await User.create({
            name:'Rupkatha Saha',
            email:'rupkatha@pharmastream.com',
            password:hashedPassword,
            role:'SuperAdmin'
           })

           console.log("Super admin successfully seeded!")

       }else{
           
           console.log("Super Admin exists!!");
           return;
       }
    }catch(err){
        console.log("Error occurred while seeding",err.message)
    }
}

