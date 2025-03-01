const mongoose = require('mongoose');
const passportMongooseLocal=require("passport-local-mongoose");

const Schema = mongoose.Schema;
const adoptionSchema = new Schema({
  Name: { type: String, required: [true, "Name is required."] },
    username:{type:String,required:true,unique:false},
    email: { type: String, required: true,unique:false },
    address:{type:String,required:true,unique:false},
    phoneNumber: {
        type: String,
        unique:false,
        required: true,
        match: /^[0-9]{10}$/, // Ensures the phone number is exactly 10 digits
        validate: {
          validator: function (v) {
            return /^[6-9][0-9]{9}$/.test(v); // Ensures the first digit is between 6 and 9
          },
          message: (props) => `${props.value} is not a valid phone number!`,
        }},
        pet: { type: Schema.Types.ObjectId, ref: 'Pets' }
});
adoptionSchema.plugin(passportMongooseLocal,{usernameField:"username"});
const Adoption=mongoose.model("Adoption",adoptionSchema);
module.exports=Adoption;