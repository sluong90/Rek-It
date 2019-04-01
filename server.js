const express = require("express");
const dotenv = require("dotenv").config();
const bp = require("body-parser");
const AWS = require("aws-sdk");
const multer = require("multer");
const multer3 = require("multer-s3");
const path = require("path");
// const handlebars = require("handlebars");
// const hbs = require("express-handlebars")
const collectionimgs = [
  { id: "ariana.jpg", name: "ArianaG" },
  { id: "justinB.jpg", name: "JustinB" },
  { id: "psy.jpeg", name: "Psy" },
  { id: "taylorS.jpg", name: "TaylorS" }
];

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

// let params = {
//   CollectionId: process.env.AWS_COLLECTION_ID,
//   DetectionAttributes: [],
//   ExternalImageId: "CE1",
//   Image: {
//     S3Object: {
//       Bucket: "rekit-test",
//       Name: "CE1.jpg"
//     }
//   }
// };


const indexCollection = arr => {
  arr.forEach(x => {
    rekognition.indexFaces(
      {
        CollectionId: "rekit-test",
        DetectionAttributes: [],
        ExternalImageId: x.name,
        Image: {
          S3Object: {
            Bucket: "rekit-test",
            Name: x.id
          }
        }
      },
      (err, data) => {
        if (err) {
          console.log(err, err.stack); //error occurred;
        } else {
          console.log(x.name); //sucessfull response
        }
      }
    );
  });
};

indexCollection(collectionimgs);



const upload = multer({
  storage: multer3({
    s3: s3,
    bucket: "rekit-test",
    acl: "public-read",
    metadata: function(req, file, cb) {
      cb(null, { fieldname: "TestPicture" });
    },
    key: function(req, file, cb) {
      cb(null, Date.now().toString());
    }
  })
});


app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/", upload.single("photos"), function(req, res, next) {
  keyName = req.file.key;
  // console.log(keyName);
  res.redirect("/compare");
});


app.get("/compare", (req, res) => {
  rekognition.searchFacesByImage(
    {
      CollectionId: "rekit-test",
      FaceMatchThreshold: 0,
      Image: {
        S3Object: {
          Bucket: "rekit-test",
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
      res.send(data.FaceMatches);
    }
  );
});
app.listen(PORT, () => {
  console.log("Port is listening..");
});
