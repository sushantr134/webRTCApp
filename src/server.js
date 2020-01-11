module.exports = () => {
  const express = require("express");
  const app = express();
  const path = require("path");

  app.set("view engine", "ejs");
  app.use(express.static(__dirname));

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });

  app.get("/viewlive", (req, res) => {
    res.sendFile(path.join(__dirname, "viewlive.html"));
  });

  app.listen(5000, err => {
    if (err) throw err;
    console.log("started server at ", 5000);
  });
};
