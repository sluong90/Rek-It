const express = require("express");
const dotenv = require("dotenv");
const session = require("express-session");
const bp = require("body-parser");
const RedisStore = require("connect-redis")(session);

//AWS initialize
const AWS = require("aws-sdk");
const multer = require("multer");
const multer3 = require("multer-s3");
var path = require('path');

AWS.config.update({
    region: "us-west-2",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const rekognition = new AWS.Rekognition();
const s3 = new AWS.S3();
const PORT = process.env.EXPRESS_CONTAINER_PORT || 8080

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bp.json());

let params = {
    CollectionId: "rekit-test",
    DetectionAttributes: [],
    ExternalImageId: "CE1",
    Image: {
      S3Object: {
        Bucket: "rekit-test",
        Name: "CE1.jpg"
      }
    }
   };

let searchParams = {
    CollectionId: "rekit-test",
    Image: {
        S3Object: {
            Bucket: "rekit-test",
            Name: "CE2.jpg"
        }
    }
    
};

   rekognition.indexFaces(params, (err, data) => {
    if (err) {
      console.log(err, err.stack); //error occurred;
    } else {
      console.log(data.FaceRecords[0].FaceDetail.Pose); //sucessfull response
    }
   });

   rekognition.searchFacesByImage(searchParams, (err,data) => {
       if(err) {
           console.log(err, err.stack);
       }else{
           console.log(data)
       }
   })

   app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
   })

const upload = multer({
 storage: multer3({
   s3: s3,
   bucket: "rekit-test",
   acl: "public-read",
   metadata: function(req, file, cb) {
     cb(null, { fieldname: "TESTING METADATA!" });
   },
   key: function(req, file, cb) {
     cb(null, Date.now().toString());
   }
 })
});

const singleUpload = upload.single("image");

app.post("/upload", (req, res) => {
 console.log("hello");
 singleUpload(req, res, function(err) {
   return res.json({ "image-url": req.file });
 });
});





app.listen(PORT, () => {
    console.log("Port is listening..")
})
