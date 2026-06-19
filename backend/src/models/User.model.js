import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema=new Schema(
    {
        name:{
            type:String,
            required : true,
            unique: true,
            lowercase:true,
            trim:true,
            index:true
        },
        org: {
            //type: Schema.Types.ObjectId,
            //ref:'Org',
            type:String,
            required: true
        },
        email:{
            type:String,
            required : true,
            unique: true,
            lowercase:true,
            trim:true
        },
        role: {
            type: String,
            required : true,
            enum: ["Procurement", "Admin", "Super Admin"],
            default: "Procurement",
        },
        password:{
            type:String,
            required:[true,"Password is required"]
        },
        refreshToken:{
            type:String
        }

},{timestamps:true})

userSchema.pre("save",async function(){
    if(this.isModified("password")){// If the password was changed or is new
        try{
            this.password=await bcrypt.hash(this.password,10)
            
        }catch(error){
            throw error;
            // If bcrypt fails, we pass the error to Mongoose
        }
    }
})

/* why should i use a normal function and not arrow function inside pre?

Arrow functions do not have their own this context. They "inherit" this from the parent scope where they were defined.
In a Mongoose pre("save") hook, Mongoose specifically tries to bind the Document (the user being saved) to the function's
this context so you can access properties like this.password or methods like this.isModified().

Normal Function: this refers to the User Document currently being saved. (Correct )
Arrow Function: this refers to the global object or an empty object {} (depending on where the file is). (Broken )
*/


//designing a custom method
userSchema.methods.isPasswordCorrect=async function(password){
    // 'password' is the plain text from the login form
    // 'this.password' is the hashed string from the database
    return await bcrypt.compare(password,this.password);//a true or false is returned
}

userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            name:this.name,
            role:this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

//export const User=mongoose.model("User",userSchema)
export const User = mongoose.models.User || mongoose.model("User", userSchema);


/* 
Think of the relationship between an Access Token and a Refresh Token like the difference between a Keycard for a hotel room and the ID/Credit Card you showed at the front desk to get it.
1. The Access Token (The "Keycard")
The Access Token is a short-lived credential used to access protected resources (like your profile, your cart, or private settings).
Lifespan: Very short (typically 15 minutes to 1 hour).
Usage: Sent with every single request in the header (usually as a Bearer token).
Security: Because it travels over the network constantly, it is higher risk. If a hacker steals it, they can only use it for a few minutes until it expires.
Storage: Usually kept in browser memory or a non-persistent cookie.

2. The Refresh Token (The "ID at the Front Desk")
The Refresh Token is a long-lived credential used specifically to get a new Access Token once the old one expires.
Lifespan: Long (typically 7 days to 30 days).
Usage: Only sent once to a specific /refresh endpoint when the Access Token dies. It is never sent with regular API requests.
Security: It is stored very securely (ideally in an httpOnly cookie so JavaScript can't touch it). If an Access Token expires, the Refresh Token "refreshes" the session without making the user type their password again.
Revocation: Unlike Access Tokens, Refresh Tokens are usually stored in your database. This allows you to "log out" a user remotely by deleting their Refresh Token, effectively killing their ability to get new access
*/