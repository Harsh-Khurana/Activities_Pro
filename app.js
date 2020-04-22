const express = require('express'),
	app = express(),
	cors = require('cors'),
	bodyParser = require('body-parser'),
	rp = require('request-promise'),
	mongoose = require('mongoose'),
	passport = require('passport'),
	LocalStrategy = require('passport-local'),
	Activities = require('./models/activity'),
	User = require('./models/user'),
	methodOverride = require('method-override'),
	flash = require('connect-flash'),
	seedDB = require('./seeds'),
	comments = require('./models/comment');

const url = process.env.DATABASEURL || 'mongodb://localhost:27017/Adventure'
mongoose.connect(url,{ useNewUrlParser:true ,useUnifiedTopology:true ,useFindAndModify: false});

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(`${__dirname}/public`));
app.use(methodOverride('_method'));
app.use(flash());
app.use(cors());

// To seed data (fn defination in seeds.js)
// seedDB();

// PASSPORT CONFIG
app.use(require('express-session')({
	secret:'not a yelp camp app',
	resave:false,
	saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
	res.locals.currentUser = req.user;
	res.locals.error = req.flash('error');
	res.locals.success = req.flash('success');
	next();
})

// Login check middleware
const isLoggedIn = (req,res,next)=>{
	if(req.isAuthenticated()){
		return next();
	}
	req.flash('error','You should be logged in to do that!!');
	res.redirect('/login');
}

// ==========
//	ROUTES
// ==========

app.get('/',(req,res)=>{
	res.render('home.ejs');
});

//INDEX - Show all activities
app.get('/activities',(req,res)=>{
	Activities.find({},(err,activities)=>{
		if(err){
		console.log('Oops there is an error',err);
		}else{
			res.render('activities.ejs',{activities:activities});
		}
	})
});

//NEW - adds in info about new activity
app.get('/activities/new',isLoggedIn ,(req,res)=>{
	res.render('form.ejs');
})

//CREATE - Creates a new activity or adds into database based on info recieved from the form
app.post('/activities',isLoggedIn ,(req,res)=>{
	console.log(req.body);
	let {activityName,imgLink,desc,price,location} = req.body;
	let author = {
		id:req.user._id,
		username:req.user.username
	}
	rp(`https://api.mapbox.com/geocoding/v5/mapbox.places/${location}.json?access_token=${process.env.GEOCODER}`)
		.then(resp=>JSON.parse(resp))
		.then(result=>{
			const [longitude,latitude] = result.features[0].center;
			Activities.create(
				{ name:activityName,
				  img:imgLink,
				  price:price,
				  location:location,
				  longitude:longitude,
				  latitude:latitude,
				  description:desc,
				  author:author
				},(err,activity)=>{
				if(err){
					req.flash('Error',err.message);
					res.redirect('/activities');
				}else{
					req.flash('success','Added Your Activity');
					res.redirect('/activities');
				}
			});
		});
})

//SHOW - This shows info of particular activity
app.get('/activities/:id',(req,res)=>{
	//Find the activity with provided findById
	Activities.findById(req.params.id).populate('comments').exec((err,activity)=>{
		if(err){
			console.log('Error!',err);
		}else{
			//render show template with that activity
			res.render('show.ejs',{ activity:activity });
		}
	})
});

// ==============
// COMMENT ROUTES
// ==============
app.get('/activities/:id/comments/new',isLoggedIn ,(req,res)=>{
	Activities.findById(req.params.id,(err,activity)=>{
		if(err){
			console.log(err);
		}else{
			res.render('commentForm.ejs',{activity:activity});
		}
	})
})

app.post('/activities/:id/comments',isLoggedIn ,(req,res)=>{
	Activities.findById(req.params.id,(err,activity)=>{
		if(err){
			console.log(err);
		}else{
			comments.create({
				author:req.body.authorName,
				text:req.body.commentText
			},(err,comment)=>{
				// add username and id to comment
				comment.author.id =  req.user._id;
				comment.author.username = req.user.username;
				//save comment
				comment.save();
				activity.comments.push(comment);
				activity.save();
			})
		}
		req.flash('success','Successfully added Comment');
		res.redirect(`/activities/${req.params.id}`);
	})
})

// ===========
// AUTH ROUTES
// ===========

// register
app.get('/register',(req,res)=>{
	res.render('register.ejs');
});
// handle sign up logic
app.post('/register',(req,res)=>{
	let newUser = new User({ username:req.body.username });
	User.register(newUser, req.body.password, (err,user)=>{
		if(err){
			req.flash('error',err.message);
			return res.redirect('/register');
		}
		passport.authenticate('local')(req,res,()=>{
			req.flash('success',`Welcome to Adventure World ${user.username}`);
			res.redirect('/activities');
		});
	})
})

//login 
app.get('/login',(req,res)=>{
	res.render('login.ejs');
});
//handle sign in logic
app.post('/login',passport.authenticate('local',{
	successRedirect:'/activities',
	failureRedirect:'/login'
}),(req,res)=>{
	// no code required here
});

//logout
app.get('/logout',(req,res)=>{
	req.logout();
	req.flash('success','Successfully Logged Out :)');
	res.redirect('/activities');
})

// =======================
// UPDATE & DESTROY ROUTES
// =======================

// ------- FOR ACTIVITIES ---------

// middleware to check authorization for edit and delete
const checkActivityOwnership = (req,res,next)=>{
	if(req.isAuthenticated()){
		Activities.findById(req.params.id,(err,activity)=>{
			if(err){
				req.flash('error','Activity not found');
				res.redirect('back');
			}else{
				if(activity.author.id.equals(req.user._id) || req.user.isAdmin){
					next();
				}else{
					req.flash('error',"You don't have the permission to do that");
					res.redirect('back');
				}
			}
		})
	}else{
		req.flash('error','You need to be logged in to do that!!');
		res.redirect('back');
	}
}

// Edit route
app.get('/activities/:id/edit',checkActivityOwnership ,(req,res)=>{
	Activities.findById(req.params.id,(err,activity)=>{
		if(err){
			req.flash('error','Activity not found');
			res.redirect('back');
		}else{
			res.render("edit.ejs",{activity:activity});
		}
	})
});
// Update route
app.put('/activities/:id',checkActivityOwnership ,(req,res)=>{
	const location = req.body.activity.location;
	rp(`https://api.mapbox.com/geocoding/v5/mapbox.places/${location}.json?access_token=pk.eyJ1IjoiaGFyc2gta2h1cmFuYSIsImEiOiJjazk2dHhwZXowamZxM2RsNGpyMWQ3eGhiIn0.VvHqE-lI53sh_tc62ArYrg`)
		.then(resp=>JSON.parse(resp))
		.then(result=>{
			const [longitude,latitude] = result.features[0].center;
			req.body.activity.longitude = longitude;
			req.body.activity.latitude = latitude;
			Activities.findByIdAndUpdate(req.params.id,req.body.activity,(err,activity)=>{
				if(err){
					req.flash('error',err.message);
					res.redirect('/activities');
				}else{
					console.log(activity);
					req.flash('success','Updated Successfully');
					res.redirect(`/activities/${req.params.id}`);
				}
			})
		});
})
// Destroy route
app.delete('/activities/:id',checkActivityOwnership ,(req,res)=>{
	Activities.findByIdAndRemove(req.params.id,(err,activity)=>{
		if(err){
			console.log(err);
		}
		req.flash('success','Activity Removed');
		res.redirect('/activities');
	})
});


// --------- FOR COMMENTS -----------

// middleware to check authorization for edit and delete
const checkCommentOwnership = (req,res,next)=>{
	if(req.isAuthenticated()){
		comments.findById(req.params.comments_id,(err,comment)=>{
			if(err){
				res.redirect('back');
			}else{
				if(comment.author.id.equals(req.user._id) || req.user.isAdmin){
					next();
				}else{
					res.redirect('back');
				}
			}
		})
	}else{
		req.flash('You need to be logged in to do that');
		res.redirect('back');
	}
}

// Edit route
app.get('/activities/:id/comments/:comments_id/edit',checkCommentOwnership ,(req,res)=>{
	comments.findById(req.params.comments_id,(err,comment)=>{
		if(err){
			req.flash('error','Something went wrong');
			res.redirect('back');
		}else{
			res.render('commentEdit.ejs',{comment:comment,activity_id:req.params.id});
		}
	})
})
// Update route
app.put('/activities/:id/comments/:comments_id',checkCommentOwnership ,(req,res)=>{
	comments.findByIdAndUpdate(req.params.comments_id,req.body.comment,(err,comment)=>{
		if(err){
			res.redirect('back');
		}else{
			res.redirect(`/activities/${req.params.id}`);
		}
	})
})
// Delete route
app.delete('/activities/:id/comments/:comments_id',checkCommentOwnership ,(req,res)=>{
	comments.findByIdAndRemove(req.params.comments_id,(err,comment)=>{
		if(err){
			res.redirect('back');
		}else{
			req.flash('success','Comment Removed Successfully')
			res.redirect(`/activities/${req.params.id}`);
		}
	})
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Adventure World is running on port ${ PORT }`);
});