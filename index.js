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
const User = require("./userSchema.js");
const asyncWrap = require("./middleware.js");
const petsSchema = require("./validatePets.js");
const userSchema = require("./validateUser.js");
const LocalStrategy = require('passport-local');// for local passport

const dbUrl=process.env.dbUrl;
const SECRET=process.env.SECRET;
const GOOGLE_CLIENT_ID=process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET=process.env.GOOGLE_CLIENT_SECRET;

const index=require("./routes/pets.js")
const userRouter=require("./routes/user.js")

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

async function main() {
    try {
        await mongoose.connect(dbUrl, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log("Db Connected Successfully!");
    } catch (err) {
        console.error("MongoDB Connection Error:", err);
    }
}
main();

const validatePets = async(req, res, next) => {
    try {
       await petsSchema.validate(req.body);
    }
    catch (error) {
        next(error);
    }
    next();
}
const validateUsers = async(req, res, next) => {
    try {
     await   userSchema.validate(req.body);
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

//profile
app.get("/profile", isLoggedIn,asyncWrap(async (req, res, next) => {
    let userId=res.locals.user._id;
    let data=await User.findById(userId).populate("wishlist");
    const wishlist=data.wishlist;
    res.render("./user/profile.ejs", { wishlist });
}));

//index 
app.use("/pets", index);
app.use("/signup", userRouter);



//sign up
app.post("/signup", validateUsers, asyncWrap(async (req, res, next) => {
    console.log("This is req body ", req.body);
    const { password } = req.body;
    const newUser = new User({ ...req.body });
    const registeredUser = await User.register(newUser, password);
    req.flash('success', 'Signed up successfully!');
    res.redirect("/login");
}));

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


app.get("/", asyncWrap(async (req, res, next) => {
    res.render("./pets/landing.ejs");
}));

app.use((err, req, res, next) => {
    const error = err.message || "Something went wrong";
    res.render("./pets/error.ejs", { error });
});

app.listen(8080, () => {
    console.log("server started");
});