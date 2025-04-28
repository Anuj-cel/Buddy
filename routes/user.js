const express=require("express")
const userSchema = require("../validateUser.js");
const User = require("../userSchema.js");
const router=express.Router({mergeParams:true})
const validateUsers = async(req, res, next) => {
    try {
     await   userSchema.validate(req.body);
    }
    catch (error) {
        next(error);
    }
    next();
}
const asyncWrap=require("../middleware");

//sign up
router.get("/",  asyncWrap((req, res) => {
    res.render("./user/signup.ejs");
}));


//sign up
router.post("/", validateUsers, asyncWrap(async (req, res, next) => {
    console.log("This is req body ", req.body);
    const { password } = req.body;
    const newUser = new User({ ...req.body });
    const registeredUser = await User.register(newUser, password);
    req.flash('success', 'Signed up successfully!');
    res.redirect("/login");
}));

module.exports=router;