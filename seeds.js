const mongoose = require("mongoose"),
    Activities = require("./models/activity"),
    Comment   = require("./models/comment");

var data = [
    {
        name: "Paragliding", 
        img: "https://img.traveltriangle.com/blog/wp-content/uploads/2019/03/shutterstock_1246149364-Copy.jpg",
        price:'17',
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum"
    },
    {
        name: "River Rafting", 
        price:'8',
        img: "https://k6u8v6y8.stackpathcdn.com/blog/wp-content/uploads/2014/08/River-Rafting-in-Rishikesh.jpg",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum"
    },
    {
        name: "bungee jumping", 
        img: "https://i.ibb.co/VtV3j6h/bungee-jumping-in-kolad.jpg",
        price:'10',
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum"
    }
]

function seedDB(){
   //Remove all activities
   Activities.deleteMany({}, function(err){
        if(err){
            console.log(err);
        }
        console.log("removed Activities!");
        // add a few activities
        data.forEach(function(seed){
            Activities.create(seed, function(err, activity){
                if(err){
                    console.log(err)
                } else {
                    console.log("added a activity");
                    //create a comment
                    Comment.create(
                        {
                            text: "This place is great, but I wish there was internet",
                            author: "Homer"
                        }, function(err, comment){
                            if(err){
                                console.log(err);
                            } else {
                                activity.comments.push(comment);
                                activity.save();
                                console.log("Created new comment");
                            }
                        });
                }
            });
        });
    }); 
    //add a few comments
}

module.exports = seedDB;