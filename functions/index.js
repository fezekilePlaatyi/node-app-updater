const functions = require('firebase-functions')
const express = require("express") 
const path = require("path") 
const app = express() 
const uploadHandler = require('./Utilities/upload.js')
app.set("views",path.join(__dirname,"views")) 
app.set("view engine","ejs") 
app.use(express.static('public'))
require('dotenv').config()
const PORT = 6000
    
app.post('/uploadAPK', uploadHandler.uploadFile)

app.get("/index",async function(req,res) { 
    res.render("index"); 
}) 

app.get("/",async function(req,res) { 
    res.render("login"); 
}) 

app.get("/upload",function(req,res){ 
    res.render("uploadPackage"); 
}) 

app.listen(3000,function(error) { 
    if(error) {
        console.log(`Error Starting a server ${error}`)
    } else {
        console.log(`Server created Successfully on PORT ${PORT}`) 
    }
}) 

exports.production = functions.https.onRequest(app)