const mongoose = require("mongoose");
const cities = require("./cities");
const { places, descriptors } = require("./seedHelpers");
const Campground = require("../models/Campground");

mongoose.connect("mongodb://localhost:27017/yelp-camp", {
   useNewUrlParser: true,
   useCreateIndex: true,
   useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
   console.log("DataBase Connected!!");
});
const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
   await Campground.deleteMany({});
   for (let i = 0; i < 10; i++) {
      const random1000 = Math.floor(Math.random() * 1000);
      const price = Math.floor(Math.random() * 100) + 10;
      const camp = new Campground({
         authors: "6072c0f7e16979325c0e31aa",
         location: `${cities[random1000].city},${cities[random1000].state}`,
         title: `${sample(descriptors)} ${sample(places)}`,
         description:
            "    Lorem ipsum, dolor sit amet consectetur adipisicing elit. Excepturi quia praesentium saepe magni beatae eum ex consequatur non quis mollitia. Fugit, unde! Sapiente, nobis delectus nostrum suscipit iure sint tempora!",
         price: price,
         geometry: {
            type: "Point",
            coordinates: [
               cities[random1000].longitude,
               cities[random1000].latitude,
            ],
         },
         images: [
            {
               url:
                  "https://res.cloudinary.com/sid2107/image/upload/v1618415374/YelpCamp/fgsj3ks9svfoyfsoez4z.jpg",
               filename: "YelpCamp/fgsj3ks9svfoyfsoez4z",
            },
            {
               url:
                  "https://res.cloudinary.com/sid2107/image/upload/v1618415376/YelpCamp/a6hhissr8auywapxtfvu.jpg",
               filename: "YelpCamp/a6hhissr8auywapxtfvu",
            },
         ],
      });
      await camp.save();
   }
};
seedDB().then(() => {
   mongoose.connection.close();
});
