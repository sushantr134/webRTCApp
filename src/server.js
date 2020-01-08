const express = require("express");
const serverApp = express();
const path = require("path");
const https = require("https");
const fs = require("fs");

serverApp.set("view engine", "ejs");

serverApp.use(express.static(__dirname));
serverApp.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
serverApp.get("/viewlive", (req, res) => {
  res.render("./viewlive.ejs");
});

const credentials = {
  // key: fs.readFileSync(path.join(__dirname, "server.key"), "utf8"),
  // cert: fs.readFileSync(path.join(__dirname, "server.cert"), "utf8")
};

let server;
let port;
if (credentials !== {}) {
  const http = require("http");
  server = http.createServer(serverApp);
  port = 8443;
} else {
  server = https.createServer(credentials, serverApp);
  port = 443;
}

module.exports = { server, port };
