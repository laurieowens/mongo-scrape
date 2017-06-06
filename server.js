/* Scraper Template  (18.10) 
 * ========================= */


// Students: Using this skeleton, the cheerio documentation,
// and what you've learned in class so far, scrape a website
// of your choice, save it in a result array, and log it to the console.


// Dependencies:

// Snatches HTML from URLs
var express = require("express");
var mongojs = require("mongojs");
var request = require('request');
// Scrapes our HTML
var cheerio = require('cheerio');

//Inititalize Express
var app = express();

//Set up a static folder(public) for the web app
app.use(express.static("public"));

//Database specify URL of database and the name of the connection
var databaseUrl = "scraped-news";
var collections = ("scrapedData");


var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
    console.log("Database error:", error);
});
app.get("/", function(req, res) {
    res.send("hello world");
})

// Make a request call to grab the HTML body from the site of your choice
request('http://www.lehighvalleylive.com', function(error, response, html) {

    // Load the HTML into cheerio and save it to a variable
    // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
    var $ = cheerio.load(html);

    // An empty array to save the data that we'll scrape
    var result = [];

    // Select each instance of the HTML body that you want to scrape
    // NOTE: Cheerio selectors function similarly to jQuery's selectors, 
    // but be sure to visit the package's npm page to see how it works
    // $('div.h2.fullheadline')// 
    //$("a.img.adv-photo-large")
    $('div.h2.fullheadline').each(function(i, element) {

        var link = $(element).children().attr("href");
        var title = $(element).children().text();
        var imgLink = $(element).children().attr("src");

        //  var imgLink = $(element).find("a").find('img.adv-photo-large').attr("src");

        // Save these results in an object that we'll push into the result array we defined earlier
        result.push({
            title: title,
            link: link,
            imgLink: imgLink
        });
    });
    console.log(result);
});



app.listen(3000, function() {
    console.log("app running on port 3000!");
});
