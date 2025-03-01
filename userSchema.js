const mongoose = require('mongoose');
const passportMongooseLocal=require("passport-local-mongoose");

const Schema = mongoose.Schema;
const userSchema = new Schema({
    username: { type: String, required: true,unique:true },
    firstName:{type:String,required:true},
    lastName:{type:String,default:""},
    email: { type: String, required: true,unique:true },
    googleId: {type:String,
        default: '' ,
        sparse:true
    }, 
    photo: {
        type: String, // URL for the profile picture
    },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pets' }],
    // Add this for Google authentication
});
userSchema.plugin(passportMongooseLocal,{usernameField:"username"});
const User=mongoose.model("User",userSchema);
module.exports=User;
