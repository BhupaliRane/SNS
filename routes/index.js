const express = require('express');
const router = express.Router();
const mongodb = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
var accessTokenSecret = "myAccessTokenSecret1234567890";
const fs = require('fs');
const { error } = require('console');
var mainURL = "http://localhost:3000";
var multer  = require('multer');
const mv = require('mv');
const { ObjectId } = require('mongodb');
const { ObjectID } = require('mongodb');
const sgMail = require('@sendgrid/mail')

const API_KEY = 
'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'

sgMail.setApiKey(API_KEY)

var upload = multer({ dest: './public/images'});


// var socketIO = require('socket.io')(http);
var socketID = "";
var users = [];

// const socketIO = req.app.get('socketio');
const MongoClient = mongodb.MongoClient;

MongoClient.connect("mongodb+srv://bhupali:bhupali@cluster0.6myji.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",{useUnifiedTopology: true}, function (err, client) {
     if(err) throw err;
        var database = client.db("my_social_network");
        console.log("database connected");
        
        router.post('/signup', (req, res) =>{
            var name = req.fields.name;
            var username = req.fields.username;
            var email = req.fields.email;
            var password = req.fields.password;
            var gender = req.fields.gender;
            
            database.collection("users").findOne({
                $or:[
                    {"email": email},
                    {"username": username}
                ]
            },(error, user) =>{
                if (user == null) {
                    bcrypt.hash(password, 10, (error, hash) =>{
                        database.collection("users").insertOne({
                            "name": name,
                            "username": username,
                            "email": email,
                            "password": hash,
                            "gender": gender,
                            "profileImage": "",
                            "coverPhoto":"",
                            "dob":"",
                            "city":"",
                            "country":"",
                            "aboutMe":"",
                            "friends":[],
                            "pages":[],
                            "notifications":[],
                            "groups":[],
                            "posts":[],
                            "isVerify": false
                        }, (error, data) =>{
                            res.json({
                                "status": "success",
                                "message": "Signed up successfiully. You can login now"
                            })
                        })
                    })

                }else{
                    res.json({
                        "status": "error",
                        "message": "Email or username already exist"
                    })
                }
            })
        })

        router.get('/signup',(req, res) =>{
            res.render('signup')
        })

        router.get('/login',(req, res) =>{
            res.render('login')
        })

        router.post('/login', (req, res) =>{
            database.collection("users").findOne({
                "email": req.fields.email
            }, (err, user) =>{
                if (user == null) {
                    res.json({
                        "status": "error",
                        "message":"Email does Found"
                    })
                }else{
                    bcrypt.compare(req.fields.password, user.password, (error, success) =>{
                        if (success) {
                            var accessToken = jwt.sign({email: req.fields.email}, accessTokenSecret);
                            database.collection("users").findOneAndUpdate({"email":  req.fields.email}, {$set:{"accessToken": accessToken}},(error, data) =>{
                                res.json({
                                    "status": "success",
                                    "message": "Login successfully",
                                    "accessToken": accessToken,
                                    "profileImage": user.profileImage
                                })
                            })      
                        } else{
                            res.json({
                                "status": "error",
                                "message": "Password was wrong"
                            })
                        }

                    })
                }
            })
        })

        router.get('/updateprofile', (req, res) =>{
            res.render('updateprofile')
        })

        router.post('/getuser', (req, res) =>{
            var accessToken = req.fields.accessToken;

            database.collection("users").findOne({
                "accessToken": accessToken
            }, (err, user) =>{
                if (user == null) {
                    console.log("user not found");
                    res.json({
                        "status": "error",
                        "message": "User has been logged out. Please login again."
                    })
                }else{
                    console.log("user found");

                    res.json({
                        "status": "success",
                        "message": "Reacord has been fetched",
                        "data": user
                    })
                }
            })
        })

        router.get("/logout", (req, res) =>{
            res.redirect('/login')
        })

        router.post('/uploadCoverPhoto',(req, res) =>{
            var accessToken = req.fields.accessToken;
            var coverPhoto = "";
            console.log("working");
            console.log(req.files);
            // var file = 'public/images' + '/' + req.files.coverPhoto.name;
        
            // mv(req.files.coverPhoto.path, file, function (err) {
            //     if (err) {
            //         console.log('> FileServer.jsx | route: "/files/upload" | err:', err);
            //         throw err;
            //     }
            // });
            database.collection("users").findOne({
                "accessToken": accessToken
            }, (err, user) =>{
                if (err) {
                    console.log(err);
                    return
                }
                if (user == null) {
                    console.log("user not found");
                    res.json({
                        "status": "error",
                        "message": "User has been logged out. Please login again."
                    })
                }else{
                    console.log("cover user found");
                  if (req.files.coverPhoto.size > 0 && req.files.coverPhoto.type.includes("image")) {
                    if (user.coverPhoto != "") {
                        fs.unlink(user.coverPhoto, (err) =>{
                            if (err) {
                                throw err
                            }
                        })   
                    }
                    //path
            // var file = 'public/images' + '/' + req.files.coverPhoto.name;           

                    coverPhoto= "public/images/"+new Date().getTime()+"-"+req.files.coverPhoto.name;
                    // coverPhotoDB= "images/"+new Date().getTime()+"-"+req.files.coverPhoto.name;
                    // fs.rename(req.files.coverPhoto.path, coverPhoto,(err) =>{
                    //     if(err){
                    //         throw err
                    //     } 
                    // })
                      mv(req.files.coverPhoto.path, coverPhoto, function (err) {
                        if (err) {
                            console.log('> FileServer.jsx | route: "/files/upload" | err:', err);
                            throw err;
                        }
                     });
                    database.collection("users").updateOne({
                        "accessToken": accessToken
                    }, {
                        $set:{
                            "coverPhoto": coverPhoto
                        }
                    },(err, data) =>{
                        res.json({
                            "status": "success",
                            "message": "Cover photo has been Updated.",
                            data: mainURL+"/"+coverPhoto
                        })
                    })
                }else{
                    res.json({
                        "status": "error",
                        "message": "please select valid image."
                    })
                }
                }
            })
        })

        router.post('/uploadProfilePhoto', (req, res) =>{
            var accessToken = req.fields.accessToken;
            var profileImage = "";
            console.log("working");
            // console.log(req.files);
            // var file = 'public/images' + '/' + req.files.coverPhoto.name;
        
            // mv(req.files.coverPhoto.path, file, function (err) {
            //     if (err) {
            //         console.log('> FileServer.jsx | route: "/files/upload" | err:', err);
            //         throw err;
            //     }
            // });
            database.collection("users").findOne({
                "accessToken": accessToken
            }, (err, user) =>{
                if (err) {
                    console.log(err);
                    return
                }
                if (user == null) {
                    console.log("user not found");
                    res.json({
                        "status": "error",
                        "message": "User has been logged out. Please login again."
                    })
                }else{
                    console.log("cover user found");
                  if (req.files.profileImage.size > 0 && req.files.profileImage.type.includes("image")) {
                    if (user.profileImage != "") {
                        fs.unlink(user.profileImage, (err) =>{
                            if (err) {
                                throw err
                            }
                        })   
                    }
                    //path
            // var file = 'public/images' + '/' + req.files.coverPhoto.name;           

                    profileImage= "public/images/"+new Date().getTime()+"-"+req.files.profileImage.name;
                    // coverPhotoDB= "images/"+new Date().getTime()+"-"+req.files.coverPhoto.name;
                    // fs.rename(req.files.coverPhoto.path, coverPhoto,(err) =>{
                    //     if(err){
                    //         throw err
                    //     } 
                    // })
                      mv(req.files.profileImage.path, profileImage, function (err) {
                        if (err) {
                            console.log('> FileServer.jsx | route: "/files/upload" | err:', err);
                            throw err;
                        }
                     });
                    database.collection("users").updateOne({
                        "accessToken": accessToken
                    }, {
                        $set:{
                            "profileImage": profileImage
                        }
                    },(err, data) =>{
                        res.json({
                            "status": "success",
                            "message": "profile photo has been Updated.",
                            data: mainURL+"/"+profileImage
                        })
                    })
                }else{
                    res.json({
                        "status": "error",
                        "message": "please select valid image."
                    })
                }
                }
            })

        })

        router.post('/updateProfile', (req, res) =>{
            var accessToken = req.fields.accessToken;
            var name = req.fields.name;
            var dob = req.fields.dob;
            var city = req.fields.city;
            var country = req.fields.country;
            var aboutMe = req.fields.aboutMe; 

            database.collection("users").findOne({
                "accessToken": accessToken
            }, (err, user) =>{
                if (user == null) {
                    console.log("user not found");
                    res.json({
                        "status": "error",
                        "message": "User has been logged out. Please login again."
                    })
                }else{
                    database.collection("users").updateOne({
                        "accessToken": accessToken
                    },{
                        $set:{
                            "name": name,
                            "dob": dob,
                            "city": city,
                            "country": country,
                            "aboutMe": aboutMe
                        }
                    }, function(error, data) {
                        if (error) {
                            throw error
                        }
                        res.json({
                            "status": "success",
                            "message": "Profile has been updated",
                        })
                    })
                }
            })
        })
        
        router.post('/addPost', (req, res) =>{
            console.log(req.fields);
            var accessToken = req.fields.accessToken;
            var caption = req.fields.caption;
            var image = "";
            var video = "";
            var type = req.fields.type;
            var createdAt = new Date().getTime();
            var _id = req.fields._id;

            database.collection("users").findOne({
                "accessToken": accessToken
            }, (error, user) =>{
                if (user == null) {
                    console.log("user not found");
                    res.json({
                        "status": "error",
                        "message": "User has been logged out. Please login again."
                    })
                }else{
                       if (req.files.image.size > 0 && req.files.image.type.includes("image")) {
                           image="public/images/"+new Date().getTime()+"-"+req.files.image.name;
                           mv(req.files.image.path, image, function (err) {
                            if (err) {
                                console.log('Post image', err);
                                throw err;
                            }
                         });
                        }
                        
                        if (req.files.video.size > 0 && req.files.video.type.includes("video")) {
                           video="public/videos/"+new Date().getTime()+"-"+req.files.video.name;
                           mv(req.files.video.path, video, function (err) {
                            if (err) {
                                console.log('Post Video', err);
                                throw err;
                            }
                         })
                        }
                        
                        if(type == "page_post"){
                            database.collection("pages").findOne({
                                "_id": mongodb.ObjectId(_id)
                            },(error, page) =>{
                                if(page == null){
                                    res.json({
                                        "status": "error",
                                        "message": "Page does not exist."
                                    });
                                    return;
                                }else{
                                    if(page.user._id.toString() != user._id.toString()){
                                     res.json({
                                         "status": "error",
                                         "message": "Sorry, you do not own this page. "
                                     });
                                     return;   
                                    }
                                    database.collection("posts").insertOne({
                                        "caption": caption,
                                        "image": image,
                                        "video": video,
                                        "type": type,
                                        "createdAt": createdAt,
                                        "likers":[],
                                        "comments":[],
                                        "shares":[],
                                        "user":{
                                            "_id": page._id,
                                            "name": page.name,
                                            "profileImage": page.coverPhoto
                                        }
            
                                    }, (error, data) =>{
                                        res.json({
                                            "status": "success",
                                            "message": "Post has been uploaded"
                                        })
                                    })

                                }
                            })
                        }else if(type == "group_post"){
                            database.collection("groups").findOne({
                                "_id": mongodb.ObjectId(_id)
                            }, (error, group) =>{
                              if (group == null) {
                                res.json({
                                    "status": "error",
                                    "message": "Group does not exist"
                                });
                                return;
                              }else{
                                var isMember = false;
                                for(var a= 0; a< group.members.length; a++){
                                    var member = group.members[a];
                                    if (member._id.toString() == user._id.toString()) {
                                        isMember = true;
                                        break;
                                    }
                                }
                                if (!isMember) {
                                    res.json({
                                        "status": "error",
                                        "message": "Sorry, you are not a member of this group."
                                    });
                                    return;
                                }
                              }
                              database.collection("posts").insertOne({
                                "caption": caption,
                                "image": image,
                                "video": video,
                                "type": type,
                                "createdAt": createdAt,
                                "likers":[],
                                "comments":[],
                                "shares":[],
                                "user":{
                                    "_id": group._id,
                                    "name": group.name,
                                    "profileImage": group.coverPhoto
                                },
                                "uploader":{
                                    "_id": user._id,
                                    "name": user.name,
                                    "profileImage": user.profileImage
                                }
    
                            }, (err, data)=>{
                                res.json({
                                    "status": "success",
                                    "message": "Post has been uploaded"
                                })
                               
                            })

                            })
                        }else{
                            
                        database.collection("posts").insertOne({
                            "caption": caption,
                            "image": image,
                            "video": video,
                            "type": type,
                            "createdAt": createdAt,
                            "likers":[],
                            "comments":[],
                            "shares":[],
                            "user":{
                                "_id": user._id,
                                "name": user.name,
                                "profileImage": user.profileImage
                            }

                        }, (err, data)=>{
                            database.collection("users").updateOne({
                                "accessToken": accessToken
                            }, {
                                $push:{
                                    "posts":{
                                        "_id": data.insertedId,
                                        "caption": caption,
                                        "image": image,
                                        "video":video,
                                        "type": type,
                                        "createdAt": createdAt,
                                        "likers": [],
                                        "comments": [],
                                        "shares": []
                                    }
                                }
                            }, (err, userData) =>{
                                res.json({
                                    "status":"success",
                                    "message":"Post has been uploaded"
                                })
                            })
                        })
                        }

                }
            })

        })

        router.get('/',(req, res) =>{
            res.render('index')
        })

        router.post('/getNewsfeed', (req, res) =>{
             var accessToken = req.fields.accessToken;

             database.collection("users").findOne({
                 "accessToken": accessToken
             },(err, user) =>{
                 if (user == null) {
                     res.json({
                         "status":"error",
                         "message":"User has been logged out.Please login again"
                     })
                 }else{
                     var ids = [];
                     ids.push(user._id);
                    for(var a = 0; a< user.pages.length; a++){
                        ids.push(user.pages[a]._id)
                    }//this for loop[ fetched post from liked pages of its friends]
                    
                    for(var a = 0; a< user.groups.length; a++){
                        if(user.groups[a].status == "Accepted"){
                            ids.push(user.groups[a]._id)
                        }   
                    }
                    for(var a = 0; a< user.friends.length; a++){
                        ids.push(user.friends[a]._id)
                    }//this for loop[ fetched post from liked pages of its frieds]
                    
                    database.collection("posts").find({
                         "user._id":{
                             $in: ids
                         }
                     }).sort({
                         "createdAt": -1
                     }).limit(5).toArray((err, data) =>{
                         res.json({
                             "status":"success",
                             "message":"Record has been fetched",
                             "data": data
                         })
                     })

                 }
             })
         })

         router.post('/toggleLikePost',(req, res) =>{
            var accessToken = req.fields.accessToken;
            var _id = req.fields._id;

            database.collection("users").findOne({
                "accessToken": accessToken
            },(err, user) =>{
                if (user == null) {
                    res.json({
                        "status":"error",
                        "message":"User has been logged out.Please login again"
                    })
                }else{
                    database.collection('posts').findOne({
                        "_id": mongodb.ObjectId(_id)
                    }, (err, post) =>{
                        if(post == null){
                            res.json({
                                "status":"error",
                                "message":"Post does not exist"
                            })
                        }else{
                            // console.log(post);
                            // res.json({
                            //     "status":"error",
                            //     "message":"Post database madhe aahe"
                            // })
                            var isLiked = false;
                            for(var a = 0; a < post.likers.length; a++){
                                var liker = post.likers[a];
                                if(liker._id.toString() == user._id.toString()){
                                    isLiked = true;
                                    break;
                                }
                            }
                            if(isLiked){
                                database.collection("posts").updateOne({
                                    "_id": mongodb.ObjectId(_id)
                                },{
                                    $pull:{
                                        "likers":{
                                            "_id": user._id,
                                        }
                                    }
                                }, (err, data) =>{
                                    database.collection("users").updateOne({
                                        $and:[{
                                            "_id": post.user._id
                                        },{
                                            "posts._id": post._id
                                        }]
                                    },{
                                        $pull:{
                                            "posts.$[].likers":{
                                                "_id": user._id,
                                            }
                                        }
                                    });
                                    res.json({
                                        "status":"unliked",
                                        "message":"Post has been unliked"
                                    })
                                })
                            } else{
                                database.collection("user").updateOne({
                                    "_id": post.user._id
                                }, {
                                    $push:{
                                        "notifications":{
                                            "_id": mongodb.ObjectId(),
                                            "type": "photo_liked",
                                            "content": user.name + " has liked your photo.",
                                            "profileImage": user.profileImage,
                                            "createdAt": new Date().getTime()
                                        }
                                    }
                                });

                                database.collection("posts").updateOne({
                                    "_id": mongodb.ObjectId(_id)
                                }, {
                                    $push:{
                                        "likers":{
                                            "_id": user._id,
                                            "name": user.name,
                                            "profileImage": user.profileImage
                                        }
                                    }
                                },(err, data) =>{
                                    database.collection("users").updateOne({
                                        $and: [{
                                            "_id": post.user._id
                                        },{
                                            "posts._id": post._id
                                        }
                                    ]
                                    },{
                                        $push: {
                                            "posts.$[].likers":{
                                                "_id": user._id,
                                                "name": user.name,
                                                "profileImage": user.profileImage
                                            }
                                        }
                                    });

                                    res.json({
                                        "status": "success",
                                        "message": "Post has been liked."
                                    })
                                })
                            }
                            
                        }

                    })

                }
            })
             
         })

         router.post("/postComment", (req, res) =>{
             var accessToken = req.fields.accessToken;
            // console.log(accessToken);
            var _id = req.fields._id;//id of post
            var comment = req.fields.comment;
            var createdAt = new Date().getTime();
            database.collection("users").findOne({
                "accessToken": accessToken
            }, (err, user) =>{
                if(user == null){
                    res.json({
                        "status": "error",
                        "message": "User has been logged out. Please login again"
                    })
                }else{
                    database.collection("posts").findOne({
                        "_id": mongodb.ObjectId(_id)
                    }, (err, post) =>{
                        if (post == null) {
                            res.json({
                                "status":"error",
                                "message": "Post does not exist"
                            });
                        }else{
                            var commentId = mongodb.ObjectId()

                            database.collection("posts").updateOne({
                                "_id": mongodb.ObjectId(_id)
                            }, {
                                $push: {
                                    "comments":{
                                        "_id": commentId,
                                        "user":{
                                            "_id": user._id,
                                            "name": user.name,
                                            "profileImage": user.profileImage
                                        },
                                        "comment": comment,
                                        "createdAt": createdAt,
                                        "replies": []
                                    }
                                }
                            }, (err, data) =>{
                                if(user._id.toString() != post.user._id.toString()){
                                    database.collection("users").updateOne({
                                        "_id": post.user._id
                                    },{
                                        $push:{
                                            "notifications":{
                                                "_id": mongodb.ObjectId(),
                                                "type": "new_comment",
                                                "content": user.name + " commented on your post.",
                                                "profileImage": user.profileImage,
                                                "createdAt": new Date().getTime()
                                            }
                                        }
                                    })
                                }

                                database.collection("users").updateOne({
                                    $and: [{
                                        "_id": post.user._id
                                    },{
                                        "posts._id": post._id
                                    }]
                                },{
                                    $push:{
                                        "posts.$[].comments":{
                                            "_id": commentId,
                                            "user":{
                                                "_id": user._id,
                                                "name": user.name,
                                                "profileImage": user.profileImage
                                            },
                                            "comment": comment,
                                            "createdAt": createdAt,
                                            "replies": []
                                        }
                                    }
                                })
                                res.json({
                                    "status": "success",
                                    "message": "Comment has been posted"
                                })

                            })
                        }
                    })
                }
            })
         })

         router.post('/postReply', (req, res) =>{
            var accessToken = req.fields.accessToken;
            var postId = req.fields.postId;
            var commentId = req.fields.commentId;
            var reply = req.fields.reply;
            var createdAt = new Date().getTime();
            // console.log(accessToken);
            // console.log(postId);
            // console.log(commentId);
            // console.log(reply);
            // console.log(createdAt);

            database.collection('users').findOne({
                "accessToken": accessToken
            }, (err, user) =>{
                if(user == null){
                    res.json({
                        "status": "error",
                        "message": "User has been logged out. Please login again"
                    })
                }else{
                    database.collection("posts").findOne({
                        "_id": mongodb.ObjectId(postId)
                    },(err, post) =>{
                        if(post == null){
                            res.json({
                                "status": "error",
                                "message": "Post does not exist"
                            })
                        }else{
                            var replyId = mongodb.ObjectId();
                    database.collection('posts').updateOne({
                        $and: [{
                            "_id": mongodb.ObjectId(postId)
                        },{
                            "comments._id": mongodb.ObjectId(commentId)
                        }]
                    },{
                        $push:{
                            "comments.$.replies": {
                                "_id": replyId,
                                "user":{
                                    "_id": user._id,
                                    "name": user.name,
                                    "profileImage": user.profileImage
                                },
                                "reply": reply,
                                "createdAt": createdAt
                            }
                        }
                    }, (err, data) =>{
                        database.collection('users').updateOne({
                            $and: [{
                                "_id": post.user._id
                            },{
                                "posts._id": post._id
                            },{
                                "posts.comments._id": mongodb.ObjectId(commentId)
                            }]
                        },{
                            $push:{
                                "posts.$[].comments.$[].replies":{
                                    "_id": replyId,
                                    "user":{
                                        "_id":user._id,
                                        "name": user.name,
                                        "profileImage": user.profileImage
                                    },
                                    "reply": reply,
                                    "createdAt": createdAt
                                }
                            }
                        })
                        res.json({
                            "status":"success",
                            "message": "Reply has been posted"
                        })
                    })
                        }//sec else
                    })

                }
            })
            // res.json({
            //     "status": "success",
            //     "message": "Comment"
            // })
         })


         router.get("/search/:query",(req,res) =>{
            var query = req.params.query;
            res.render("search", {"query": query});
         })

        router.post("/search", (req, res) =>{
            var query = req.fields.query;
            database.collection("users").find({
                "name": {
                    $regex: ".*"+ query + ".*",
                    $options: "i"
                }
            }).toArray((err, data) =>{
                database.collection("pages").find({
                    "name":{
                        $regex: ".*"+ query + ".*",
                        $options: "i"
                    }
                }).toArray((err, pages) =>{
                    database.collection("groups").find({
                        "name":{
                            $regex: ".*"+ query + ".*",
                            $options: "i"
                        }
                    }).toArray((err, groups) =>{
                        res.json({
                            "status": "success",
                            "message": "Record has been fetched",
                            "data": data,
                            "pages": pages,
                            "groups": groups
                        });
                    });

                    
                })
            })
        })
        
        router.post('/sendFriendRequest', (req, res) =>{
            var accessToken = req.fields.accessToken;
            var _id = req.fields._id;

            database.collection("users").findOne({
                "accessToken": accessToken
            }, function(err, user) {
                if(user == null){
                    res.json({
                        "status": "error",
                        "message": "User has been logged out.please login again"
                    })
                }else{
                       var me = user;
                       database.collection("users").findOne({
                           "_id": mongodb.ObjectId(_id)
                       },(err, user) =>{//this will be conflict in future
                           if(user == null){
                               res.json({
                                   "status": "error",
                                   "message": "User does not exist"
                               })
                           }else{
                               database.collection("users").updateOne({
                                   "_id": mongodb.ObjectId(_id)
                               }, {
                                $push: {
                                    "friends": {
                                        "_id": me._id,
                                        "name": me.name,
                                        "profileImage": me.profileImage,
                                        "status": "Pending",
                                        "sentByMe": false,
                                        "inbox": []
                                    }
                                }

                               }, (error, data) =>{
                                    database.collection("users").updateOne({
                                        "_id": me._id
                                    }, {
                                        $push:{
                                            "friends":{
                                                "_id": user._id,
                                                "name": user.name,
                                                "profileImage": user.profileImage,
                                                "status": "Pending",
                                                "sentByMe": true,
                                                "inbox": []
                                            }
                                        }
                                    }, (error, data) =>{
                                        res.json({
                                            "status": "success",
                                            "message": "Friend request has been sent."
                                        })
                                    })
                               })
                           }
                       })
                }
            })
        })

        router.get("/friends", (req, res) =>{
            res.render('friends')
        })

        router.post("/acceptFriendRequest", (req, res) =>{
            var accessToken = req.fields.accessToken;
            var _id = req.fields._id;

            database.collection("users").findOne({
                "accessToken": accessToken
            }, (err, user) =>{
                if(user == null){
                    res.json({
                        "status": "error",
                        "message": "User has been logged out.please login again"
                    })
                }else{
                    var me = user;
                    database.collection("users").findOne({
                        "_id": mongodb.ObjectId(_id)
                    }, (err, user) =>{
                        if(user == null){
                            res.json({
                                "status": "error",
                                "message": "User does not exist."
                            })
                        }else{
                            database.collection("users").updateOne({
                                "_id": mongodb.ObjectId(_id)
                            },{
                                $push: {
                                    "notifications":{
                                        "_id": mongodb.ObjectId(),
                                        "type": "friend_request_accepted",
                                        "content": me.name + " accepted your friend request.",
                                        "profileImage": me.profileImage,
                                        "createdAt": new Date().getTime()
                                    }
                                }
                            })

                            database.collection("users").updateOne({
                                $and: [{
                                    "_id": mongodb.ObjectId(_id)
                                },{
                                    "friends._id": me._id
                                }]

                            },{
                                $set: {
                                    "friends.$.status": "Accepted"
                                }
                            }, (err, data) =>{
                                database.collection("users").updateOne({
                                    $and: [{
                                        "_id": me._id
                                    },{
                                        "friends._id": user._id
                                    }]
                                }, {
                                    $set: {
                                        "friends.$.status": "Accepted"
                                    }
                                },(err, data) =>{
                                    res.json({
                                        "status": "success",
                                        "message": "Friends request has been accepted."
                                    }) 
                                })
                            })


                        }
                    })
                }
            })
        })

        router.post("/unfriend", (req, res) =>{
            var accessToken = req.fields.accessToken;
            var _id = req.fields._id;
            database.collection("users").findOne({
                "accessToken": accessToken
            }, (err, user) =>{
                if(user == null){
                    res.json({
                        "status": "error",
                        "message": "Userb has been logged out.Please login again."
                    })
                }else{
                    var me = user;
                    database.collection("users").findOne({
                        "_id": mongodb.ObjectId(_id)
                    }, (err, user) =>{
                        if(user == null){
                            res.json({
                                "status": "error",
                                "message": "User does not exist."
                            })
                        }else{
                            database.collection("users").updateOne({
                                "_id": mongodb.ObjectId(_id)
                            }, {
                                $pull: {
                                    "friends": {
                                        "_id": me._id
                                    }
                                }
                            }, (err, data) =>{
                                database.collection("users").updateOne({
                                    "_id": me._id
                                },{
                                    $pull: {
                                        "friends":{
                                            "_id": user._id
                                        }
                                    }
                                }, (err, data) =>{
                                    res.json({
                                        "status": "success",
                                        "message": "Friend has been removed."
                                    })
                                })
                            })
                        }
                    })
                }
            })
        })


        router.get('/inbox', (req, res) =>{
            res.render('inbox');
        })

        router.post('/getFriendsChat', (req, res) =>{
            var accessToken = req.fields.accessToken;
            var _id = req.fields._id;

            database.collection("users").findOne({
                "accessToken": accessToken
            }, (error, user) =>{
                if(user == null){
                    res.json({
                        "status": "error",
                        "message": "User has been logged out.Please login again."
                    })
                }else{
                    var index = user.friends.findIndex((friend) =>{
                        return friend._id == _id
                    });
                    var inbox = user.friends[index].inbox;
                    // console.log("friend id", index, _id);
                    res.json({
                        "status": "success",
                        "message": "Record has been fetched",
                        "data": inbox
                    })

                }

            })
        })

        router.post("/sendMessage", (req, res) =>{
            var accessToken = req.fields.accessToken;
            var _id = req.fields._id;
            var message = req.fields.message;

            database.collection("users").findOne({
                "accessToken": accessToken
            }, (error, user) =>{
                if(user == null) {
                    res.json({
                        "status": "error",
                        "message": "Userb has been logged out.Please login again."
                    })
                }else{
                    var me = user;
                    database.collection("users").findOne({
                        "_id": mongodb.ObjectId(_id)
                    }, (error, user) =>{
                        if(user == null){
                            res.json({
                                "status": "error",
                                "message": "User does not exist."
                            })
                        }else{
                            // console.log("my friend", user, message);
                            database.collection("users").updateOne({
                                $and: [{
                                    "_id": mongodb.ObjectId(_id)
                                }, {
                                    "friends._id": me._id
                                }]
                            },{
                                $push: {
                                    "friends.$.inbox":{
                                        "_id": mongodb.ObjectId(),
                                        "message": message,
                                        "from": me._id
                                    }
                                }
                            },(error, data)=>{
                                database.collection("users").updateOne({
                                    $and: [{
                                        "_id": me._id
                                    },{
                                        "friends._id": user._id
                                    }]
                                },{
                                    $push:{
                                        "friends.$.inbox":{
                                            "_id": mongodb.ObjectId(),
                                            "message": message,
                                            "from": me._id
                                        }
                                    }
                                },(error, data) =>{
                                    // SocketIO.to
                                    const socketIO = req.app.get('socketio');

                                    socketIO.to(users[user._id]).emit("messageReceived",{
                                        "message": message,
                                        "from": me._id
                                    })//socket


                                    res.json({
                                        "status": "success",
                                        "message": "Message has been sent"
                                    })
                                })
                            })
                        }
                    })
                }
            })
        })

        router.post("/connectSocket", (req, res) =>{//socket
            var accessToken = req.fields.accessToken;
            database.collection("users").findOne({
                "accessToken": accessToken
            }, (error, user) =>{
                if(user == null){
                    res.json({
                        "status": "error",
                        "message": "User has been logged out.Please login again."
                    })
                }else{
                    const socketID = req.app.get('socketID');

                    users[user._id] = socketID;
                    res.json({
                        "status": "status",
                        "message": "Socket has been connected"

                    })
                }
            })
        })

        router.get('/createPage',(req, res) =>{
            res.render("createPage")
        })

        router.post("/createPage", (req, res) =>{
            var accessToken = req.fields.accessToken;
            var name = req.fields.name;
            var domainName = req.fields.domainName;
            var additionalInfo = req.fields.additionalInfo;
            var coverPhoto = "";

            database.collection("users").findOne({
                "accessToken": accessToken
            },(error, user) =>{
                if(user == null){
                    res.json({
                        "status": "error",
                        "message": "User has been logged out.please login again."
                    })
                }else{
                    if(req.files.coverPhoto.size > 0 && req.files.coverPhoto.type.includes("image")){
                        coverPhoto = "public/images/" + new Date().getTime() + "-"+ req.files.coverPhoto.name;
                        mv(req.files.coverPhoto.path, coverPhoto, (err) =>{
                            if (err) {
                                        console.log('> FileServer.jsx | route: "/files/upload" | err:', err);
                                        throw err;
                                    }
                        })
                        database.collection("pages").insertOne({
                            "name": name,
                            "domainName": domainName,
                            "additionalInfo": additionalInfo,
                            "coverPhoto": coverPhoto,
                            "likers":[],
                            "user":{
                                "_id": user._id,
                                "name": user.name,
                                "profileImage": user.profileImage
                            }
                        },(error, data) =>{
                            res.json({
                                "status": "success",
                                "message": "Page has been created."
                            })
                        })
                        
                    }else{
                        res.json({
                            "status": "error",
                            "message": "please select a cover photo"
                        })
                    }
                }
            })
        })

        router.get("/pages",(req, res) =>{
            res.render("pages")
        })

        router.post("/getPages", (req, res) =>{
            var accessToken = req.fields.accessToken;

            database.collection("users").findOne({
                "accessToken": accessToken
            },(error, user) =>{
                if(user == null){
                    res.json({
                        "status": "error",
                        "message": "User has been logged out,Please login again."
                    });
                }else{
                    database.collection("pages").find({
                        $or: [{
                            "user._id": user._id
                        },{
                            "likers._id": user._id
                        }]
                    }).toArray((error, data) =>{
                        res.json({
                            "status": "success",
                            "message": "Record has been fetched,",
                            "data": data
                        })
                    })
                }
            })
        })

        router.get("/page/:_id", (req, res) =>{
            var _id = req.params._id;
            database.collection("pages").findOne({
                "_id": mongodb.ObjectId(_id)
            },(error, page) =>{
                if(page == null){
                    res.json({
                        "status": "error",
                        "message": "Page does not exist"
                    })
                }else{
                    res.render("singlePage", {
                        "_id": _id
                    })
                }
            })

        })

        router.post("/getPageDetail",(req, res) =>{
            var _id =  req.fields._id;
            database.collection("pages").findOne({
                "_id": mongodb.ObjectId(_id)
            }, (error, page) =>{
                if(page == null){
                    res.json({
                        "status": "error",
                        "message": "Page does not exist"
                    })
                }else{
                    database.collection("posts").find({
                        $and: [{
                            "user._id": page._id
                        },{
                            "type": "page_post"
                        }]
                    }).toArray((error, posts) =>{
                        res.json({
                            "status": "success",
                            "message": "Record has been fetched.",
                            "data": page,
                            "posts": posts

                        })
                    })
                }
            })
        })

        router.post("/toggleLikePage", (req, res) =>{//recently created
            var accessToken = req.fields.accessToken;
            var _id = req.fields._id;
            database.collection("users").findOne({
                "accessToken": accessToken
            }, (error, user) =>{
                if(user == null){
                    res.json({
                        "status": "error",
                        "message": "User has been logged out. Please login again."
                    });
                }else{
                    database.collection("pages").findOne({
                        "_id": mongodb.ObjectId(_id)
                    },(error, page)=>{
                        if(page == null){
                            res.json({
                                 "status": "error",
                                "message": "Page does not exist."
                            })
                        }else{
                            var isLiked = false;
                            for(var a = 0; a< page.likers.length; a++){
                                var liker = page.likers[a];
                                if(liker._id.toString() == user._id.toString()){
                                    isLiked = true;
                                    break;
                                }
                            }
                            if(isLiked){
                                database.collection("pages").updateOne({
                                    "_id": mongodb.ObjectId(_id)
                                },{
                                    $pull:{
                                        "likers":{
                                            "_id": user._id
                                        }
                                    }
                                },(error, data) =>{
                                    database.collection("users").updateOne({
                                        "accessToken": accessToken
                                    },{
                                        $pull:{
                                            "pages":{
                                                "_id": mongodb.ObjectId(_id)
                                            }
                                        }
                                    },(error, data) =>{
                                         res.json({
                                             "status": "unliked",
                                             "message": "Page has been unliked"
                                         })
                                    })
                                })
                            }else{
                                database.collection("pages").updateOne({
                                    "_id": mongodb.ObjectId(_id)
                                }, {
                                    $push:{
                                        "likers":{
                                            "_id": user._id,
                                            "name": user.name,
                                            "coverPhoto": user.profileImage
                                        }
                                    }
                                },(error, data) =>{
                                  database.collection("users").updateOne({
                                      "accessToken": accessToken
                                  },{
                                      $push: {
                                      "pages":{
                                        "_id": page._id,
                                        "name": page.name,
                                        "coverPhoto": page.coverPhoto
                                      }
                                     }   
                                    
                                  },(error, data) =>{
                                      res.json({
                                          "status": "success",
                                          "message": "Page has been liked."
                                      })

                                  })
                                })
                            }

                        }
                    })
                }
            })
        })

        router.post("/getMyPages", (req, res) =>{
            var accessToken = req.fields.accessToken;

            database.collection("users").findOne({
                "accessToken": accessToken
            }, (error, user) =>{
                if(user == null){
                    res.json({
                        "status": "error",
                        "message": "User has been logged out,Please login again."
                    })
                }else{
                    database.collection("pages").find({
                        "user._id": user._id
                    }).toArray((error, data) =>{
                        res.json({
                            "status": "success",
                            "message": "Record has been fetched.",
                            "data": data
                        })
                    })
                }
            })
        })

        router.get("/createGroup",(req, res) =>{
            res.render("createGroup")
        })

        router.post("/createGroup",(req, res) =>{
            var accessToken = req.fields.accessToken;
            var name = req.fields.name;
            var additionalInfo = req.fields.additionalInfo;
            var coverPhoto = "";  

            database.collection("users").findOne({
                "accessToken": accessToken
            },(error, user) =>{
                if(user == null){
                    res.json({
                        "status":"error",
                        "message": "User has benn logged out.Please login again"
                    })
                }else{
                    if(req.files.coverPhoto.size > 0 && req.files.coverPhoto.type.includes("image")){
                        coverPhoto = "public/images/" + new Date().getTime() + "-"+ req.files.coverPhoto.name;
                        mv(req.files.coverPhoto.path, coverPhoto, (err) =>{
                            if (err) {
                                        console.log('> FileServer.jsx | route: "/files/upload" | err:', err);
                                        throw err;
                                    }
                        })
                        database.collection("groups").insertOne({
                            "name": name,
                            "additionalInfo": additionalInfo,
                            "coverPhoto": coverPhoto,
                            "members":[{
                                "_id": user._id,
                                "name": user.name,
                                "profileImage": user.profileImage,
                                "status": "Accepted"
                            }],
                            "user":{
                                "_id": user._id,
                                "name": user.name,
                                "profileImage": user.profileImage
                            }
                        },(error, data) =>{
                            database.collection("users").updateOne({
                                "accessToken": accessToken
                            },{
                                $push:{
                                    "groups":{
                                        "_id": data.insertedId,
                                        "name": name,
                                        "coverPhoto": coverPhoto,
                                        "status": "Accepted"
                                    }
                                }
                            },(error, data) =>{
                                res.json({
                                    "status": "success",
                                    "message": "Group has been created"
                                })
                            })
                        })

                    }else{
                        res.json({
                            "status":"error",
                            "message" : "Please select a cover photo."
                        })

                    }
                }
            })


        })


        router.get("/groups", (req, res) =>{
            res.render("groups");
        })

        router.post("/getGroups", (req, res) =>{
            accessToken = req.fields.accessToken;
            database.collection("users").findOne({
                "accessToken": accessToken
            },(err, user)=>{
                if(user == null){
                    res.json({
                        "status": "error",
                        "message": "User has been logged out.Please login again."
                    })
                }else{
                    database.collection("groups").find({
                        $or: [{
                            "user._id": user._id
                        },{
                            "members._id": user._id
                        }]
                    }).toArray((error, data) =>{
                        res.json({
                            "status": "success",
                            "message": "Record has been fetched.",
                            "data": data
                        })
                    })
                }
            })
        })

        router.get("/group/:_id",(req, res) =>{
            var  _id = req.params._id;

            database.collection("groups").findOne({
                "_id": mongodb.ObjectId(_id)
            },(error, group) =>{
                if(group == null){
                    res.json({
                        "status": "error",
                        "message": "Group does not exist."
                    })
                }else{
                    res.render("singleGroup", {"_id": _id});
                }
            })
        })

        router.post('/getGroupDetail', (req,res) =>{
            var _id = req.fields._id;
            database.collection("groups").findOne({
                "_id": mongodb.ObjectId(_id)
            },(error, group) =>{
                if(group == null){
                    res.json({
                        "status": "error",
                        "message": "Group does not exist."
                    });
                }else{
                    database.collection("posts").find({
                        $and:[{
                            "user._id": group._id
                        },{
                            "type": "group_post"
                        }]
                    }).toArray((error, posts) =>{
                        res.json({
                            "status": "success",
                            "message": "Record has been fetched.",
                            "data": group,
                            "posts": posts
                        })
                    })
                }
            })
        })

        router.post("/toggleJoinGroup", (req, res) =>{
            var accessToken = req.fields.accessToken;
            var _id = req.fields._id;

            database.collection("users").findOne({
                "accessToken": accessToken
            },(error, user) =>{
                if(user == null){
                    res.json({
                        "status": "error",
                        "message": "User has benn logged out.Please login again."
                    })
                }else{
                    database.collection("groups").findOne({
                        "_id": mongodb.ObjectId(_id)
                    }, (error, group) =>{
                        if (group == null) {
                            res.json({
                                "status": "error",
                                "message": "Group does not exist."
                            });
                        }else{
                            var isMember = false;
                            for(var a = 0; a< group.members.length; a++){
                                var member = group.members[a];
                                if(member._id.toString() == user._id.toString()){
                                    isMember = true;
                                    break;
                                }
                            }
                            if(isMember){
                                database.collection("groups").updateOne({
                                    "_id": mongodb.ObjectId(_id)
                                },
                                {
                                    $pull:{
                                        "members":{
                                            "_id": user._id,
                                        }
                                    }
                                },(error, data) =>{
                                    database.collection("users").updateOne({
                                        "accessToken": accessToken
                                    },{
                                        $pull: {
                                            "groups": {
                                                "_id": mongodb.ObjectId(_id)
                                            }
                                        }
                                    },(error, data) =>{
                                        res.json({
                                            "status": "leaved",
                                            "message": "Group has been left."
                                        })
                                    })
                                })
                            }else{


                                database.collection("groups").updateOne({
                                    "_id": mongodb.ObjectId(_id)
                                },
                                {
                                    $push:{
                                        "members":{
                                            "_id": user._id,
                                            "name": user.name,
                                            "profileImage": user.profileImage,
                                            "status": "Pending"
                                        }
                                    }
                                },(error, data) =>{
                                    database.collection("users").updateOne({
                                        "accessToken": accessToken
                                    },{
                                        $push: {
                                            "groups": {
                                                "_id": group._id,
                                                "name": group.name,
                                                "coverPhoto": group.coverPhoto,
                                                "status": "Pending"
                                            }
                                        }
                                    },(error, data) =>{
                                      database.collection("users").updateOne({
                                          "_id": group.user._id
                                      },{
                                          $push:{
                                              "notifications":{
                                                  "_id": mongodb.ObjectId(),
                                                  "type": "group_join_request",
                                                  "content": user.name + " sent a request to join your group",
                                                  "profileImage": user.profileImage,
                                                  "groupId": group._id,
                                                  "userId": user._id,//jyane join kelay tyacha user id
                                                  "status": "Pending",
                                                  "createdAt": new Date().getTime()
                                              }
                                          }
                                      })
                                      res.json({
                                        "status": "success",
                                        "message": "Request to join group has been sent."
                                    })
                                    })
                                })
                            }
                        }
                    })
                } 
            })
        })

        router.get("/notifications", (req, res) =>{
            res.render("notifications")
        })

    router.post("/acceptRequestJoinGroup", (req, res) =>{
        var accessToken = req.fields.accessToken;
        var _id = req.fields._id;
        var groupId = req.fields.groupId;
        var userId = req.fields.userId;

        database.collection("users").findOne({
            "accessToken": accessToken
        },(error, user) =>{
            if(user == null){
                res.json({
                    "status": "error", 
                    "message": "User has been logged out.Please login again."
                })
            }else{
                database.collection("groups").findOne({
                    "_id": mongodb.ObjectId(groupId)
                },(error, group) =>{
                    if (group == null) {
                        res.json({
                            "status": "error",
                            "message": "Group does not exist."
                        })
                    }else{
                        if (group.user._id.toString() != user._id.toString()) {
                            res.json({
                                "status": "error",
                                "message": "Sorry, you do not own this group."
                            })
                            return;
                        }
                        database.collection("groups").updateOne({
                            $and: [{
                                "_id": group._id
                            },{
                                "members._id": mongodb.ObjectId(userId)
                            }]
                        },{
                            $set: {
                                "members.$.status": "Accepted"
                            }
                        },(error, data) =>{
                            //has to be change.
                            database.collection("users").updateOne({
                                $and:[
                                    {"accessToken": accessToken},
                                    {"notifications._id": mongodb.ObjectId(_id)},
                                    // {"notifications.userId": userId}
                                ]
                            },{
                                $set:{
                                    "notifications.$.status": "Accepted"
                                }
                            },(error, data) =>{
                                database.collection("users").updateOne({
                                    $and: [
                                        {"_id": mongodb.ObjectId(userId)},
                                        {"groups._id": group._id}
                                    ]
                                },{
                                    $set:{
                                        "groups.$.status":  "Accepted"
                                    }
                                },(error, data) =>{
                                    res.json({
                                        "status": "success",
                                        "message": "Group join request has been accepted"
                                    })
                                })
                            })

                        })
                    }
                })
            }
        })
    })

    router.post("/rejectRequestJoinGroup",(req, res)=>{
        var accessToken = req.fields.accessToken;
        var _id = req.fields._id;
        var groupId = req.fields.groupId;
        var userId = req.fields.userId;

        database.collection("users").findOne({
            "accessToken": accessToken
        },(error, user) =>{
            if(user == null){
                res.json({
                    "status": "error",
                    "message": "User has been logged out.Please login again."
                })
            }else{
                database.collection("groups").findOne({
                    "_id": mongodb.ObjectId(groupId)
                },(error, group) =>{
                    if(group == null){
                        res.json({
                            "status": "error",
                            "message": "Group does not exist."
                        })
                    }else{
                        if (group.user._id.toString() != user._id.toString()) {
                            res.json({
                                "status": "error",
                                "message": "Sorry, you do not own this group."
                            })
                            return;
                        }
                        database.collection("groups").updateOne({
                            "_id": group._id
                        },{
                            $pull: {
                                "members":{
                                    "_id": mongodb.ObjectId(userId)
                                }
                            }
                        },(error, data) =>{
                            database.collection("users").updateOne({
                                $and : [{
                                "accessToken": accessToken
                            },{
                                "notifications.userId" : mongodb.ObjectId(userId)
                            }]
                            },{
                                $pull:{
                                    "notifications":{
                                        "_id" : mongodb.ObjectId(_id),
                                        "groupId": group._id,
                                        "userId" : mongodb.ObjectId(userId)
                                    }
                                }
                            },(error, data) =>{
                                database.collection("users").updateOne({
                                    "_id": mongodb.ObjectId(userId)
                                },{
                                    $pull:{
                                        "groups":{
                                            "_id": group._id
                                        }
                                    }
                                },(error, data)=>{
                                      res.json({
                                          "status": "success",
                                          "message": "Group join request has been rejected."
                                      })
                                })
                            })
                        } )
                    }
                })
            }
        })
    })

    router.get("/forget", (req, res) =>{
        res.render("forget")
    })
    router.post("/sendMail", (req, res) =>{
        const email = req.fields.email;

        database.collection("users").findOne({
            "email": email
        },(error, user) =>{
            // console.log(user)
            if(user == null){
                res.json({
                        "status": "error",
                        "message": "User does not exist"
                    })
            }else{
                var link = `${mainURL}/changepassword/${user.accessToken}/${user._id}`
                const message = {
                    to: user.email,
                    from: {
                        name: 'Social media',
                        email: 'borgedata@gmail.com'
                    },
                    subject: 'Reset Link',
                    text: `this is a text`,
                    // hrml: '<a>link is here</a>'
                    html: `<a href="${link}">Reset Link</a>`

                }
                sgMail
                    .send(message)
                    .then(sent =>{ console.log("EMail sent")
                    res.json({
                        "status": "success",
                        "message": "Mail sent successfully"
                    })
                    })
                    .catch(err => {
                        console.log(err.message)
                        res.json({
                            "status": "error",
                            "message": "failed to send mail"
                        })
                    })
            }
        })
    })


    router.get("/changepassword/:accessToken/:id",(req, res) =>{
        const _id = req.params.id;
        var email = null;
        database.collection("users").findOne({"_id": mongodb.ObjectId(_id)},(error, user) =>{
            if(user == null){
                res.json({
                    "status": "error",
                    "message": "User does not exist"
                })
            }else{
                email = user.email;
                res.render("forgetNewpassword",{"email": email, "_id": _id})
            }
            // res.render("singlePage", {
            //     "_id": _id
            // })
            
        })
        // ḍatabase.collection("users").findOne
    })

    router.post("/saveNewPassword",(req, res) =>{
        const _id = req.fields._id;
        const email = req.fields.email;
        const password = req.fields.password;
        const cpassword = req.fields.cpassword;
        console.log(_id,email,password,cpassword)
        if(password == cpassword){
            database.collection("users").find({
                $and: [{
                    "_id": mongodb.ObjectId(_id)
                },{
                    "email": email
                }]
            },(error, user) =>{
                if(user == null){
                    res.json({
                        "status": "error",
                        "message": "User does not exist"
                    })
                }else{
                    // console.log(user)
                    // res.json({
                    //     "status": "success",
                    //     "message": "Password updated successfully"
                    // })
                    bcrypt.hash(password, 10, (error, hash) =>{
                        database.collection('users').updateOne({
                            $and: [{
                                "_id": mongodb.ObjectId(_id)
                            },{
                                "email": email
                            }]
                        },{$set:{"password": hash}},(error, data) =>{
                            console.log(user)
                            res.json({
                                "status": "success",
                                "message": "Password updated successfully"
                            })
                        })
                    })

                }
            })
        }else{
            res.json({
                "status": "error",
                "message": "Password not matched"
            })
        }
    })


//store notification lengh while user logged out
router.post("/fetchNotificationLength", (req, res) =>{//storing notification length
    var accessToken = req.fields.accessToken;

    database.collection("users").findOne({
        "accessToken": accessToken
    },(error, user) =>{
        if(user == null){
            res.json({
                "status": "error",
                "message": "User has been logged out,Please login again."
            });
        }else{
            // console.log(user._id)
            database.collection("users").findOneAndUpdate({"_id": mongodb.ObjectId(user._id)}, {$set:{"notificationLength": user.notifications.length}},(error, data) =>{
                res.json({
                    "status": "success",
                    "message": "notification length updated successfully"
                })
            })  
           
        }
    })
})

//showing in left side bar
router.post("/updateNotificationLength", (req, res) =>{//fetching current notification length
    var accessToken = req.fields.accessToken;
   console.log("woknig now");
    database.collection("users").findOne({
        "accessToken": accessToken
    },(error, user) =>{
        if(user == null){
            console.log("error")
            res.json({
                "status": "error",
                "message": "User has been logged out,Please login again."
            });
        }else{

            // console.log(user.notifications.length)
            // database.collection("users").findOneAndUpdate({"_id": mongodb.ObjectId(user._id)}, {$set:{"notificationLength": user.notifications.length}},(error, data) =>{
                console.log("Notification lenght updated")
                res.json({
                    "status": "success",
                    "message": "notification length updated successfully",
                    "notLen": user.notifications.length,
                    "prevnotLen": user.notificationLength
                })
            
        
        }
    })
})

router.post("/fetchFriendsLength", (req, res) =>{//storing notification length
    var accessToken = req.fields.accessToken;

    database.collection("users").findOne({
        "accessToken": accessToken
    },(error, user) =>{
        if(user == null){
            res.json({
                "status": "error",
                "message": "User has been logged out,Please login again."
            });
        }else{
            // console.log(user._id)
            database.collection("users").findOneAndUpdate({"_id": mongodb.ObjectId(user._id)}, {$set:{"friendsLength": user.friends.length}},(error, data) =>{
                res.json({
                    "status": "success",
                    "message": "friends length updated successfully"
                })
            })  
           
        }
    })
})


router.post("/updateFriendsLength", (req, res) =>{//fetching current notification length
    var accessToken = req.fields.accessToken;
//    console.log("woknig now");
    database.collection("users").findOne({
        "accessToken": accessToken
    },(error, user) =>{
        if(user == null){
            console.log("error")
            res.json({
                "status": "error",
                "message": "User has been logged out,Please login again."
            });
        }else{

            // console.log(user.notifications.length)
            // database.collection("users").findOneAndUpdate({"_id": mongodb.ObjectId(user._id)}, {$set:{"notificationLength": user.notifications.length}},(error, data) =>{
                // console.log("Notification lenght updated")
                res.json({
                    "status": "success",
                    "message": "notification length updated successfully",
                    "notLen": user.friends.length,
                    "prevnotLen": user.friendsLength
                })
            
        
        }
    })
})


    router.post("/removeMember",(req,res)=>{
        // console.log(req.fields);
        var accessToken = req.fields.accessToken;//curruntly logged user or ADmin
        var groupOwner = req.fields.groupOwner;//owner of group and logged user or ADMIN
        var memberId = req.fields.memberId;//id of member to remove from groups
        var groupId = req.fields.groupId;//id of group
        database.collection("users").findOne({
            "accessToken": accessToken
        },(error, user)=>{
            if(user == null){
                res.json({
                    "status": "error",
                    "message": "User has been logged out,Please login again."
                });
            }else{
                if(user._id.toString() != groupOwner.toString()){
                    res.json({
                        "status": "error",
                        "message": "You are not an owner of this group."
                    });
                }else{
                        database.collection('groups').updateOne({
                            "_id": mongodb.ObjectId(groupId)
                        },{
                            $pull:{
                                "members":{
                                    "_id": mongodb.ObjectId(memberId)
                                }
                            }
                        },(error, data) =>{
                            database.collection("users").updateOne({
                                "_id": mongodb.ObjectId(memberId)
                            },{
                                $pull:{
                                    "groups":{
                                        "_id": mongodb.ObjectId(groupId)
                                    }
                                
                                }
                            },(error, data)=>{
                              database.collection("users").findOne({
                                  "_id": mongodb.ObjectId(groupOwner)
                              },(error, groupHead) =>{
                                  database.collection("users").updateOne({
                                      "_id": mongodb.ObjectId(memberId)
                                  },{
                                      $push:{
                                          "notifications":{
                                              "_id": mongodb.ObjectId(),
                                              "type": "removed_group",
                                              "content": groupHead.name + " removed you from group",
                                              "profileImage": groupHead.profileImage,
                                              "createdAt": new Date().getTime()
                                          }
                                      }
                                  },(error, data) =>{
                                      res.json({
                                          "status": "success",
                                          "message": "User removed successfully"
                                      })
                                  })
                              })  
                            })
                        })//
                }
            }
        })
    })



    
    router.post("/sharePost",function(req,res){

        var accessToken = req.fields.accessToken;
        var _id = req.fields._id;
        var type = "shared";
        var createdAt = new Date().getTime();

        database.collection("users").findOne({
            "accessToken":accessToken
        }, function(error,user){
            if(user==null){
                res.json({
                    "status":"error",
                    "message":"user has been logged out.please login again"
                })
            }

            else{
                database.collection("posts").findOne({
                    "_id":mongodb.ObjectId(_id)
                },
                function(error,post){
                    if(post==null){
                        res.json({
                            "status":"error",
                            "message":"post does not exists"
                        })
                    }
                    else{

                        database.collection("posts").updateOne({
                            "id": mongodb.ObjectId(_id)
                        },
                        
                        {
                            $push:{
                                "shares":{
                                    "_id":user._id,
                                    "name":user.name,
                                    "profileImage":user.profileImage
                                }
                            }
                        }, function (error, data){
                            database.collection("posts").insertOne({
                                "caption":post.caption,
                                "image":post.image,
                                "video":post.video,
                                "type":type,
                                "createdAt":createdAt,
                                "likers":[],
                                "comments":[],
                                "shares":[],
                                "user":{
                                    "_id":user._id,
                                    "name":user.name,
                                    "gender":user.gender,
                                    "profileImage":user.profileImage
                                }
                            },
                            
                            
                            function(error,data){
                               database.collection("users").updateOne({
                                $and:[{
                                    "_id":post.user._id
                                },{
                                    "posts._id":post._id

                                }]
                               },
                               
                               
                               {
                                   $push:{
                                       "post.$[].shares":{
                                           "_id":user._id,
                                           "name":user.name,
                                           "profileImage":user.profileImage
                                       }
                                   }
                               });

                               res.json({
                                   "status":"success",
                                   "message":"posts has been shared."
                               });
                            });
                            
                        });
                       
                    }
                });
               
            }
        })
    

    });

    router.get("/user/:id",(req, res) =>{
        var _id = req.params.id;
        console.log(_id)
        database.collection("users").findOne({
            "_id": mongodb.ObjectID(_id)
        },(error,user) =>{
            console.log(user)
            if(user == null){
                res.end("user not found in database");
            }else{
                res.render("userDetails", {"user": user, "coverPhoto": mainURL+'/'+user.coverPhoto,"profilePhoto": mainURL+'/'+user.profileImage})
            }
        })

    })

    router.post("/getMyPosts",(req, res) =>{

        var accessToken = req.fields.accessToken;

             database.collection("users").findOne({
                 "accessToken": accessToken
             },(err, user) =>{
                 if (user == null) {
                     res.json({
                         "status":"error",
                         "message":"User has been logged out.Please login again"
                     })
                 }else{
                     var ids = [];
                     ids.push(user._id);
                    // for(var a = 0; a< user.pages.length; a++){
                    //     ids.push(user.pages[a]._id)
                    // }//this for loop[ fetched post from liked pages of its friends]
                    
                    // for(var a = 0; a< user.groups.length; a++){
                    //     if(user.groups[a].status == "Accepted"){
                    //         ids.push(user.groups[a]._id)
                    //     }   
                    // }
                    // for(var a = 0; a< user.friends.length; a++){
                    //     ids.push(user.friends[a]._id)
                    // }//this for loop[ fetched post from liked pages of its frieds]
                    
                    database.collection("posts").find({
                         "user._id":{
                             $in: ids
                         }
                     }).sort({
                         "createdAt": -1
                     }).limit(15).toArray((err, data) =>{
                         res.json({
                             "status":"success",
                             "message":"Record has been fetched",
                             "data": data
                         })
                     })

                 }
             })

    })
 
    router.post("/deletePost",(req, res) =>{
        var accessToken = req.fields.accessToken;
        var postId = req.fields.postId;

         database.collection("users").findOne({
             "accessToken": accessToken
         },(error, user) =>{
             if(user == null){
                res.json({
                    "status":"error",
                    "message":"User has been logged out.Please login again"
                })
             }else{
                //  console.log(postId);
                database.collection("users").updateOne({
                    $and:[{
                        "_id": user._id
                    },{
                        "posts._id": mongodb.ObjectID(postId)
                    }]
                },{
                    $pull:{
                        "posts":{
                            "_id":  mongodb.ObjectID(postId)
                        }
                    }
                },(error, data) =>{
                    database.collection("posts").findOneAndDelete({
                        "_id": mongodb.ObjectID(postId)
                    },(error,data) =>{
                        res.json({
                            "status":"success",
                            "message":"delete this post"
                        })
                    })
                })
                 
             }
         })

    })




});//this is main paranthesis plz dont touch this


module.exports = router