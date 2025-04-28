const express=require('express');
const app=express();
const Pets = require("../init/index.js");
const User = require("../userSchema.js");
const Adoption = require("../adoptionSchema.js");
const sendMail = require("../utils/nodemailer.js");
const petsSchema = require("../validatePets.js");
const router = express.Router({ mergeParams: true });
const asyncWrap = require("../middleware.js");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const validatePets = async(req, res, next) => {
    try {
       await petsSchema.validate(req.body);
    }
    catch (error) {
        next(error);
    }
    next();
}

const isLoggedIn = (req, res, next) => {
    console.log("Authenticated:", req.isAuthenticated()); // Debugging
    if (!req.isAuthenticated()) {
        req.flash("error", "Login required");
        return res.redirect("/login");
    }
    else {
       
    }
    next();
};

const validateUsers = async(req, res, next) => {
    try {
     await   userSchema.validate(req.body);
    }
    catch (error) {
        next(error);
    }
    next();
}

router.get("/adopt/:id", isLoggedIn, asyncWrap((req, res, next) => {
    let { id } = req.params;
    res.render("./pets/adopt.ejs", { id });
}));

router.post("/adopt/:id", asyncWrap(async (req, res, next) => {
    let id = req.params.id;
    const newAdoption = new Adoption(req.body);
    newAdoption.username = req.user.username;
    newAdoption.email = req.user.email;

    let pet = await Pets.findById(id);
    let petName = pet.name;
    let petBreed = pet.breed;
    let petAge = pet.age;
    let petId = id;

    await newAdoption.save();
    console.log("This is newAdoption ", newAdoption);
    const { Name, address, phoneNumber, username, email } = newAdoption;


    try {
        // Customize the email body using form data
        const emailContent = `
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f9f9f9;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: auto;
                background: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
            }
            h2 {
                color: #4CAF50;
                text-align: center;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }
            th, td {
                padding: 10px;
                border: 1px solid #ddd;
                text-align: left;
            }
            th {
                background-color: #f4f4f4;
            }
            .btn {
                display: block;
                width: fit-content;
                margin: 20px auto;
                padding: 10px 15px;
                background: #4CAF50;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                text-align: center;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #777;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>🐾 Pet Adoption Request</h2>
            <p>Hello Admin,</p>
            <p>A new pet adoption request has been submitted. Here are the details:</p>

            <h3>👤 User Details</h3>
            <table>
                <tr><th>Name</th><td>${Name}</td></tr>
                <tr><th>Username</th><td>${username}</td></tr>
                <tr><th>Email</th><td>${email}</td></tr>
                <tr><th>Phone Number</th><td>${phoneNumber}</td></tr>
                <tr><th>Address</th><td>${address}</td></tr>
            </table>

            <h3>🐶 Pet Details</h3>
            <table>
                <tr><th>Pet Name</th><td>${petName}</td></tr>
                <tr><th>Breed</th><td>${petBreed}</td></tr>
                <tr><th>Age</th><td>${petAge} years</td></tr>
            </table>

            <p>Please review the adoption request and take necessary actions.</p>
            <a href="mailto:${email}" class="btn">Reply to User</a>

            <p class="footer">This is an automated message. Please do not reply.</p>
        </div>
    </body>
    </html>
`;


        await sendMail({
            to: "ajkumarmahto009@gmail.com", // Recipient's email
            subject: "Thanks for Contacting Us!",
            html: emailContent, // HTML email body
        });
        console.log("Email sent successfully");
        req.flash("success", "Thanks for adoption");
        return res.redirect("/pets");
    } catch (error) {
        console.log("Error during email sending ", error);
        req.flash("error", "Failed to send email.");
        return res.redirect("/pets");
    };

}));

//new form
router.get("/new", isLoggedIn, asyncWrap((req, res, next) => {
    res.render("./pets/new.ejs");
}));


//new pet 
router.post("/new", validatePets, asyncWrap(async (req, res, next) => {
    let newPet = new Pets(req.body);
 
    await newPet.save();
    req.flash('success', 'New pet added!');
    res.redirect("/pets");
}));

//show
router.get("/show/:id", asyncWrap(async (req, res, next) => {
    console.log("I am here in show")
    let id = req.params.id;
    let id2=req.query.petId;
    let pet={};
    if(id)
     pet = await Pets.findById(id);
    else 
    pet=await Pets.findById(id2);
    res.render("./pets/show.ejs", { pet });
}));

//edit route
router.get("/edit/:id", isLoggedIn, asyncWrap(async (req, res, next) => {
    let id = req.params.id;
    let pet = await Pets.findById(id);
    console.log(req.user.username, "  ", pet.owner);
    if (req.user.username === pet.owner)
        res.render("./pets/edit.ejs", { pet });
    else {
        req.flash('error', 'Your not the owner!');
        res.redirect(`/pets/${id}`);
    }
}));

//update route
router.post("/edit/:id", isLoggedIn,validatePets, asyncWrap(async (req, res, next) => {
    let id = req.params.id;
    let pet = await Pets.findById(id);
    pet.name = req.body.name;
    pet.breed = req.body.breed;
    pet.age = req.body.age;
    pet.description = req.body.description;
    pet.photo_url = req.body.photo_url;
   
    await pet.save();
    req.flash('success', 'Pet updated!');
    res.redirect(`/pets/show/${id}`);
}));

// delete route
router.get("/delete/:id", isLoggedIn, asyncWrap(async (req, res, next) => {
    let id = req.params.id;
    let pet = await Pets.findByIdAndDelete(id);
    req.flash('success', 'Pet deleted!');
    res.redirect(`/pets`);
}));

//  add to cart
router.get('/wishlist/add/:petId', isLoggedIn, asyncWrap(async (req, res) => {
    const { petId } = req.params;
    const pet = await Pets.findById(petId);
    const userId = res.locals.user._id;  // Get logged-in user ID
    try {
        const user = await User.findById(userId); // Fetch user from DB
        if (!user.wishlist.includes(petId)) {
            user.wishlist.push(petId); // Add pet ID to user's cart
            await user.save(); // Save changes in DB
        }
        req.flash('success', 'Pet added to wishlist!');
        return res.redirect(`/pets/?id=${petId}`);

    } catch (error) {
        req.flash("error", "Error adding to cart");
        res.redirect(`/pets?petId=${petId}`);
    }
}));

//wishlist remove
router.post("/wishlist/remove/:petId",isLoggedIn,asyncWrap(async(req,res)=>{
    const { petId } = req.params;
   
    const userId = res.locals.user._id;  // Get logged-in user ID
    try {
         
        await User.findByIdAndUpdate(userId, { $pull: { wishlist: petId } }, { new: true });
        req.flash('success', 'Pet removed from wishlist!');
        return res.redirect("/wishlist");

    } catch (error) {
        req.flash("error", "Error adding to cart");
        res.redirect(`/wishlist`);
    }
}))


//index 
router.get("/",asyncWrap(async (req, res, next) => {
    console.log("I am at pets.ejs");
    const allPets = await Pets.find({});
    res.render("./pets/index.ejs", { allPets });
}))
module.exports = router;