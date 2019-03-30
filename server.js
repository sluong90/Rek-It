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
const PORT = process.env.EXPRESS_CONTAINER_PORT;
const collectid = process.env.AWS_COLLECTION_ID;

const app = express();

app.use("*/css", express.static(__dirname + "/public/css"));

let params = {
  CollectionId: collectid,
  DetectionAttributes: [],
  ExternalImageId: "Jennifer",
  Image: {
    S3Object: {
      Bucket: "jehaws",
      Name: "IMG_2123.jpg"
    }
  }
};

let searchParams = {
  CollectionId: collectid,
  Image: {
    S3Object: {
      Bucket: "jehaws",
      Name: "test1.jpg"
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

rekognition.searchFacesByImage(searchParams, (err, data) => {
  if (err) {
    console.log(err, err.stack);
  } else {
    console.log("search results", data.FaceMatches);
    console.log("name", data.FaceMatches[0].Face.ExternalImageId);
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Listening on PORT  ${PORT}`);
});
