var mongoose = require("mongoose");

// SCHEMA SETUP
var activitySchema = new mongoose.Schema({
   name: String,
   img: String,
   price:String,
   location:String,
   longitude:Number,
   latitude:Number,
   description: String,
   author: {
	id:{
		type:mongoose.Schema.Types.ObjectId,
		ref:"User"
	},
	username:String
   },
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ]
});

module.exports = mongoose.model("Activity", activitySchema);