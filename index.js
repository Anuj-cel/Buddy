require('dotenv').config();

const express = require("express");
const app = express();
const path = require("path");
const flash = require('connect-flash');
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session")
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const MongoStore = require('connect-mongo');
const Pets = require("./init/index.js");
const User = require("./userSchema.js");
const Adoption = require("./adoptionSchema.js");
const asyncWrap = require("./middleware.js");
const petsSchema = require("./validatePets.js");
const userSchema = require("./validateUser.js");
const LocalStrategy = require('passport-local');// for local passport
const sendMail = require("./utils/nodemailer.js");
const dbUrl=process.env.dbUrl;
const SECRET=process.env.SECRET;
const GOOGLE_CLIENT_ID=process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET=process.env.GOOGLE_CLIENT_SECRET;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

async function main() {
    try {
        mongoose.connect(dbUrl);
        console.log("Db Connected!");
    }
    catch (err) {
        console.log(err);
    }
}
main();

const validatePets = (req, res, next) => {
    try {
        petsSchema.validate(req.body);
    }
    catch (error) {
        next(error);
    }
    next();
}
const validateUsers = (req, res, next) => {
    try {
        userSchema.validate(req.body);
    }
    catch (error) {
        next(error);
    }
    next();
}

const sessionOptions = {
    secret: SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: (
        { //-->cookie not Cookie
            maxAge: 7 * 24 * 60 * 60 * 1000, //--> not with Date.now()
            httpOnly: true,
        }),
        store: MongoStore.create({
            mongoUrl: dbUrl,
            touchAfter: 24 * 3600 
          })
};



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  

passport.serializeUser((user, done) => {
    
    done(null, user.id); // Store user ID in session
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id); // Retrieve user from DB
        // console.log("This is deserilizer user",user)
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});
let userProfileImg = "";

app.use((req, res, next) => {
    res.locals.user = { username: "A" };// its was giving user is not defined in navbar so dummy data
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    if (req.isAuthenticated() == true) {
        res.locals.checkLogin = true;
        res.locals.user = req.user;

        res.locals.userProfileImg = userProfileImg;

    }
    else res.locals.checkLogin = false;
    next();
});

passport.use(new LocalStrategy(User.authenticate()));

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8080/auth/google/callback",
    state: true
}, (async (accessToken, refreshToken, profile, done) => {//TypeError: done is not a function
    // mistake i was using wrapAsync due to which my done was replaced by next function 
    userProfileImg = profile.photos[0].value;

    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = new User({
                username: profile.displayName,
                email: profile.emails[0].value,
                firstName: profile.name.givenName,
                lastName: profile.name.familyName || "",
                googleId: profile.id
            });
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
})));

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
    (req, res) => {
        req.flash('success', 'Logged in with Google successfully!');
        res.redirect('/pets');
    }
);

// passport.serializeUser(User.serializeUser());// serialize in one session--> saving users data in sessions 
// //Serialization: After a user logs in (via either Local or Google strategy), Passport saves their unique identifier (e.g., user.id) in the session:
// passport.deserializeUser(User.deserializeUser());// retrieving users data from sessions

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

//index 
app.get("/pets", asyncWrap(async (req, res, next) => {
    const allPets = await Pets.find({});
    // console.log("This is allPets for index ",allPets);
    res.render("./pets/index.ejs", { allPets });
}));

//profile
app.get("/profile", isLoggedIn,asyncWrap(async (req, res, next) => {
    let userId=res.locals.user._id;
    let data=await User.findById(userId).populate("wishlist");
    const wishlist=data.wishlist;
    res.render("./user/profile.ejs", { wishlist });
}));



//adopt form
app.get("/pets/adopt/:id", isLoggedIn, asyncWrap((req, res, next) => {
    let { id } = req.params;

    res.render("./pets/adopt.ejs", { id });
}));

