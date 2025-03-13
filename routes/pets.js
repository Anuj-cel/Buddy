const express=require('express');
const app=express();
const Pets = require("../init/index.js");
const isLogged=require("../middleware.js")
const router = express.Router({ mergeParams: true });
const asyncWrap = require("../middleware.js");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//show
router.use("/show/:id", asyncWrap(async (req, res, next) => {
    console.log("I am here in show")
    let id = req.params.id;
    let id2=req.query.petId;
    let pet={};
    if(id)
     pet = await Pets.findById(id);
    else 
    pet=await Pets.findById(id2);
    res.render("../pets/show.ejs", { pet });
}));

//index 
router.use("/",asyncWrap(async (req, res, next) => {
    console.log("I am at pets.ejs");
    const allPets = await Pets.find({});
    // console.log("This is allPets for index ",allPets);
    res.render("./pets/index.ejs", { allPets });
}))
module.exports = router;