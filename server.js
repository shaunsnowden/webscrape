const express = require('express');
const bodyParser = require ('body-parser');
const logger = require('morgan');
const mongoose = require('mongoose');

// scraping tools
const axios = require("axios");
const cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 8080;

// Initialize Expresss
var app = express();

// Configure middleware
app.use('/', express.static(__dirname + '/www')); // redirect root
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));


// ----------------------Database config with Mongoose -----------------------
// ====================DEFINE LOCAL MONGODB URI===============================
var databaseUri = 'mongodb://localhost/SnowScraper';
console.log(process.env.MONGODB_URI);


if(process.env.MONGODB_URI){
  mongoose.connect(process.env.MONGODB_URI);
} else {
  mongoose.connect(databaseUri,{useMongoClient: true});
}


// var db = mongoose.connection;

// db.on('error', function(err) {
//   console.log('mongoose error: ',err);
// });

// db.once('open', function(){
//   console.log('Mongoose connection successful!');
// });
// Set mongoose to leverage built in JavaScript ES6 Promises


// // Connect to the Mongo DB
mongoose.Promise = Promise;
// mongoose.connect("mongodb://localhost/SnowScraper", {
//   useMongoClient: true
// });

app.get("/scrape", function(req,res){
  axios.get("https://www.mckinsey.com/business-functions/digital-mckinsey/our-insights").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("div.item").each(function (i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .find("h3.headline")
        .text();
      result.type = $(this)
        .find('eyebrow')
        .text()
      result.time = $(this)
        .find('time')
        .text()
      result.localLink = $(this)
        .find('a.item-title-link')
        .attr('href');

      // Create a new Article using the `result` object built from scraping
      db.Article
        .create(result)
        .then(function (dbArticle) {
          // If we were able to successfully scrape and save an Article, send a message to the client
          res.send("Scrape Complete");
        })
        .catch(function (err) {
          // If an error occurred, send it to the client
          res.json(err);
        });
    });
  });
})

// Route for getting all Articles from the db
app.get("/api/articles", function (req, res) {
  // Grab every document in the Articles collection
  db.Article
    .find({})
    .then(function (dbArticles) {
      console.log(dbArticles);
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticles);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article
    .findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function (dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// var db = mongojs('SnowScraper', ['webdevdata']);
// // This removes all data each time
// db.webdevdata.remove({});


// request("https://www.mckinsey.com/business-functions/digital-mckinsey/our-insights", (error, response, html) => {
//   var $ = cheerio.load(html);

//   $('div.item').each(function (i, element) {
//     console.log('--------');
//     var title = $(element).find('h3.headline').text();
//     console.log(title);

//     var time = $(element).find('time').text();
//     console.log(time);

//     var localLink = $(element).find('a.item-title-link').attr('href');
//     console.log(localLink);


//     var post = {
//       title: title,
//       time: time,
//       localLink: localLink
//     }


//     db.webdevdata.insert(post);
//   });

//   db.close();

// });


// to get the node JQuery module working
// require("jsdom").env("", function (err, window) {
//   if (err) {
//     console.error(err);
//     return;
//   }

//   var $ = require("jquery")(window);
// });


// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});