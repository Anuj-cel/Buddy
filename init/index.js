const express=require("express");
const app=express();
var dataDB=require("./data.js");
const mongoose = require('mongoose');


const MONGO_URL='mongodb://127.0.0.1:27017/pets';

async function main(){
   try {
    mongoose.connect(MONGO_URL);
    console.log("Db Connected!");
   }
   catch(err)
   {
    console.log(err);
   }

}

// main();

const Schema = mongoose.Schema;

const petsSchema = new Schema({
    name: { type: String, required: true },
    breed: { type: String, required: true },
    age: { type: String, required: true },
    description: { type: String, required: true },
    owner:{type:String,default:"anuj",required:true},
    photo_url: { type: String,
        default:"../public/images/dog1.jpg", },
    available: { type: Boolean, default: true },
});

const Pets=mongoose.model("Pets",petsSchema);

async function DataIn() {
    await Pets.deleteMany({});
    dataDB=dataDB.map((pet)=>({
        ...pet,
        owner:"anuj"

    }))
    await Pets.insertMany(dataDB);
    await mongoose.disconnect();
    console.log("Data initialized!");
}
// DataIn();

module.exports=Pets;