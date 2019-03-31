const express = require("express");
const dotenv = require("dotenv").config();
const bp = require("body-parser");
const AWS = require("aws-sdk");
const multer = require("multer");
const multer3 = require("multer-s3");
const path = require("path");
// const handlebars = require("handlebars");
// const hbs = require("express-handlebars")

AWS.config.update({
  region: "us-west-2",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const rekognition = new AWS.Rekognition();
const s3 = new AWS.S3();
const PORT = process.env.EXPRESS_CONTAINER_PORT || 8080;
let keyName;

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(bp.json());
app.use(bp.urlencoded({ extended: false }));

let params = {
  CollectionId: process.env.AWS_COLLECTION_ID,
  DetectionAttributes: [],
  ExternalImageId: "Chris",
  Image: {
    S3Object: {
      Bucket: "jehaws",
      Name: "chris.jpg"
    }
  }
};

let searchParams = {
  CollectionId: process.env.AWS_COLLECTION_ID,
  Image: {
    S3Object: {
      Bucket: "jehaws",
      Name: "1554000853715"
    }
  }
};

const upload = multer({
  storage: multer3({
    s3: s3,
    bucket: "jehaws",
    acl: "public-read",
    metadata: function(req, file, cb) {
      cb(null, { fieldname: "TestPicture" });
    },
    key: function(req, file, cb) {
      cb(null, Date.now().toString());
    }
  })
});

rekognition.indexFaces(params, (err, data) => {
  if (err) {
    console.log(err, err.stack); //error occurred;
  } else {
    console.log(data.FaceRecords[0].FaceDetail.Pose); //sucessfull response
  }
});

// rekognition.searchFacesByImage(searchParams, (err, data) => {
//   if (err) {
//     console.log(err, err.stack);
//   } else {
//     console.log(data);
//   }
// });

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/", upload.single("photos"), function(req, res, next) {
  keyName = req.file.key;
  // console.log(keyName);
  res.redirect("/compare");
});
// let keyName = req.file.key.toString();
// let keyName = "IMG_2123.jpg";
// console.log(keyName);
// app.post("/upload", (req, res) => {
//  console.log("hello");
//  singleUpload(req, res, function(err) {
//    return res.json({ "image-url": req.file });
//  });
// });

app.get("/compare", (req, res) => {
  rekognition.searchFacesByImage(
    {
      CollectionId: process.env.AWS_COLLECTION_ID,
      Image: {
        S3Object: {
          Bucket: "jehaws",
          Name: keyName
        }
      }
    },
    (err, data) => {
      if (err) {
        console.log(err, err.stack);
      } else {
        console.log("Comparion DATA", data);
      }
      res.send(data);
    }
  );
});
app.listen(PORT, () => {
  console.log("Port is listening..");
});
