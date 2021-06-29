require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const helmet = require("helmet");

const mongoSanitize = require("express-mongo-sanitize");

const userRoutes = require("./routes/users");
const campgroundsRoutes = require("./routes/campgrounds");
const reviewsRoutes = require("./routes/reviews");
const MongoStore = require("connect-mongo");

// const dbUrl = process.env.DB_URL;
// dbUrl
const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/yelp-camp";
mongoose.connect(dbUrl, {
   useNewUrlParser: true,
   useCreateIndex: true,
   useUnifiedTopology: true,
   useFindAndModify: false,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
   console.log("DataBase Connected!!");
});

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(
   mongoSanitize({
      replaceWith: "_",
   })
);

const secret = process.env.SECRET || "E81B1B119664FD986F3594B712994";

const store = MongoStore.create({
   mongoUrl: dbUrl,
   touchAfter: 24 * 60 * 60,
   crypto: {
      secret,
   },
});

store.on("error", function (e) {
   console.log("Session Store Error", e);
});

const sessionConfig = {
   store,
   name: "session",
   secret,
   resave: false,
   saveUninitialized: true,
   cookie: {
      httpOnly: true,
      // secure will not work in local host you have to deploy app
      // secure: true,
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7,
   },
   // store: (originally we re going to store in mongo, right now it is memory store for development purpose)
};
app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

const scriptSrcUrls = [
   "https://stackpath.bootstrapcdn.com/",
   "https://api.tiles.mapbox.com/",
   "https://api.mapbox.com/",
   "https://kit.fontawesome.com/",
   "https://cdnjs.cloudflare.com/",
   "https://cdn.jsdelivr.net",
];
//This is the array that needs added to
const styleSrcUrls = [
   "https://kit-free.fontawesome.com/",
   "https://api.mapbox.com/",
   "https://api.tiles.mapbox.com/",
   "https://fonts.googleapis.com/",
   "https://use.fontawesome.com/",
   "https://cdn.jsdelivr.net",
];
const connectSrcUrls = [
   "https://api.mapbox.com/",
   "https://a.tiles.mapbox.com/",
   "https://b.tiles.mapbox.com/",
   "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
   helmet.contentSecurityPolicy({
      directives: {
         defaultSrc: [],
         connectSrc: ["'self'", ...connectSrcUrls],
         scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
         styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
         workerSrc: ["'self'", "blob:"],
         objectSrc: [],
         imgSrc: [
            "'self'",
            "blob:",
            "data:",
            "https://res.cloudinary.com/sid2107/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
            "https://images.unsplash.com/",
         ],
         fontSrc: ["'self'", ...fontSrcUrls],
      },
   })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
   if (!["/login", "/register", "/"].includes(req.originalUrl)) {
      req.session.returnTo = req.originalUrl;
   }
   res.locals.currentUser = req.user;
   res.locals.success = req.flash("success");
   res.locals.error = req.flash("error");
   next();
});

app.use("/", userRoutes);
app.use("/campgrounds", campgroundsRoutes);
app.use("/campgrounds/:id/reviews", reviewsRoutes);

app.get("/", (req, res) => {
   res.render("home");
});

app.all("*", (req, res, next) => {
   next(new ExpressError("Page Not Found!!", 404));
});

app.use((err, req, res, next) => {
   const { statusCode = 500 } = err;
   if (!err.message) err.message = "OHH NO!! Something Went Wrong";
   res.status(statusCode).render("error", { err });
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
   console.log(`Serving on Port ${port}`);
});