//adopt 
app.post("/pets/adopt/:id", asyncWrap(async (req, res, next) => {
    let id = req.params.id;
    const newAdoption = new Adoption(req.body);
    newAdoption.username = req.user.username;
    newAdoption.email = req.user.email;
    // console.log("Before petfind id is ",id);
    let pet = await Pets.findById(id);
    // console.log("after petfind")
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
app.get("/pets/new", isLoggedIn, asyncWrap((req, res, next) => {
    res.render("./pets/new.ejs");
}));

//new pet 
app.post("/pets/new", validatePets, asyncWrap(async (req, res, next) => {
    let newPet = new Pets(req.body);
 
    await newPet.save();
    req.flash('success', 'New pet added!');
    res.redirect("/pets");
}));

//edit route
app.get("/pets/edit/:id", isLoggedIn, asyncWrap(async (req, res, next) => {
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
app.post("/pets/edit/:id", isLoggedIn,validatePets, asyncWrap(async (req, res, next) => {
    let id = req.params.id;
    let pet = await Pets.findById(id);
    pet.name = req.body.name;
    pet.breed = req.body.breed;
    pet.age = req.body.age;
    pet.description = req.body.description;
    pet.photo_url = req.body.photo_url;
   
    await pet.save();
    req.flash('success', 'Pet updated!');
    res.redirect(`/pets/${id}`);
}));

// delete route
app.get("/pets/delete/:id", isLoggedIn, asyncWrap(async (req, res, next) => {
    let id = req.params.id;
    let pet = await Pets.findByIdAndDelete(id);
    req.flash('success', 'Pet deleted!');
    res.redirect(`/pets`);
}));

//show route
app.get("/pets/:id", asyncWrap(async (req, res, next) => {
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


app.get("/signup",  asyncWrap((req, res) => {
    res.render("./user/signup.ejs");
}));

//sign up
app.post("/signup", validateUsers, asyncWrap(async (req, res, next) => {
    console.log("This is req body ", req.body);
    const { password } = req.body;
    const newUser = new User({ ...req.body });
    const registeredUser = await User.register(newUser, password);
    req.flash('success', 'Signed up successfully!');
    res.redirect("/login");
}));

//  add to cart
app.get('/pets/wishlist/add/:petId', isLoggedIn, asyncWrap(async (req, res) => {
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
app.post("/pets/wishlist/remove/:petId",isLoggedIn,asyncWrap(async(req,res)=>{
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

app.get("/wishlist",isLoggedIn, asyncWrap(async (req, res, next) =>{
    let userId=res.locals.user._id;
    let data=await User.findById(userId).populate("wishlist");
    const wishlist=data.wishlist;
  
    res.render("./pets/wishlist.ejs", { wishlist });
}))

//login
app.get("/login", (req, res) => {
    res.render("./user/login.ejs");
});

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
    function (req, res) {
     
        req.flash('success', 'Logined in successfully!');
        res.redirect("/pets");
    });


//logout

app.get('/logout', isLoggedIn,async function (req, res, next) {
     req.logout(function (err) {
        if (err) { return next(err); }
        req.flash('success', 'Logged out successfully!');
        res.redirect('/pets');
    });
});

//forgetPassword
app.get("/forgetPassword",isLoggedIn,asyncWrap( (req, res) => {
    
    res.render("./user/forgetPassword.ejs");
}))

app.post("/forgetPassword", isLoggedIn,asyncWrap((req, res) => {
    res.render("./user/newPassword.ejs");
}))

//new password
app.get("/newPassword",isLoggedIn,asyncWrap ((req, res) => {
    req.flash("success", "Password reset successfully");
    res.redirect("/pets");
}));

app.get("/", (req, res) => {
    res.send("This is home route for petAdoption");
});

app.use((err, req, res, next) => {
    const error = err.message || "Something went wrong";
    res.render("./pets/error.ejs", { error });
});

app.listen(8080, () => {
    console.log("server started");
});