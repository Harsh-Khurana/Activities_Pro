var mongoose = require("mongoose");

var commentSchema = mongoose.Schema({
    text: String,
    created:{
    	type:String,
    	default:new Date()
    },
    author: {
    	id:{
    		type:mongoose.Schema.Types.ObjectId,
    		ref:"User"
    	},
    	username:String
    }
});

module.exports = mongoose.model("Comment", commentSchema);