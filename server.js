

// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
// Requiring our Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
var exphbs=require("express-handlebars");
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;



// Initialize Express
var app = express();

// set up handlebars engine
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
//app.use(express.static("public"));

// Serve static content for the app from the 'public' directory in the
// application directory.
app.use(express.static(__dirname + '/public'));

//Setting handlebars as view engine
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// Database configuration with mongoose
//mongoose.connect("mongodb://localhost/scraped-news");
mongoose.connect("mongodb://heroku_2cw91vg1:bh0u9q1i1pnjttlbtj1c7skqh1@ds151141.mlab.com:51141/heroku_2cw91vg1");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});


// Routes
// ======
//go to root page
app.get("/",function(req,res){
  res.render('index');
});

// A GET request to scrape the echojs website
app.get("/scrape", function(req, res) {
    request('http://www.lehighvalleylive.com', function(error, response, html) {

        // Load the HTML into cheerio and save it to a variable
        // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
        var $ = cheerio.load(html);

        // An empty array to save the data that we'll scrape
       // var result = [];
     //  var result = {};

        // Select each instance of the HTML body that you want to scrape
        // NOTE: Cheerio selectors function similarly to jQuery's selectors, 
        // but be sure to visit the package's npm page to see how it works
        // $('div.h2.fullheadline')// 
        //$("a.img.adv-photo-large")
        $('div.h2.fullheadline').each(function(i, element) {

      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");

      // Using our Article model, create a new entry
      // This effectively passes the result object to the entry (and the title and link)
      var entry = new Article(result);

      // Now, save that entry to the db
      entry.save(function(err, doc) {
        // Log any errors
       if (err) {
         console.log(err);
       }
        // Or log the doc
       else {
        console.log(doc);
        }
     });

    });
  });
  // Tell the browser that we finished scraping the text
  res.send("Scrape Complete");
 // res.redirect("/articles");

});


// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});

// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  // ..and populate all of the notes associated with it
  .populate("note")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});


// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);

  // And save the new note the db
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
    }
  });
});


// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});
