const express = require("express");
const dotenv = require("dotenv").config();
const bp = require("body-parser");
const AWS = require("aws-sdk");
const multer = require("multer");
const multer3 = require("multer-s3");
const path = require("path");
const ejs = require("ejs");
// const handlebars = require("handlebars");
// const hbs = require("express-handlebars")
const collectionimgs = [
  { id: "chris2.jpg", name: "chrisE" },
  { id: "chrisH.jpg", name: "chrisH" },
  { id: "constance.jpg", name: "constance" },
  { id: "lucy.jpg", name: "lucy" }
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

app.set("view engine", "ejs");

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
        CollectionId: "rekogtest",
        DetectionAttributes: [],
        ExternalImageId: x.name,
        Image: {
          S3Object: {
            Bucket: "jehaws",
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
      CollectionId: "rekogtest",
      FaceMatchThreshold: 0,
      Image: {
        S3Object: {
          Bucket: "jehaws",
          Name: keyName
        }
      }
    },
    (err, data) => {
      let resultArr = [];
      if (err) {
        console.log(err, err.stack);
      } else {
        console.log("Comparion DATA", data.FaceMatches[0].Face.ExternalImageId);
        console.log(data.FaceMatches.length);
        data.FaceMatches.forEach(x => {
          let resultObj = {};
          resultObj.Similarity = x.Similarity.toFixed(2) + "%";
          resultObj.Id = x.Face.ExternalImageId;
          console.log(resultObj);
          resultArr.push(resultObj);
        });
        console.log(resultArr);
      }

      // res.render("compare.ejs", { data: JSON.stringify(data.FaceMatches) });
      res.render("compare.ejs", { data: resultArr });
    }
  );
});

app.listen(PORT, () => {
  console.log("Port is listening..");
});
