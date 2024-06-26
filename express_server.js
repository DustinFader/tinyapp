const express = require("express");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const morgan = require("morgan");
const methodOverride = require("method-override");
const { users, urlDatabase } = require("./db/databases");

const app = express();

const { 
  getUserByEmail, 
  urlsForUser, 
  generateRandomString 
} = require("./helpers");

const PORT = 8080; // default port
app.set("view engine", "ejs");

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(cookieSession({
  name: "session",
  keys: ["Slander", "Hofman", "Liftoff"],
  maxAge: 12 * 60 * 60 * 1000 // 12 hours
}));

// main urls
app.get("/", (req, res) => {
  res.redirect("/login");
});

// prints database to page in json format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

////////////////////////
// authentication urls
////////////////////////

app.get("/login", (req, res) => {
  const user = req.session.user;

  if (user) {
    return res.redirect("/urls");
  }

  const templateVars = { userId: users[user] };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  // if email exists in database and password equal the same in the database then logs in and gives cookie.
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(403).send("<p>Code 403: Email or password empty. Make sure they are both filled.</p>");
  }

  const userID = getUserByEmail(email, users);
  if (!userID) {
    return res.status(403).send("<p>No user by that email</p>");
  }

  const rightPass = bcrypt.compareSync(password, users[userID].password,);
  if (!rightPass) {
    return res.status(403).send("<p>Wrong password</p>");
  }

  req.session.user = userID;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// registration page
app.get("/register", (req, res) => {
  const user = req.session.user;

  if (user) {
    return res.redirect("/urls");
  }

  const templateVars = { userId: users[user] };
  res.render("register", templateVars);
});

// adds new user to users database
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  // error handling for when either password or email is empty
  if (!email || !password) {
    return res.status(400).send("<p>Code 400: Email or password empty. Make sure they are both filled.<p>");
  }

  if (getUserByEmail(email, users)) {
    return res.status(400).send("<p>Code 400: Email exists in database already.</p>");
  }

  const newId = generateRandomString(6);
  const salt = bcrypt.genSaltSync(10);
  const hashedPass = bcrypt.hashSync(password, salt);
  // assign new user to user database
  users[newId] = { id: newId, email, password: hashedPass };
  req.session.user = newId;

  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

////////////////////////

// hello world page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.status(403).send("You need to be logged in to view this page.");
  }
  const urls = urlsForUser(user, urlDatabase);
  const templateVars = { userId: users[user], urls };
  res.render("urls_index", templateVars);
});

// page with a form a user could fill and add to the database
app.get("/urls/new", (req, res) => {
  const user = req.session.user;

  if (!user) {
    return res.redirect("/login");
  }

  const templateVars = { userId: users[user], urls: urlDatabase };
  res.render("urls_new", templateVars);
});

// updates url in database
app.put("/urls/:id", (req, res) => {
  const { id } = req.params;
  const user = req.session.user;
  const { newLongUrl } = req.body;

  if (!id) {
    return res.status(400).send("End point does not exist, try another.");
  }

  if (!user) {
    return res.status(403).send("Need to be logged in.");
  }

  if (urlDatabase[id].userID !== user) {
    return res.status(403).send("Url does not belong to you.");
  }

  urlDatabase[id].longURL = newLongUrl;
  urlDatabase[id].created = new Date();
  urlDatabase[id].visited = [];
  urlDatabase[id].uniqueVisited = [];
  res.redirect("/urls");
});

// short url creation/edit page
app.get("/urls/:id", (req, res) => {
  const user = req.session.user;
  const { id } = req.params;

  if (!user) {
    return res.status(403).send("Need to be logged in to use this page.");
  }

  if (!urlDatabase[id] || !urlsForUser(user, urlDatabase)[id]) {
    return res.status(404).send("URL not found.");
  }

  const { longURL, visited, uniqueVisited } = urlDatabase[id];
  const templateVars = { userId: users[user], id, longURL, visited, uniqueVisited };
  res.render("urls_show", templateVars);
});

// delete url in database
app.delete("/urls/:id", (req, res) => {
  const user = req.session.user;
  const { id } = req.params;

  if (!urlDatabase[id]) {
    return res.status(400).send("Id does not exist try another.");
  }
  if (!user) {
    return res.status(403).send("Need to be logged in.");
  }
  if (urlDatabase[id].userID !== user) {
    return res.status(403).send("Url does not belong to you.");
  }

  delete urlDatabase[id];
  res.redirect("/urls");
});

// adds recieved input from /urls/new form into database
app.put("/urls", (req, res) => {
  const userID = req.session.user;

  if (!userID) {
    return res.send("Cannot shorten urls until logged in");
  }

  const shortUrl = generateRandomString(6);
  urlDatabase[shortUrl] = { longURL: req.body.longURL, userID, created: new Date(), visited: [], uniqueVisited: [] };
  res.redirect(`/urls/${shortUrl}`);
});

// redirects the user to the short links site when they click the short url
app.get("/u/:id", (req, res) => {
  const db = urlDatabase[req.params.id];
  if (!db || !db.longURL) {
    return res.status(404).send("URL not found.");
  }
  const longURL = db.longURL;
  const user = req.session.user;
  db.visited.push({ timestamp: new Date, user });
  if (!db.uniqueVisited.find((cookie) => cookie === user)) {
    db.uniqueVisited.push(user);
  }
  res.redirect(longURL);
});

module.exports = app;