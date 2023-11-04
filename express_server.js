const express = require("express");
const morgan = require("morgan");
const app = express();
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { getUserByEmail, urlsForUser, generateRandomString } = require("./helpers");

const PORT = 8080; // default port
app.set("view engine", "ejs");

//////////////////
// databases
//////////////////

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

// database of users, i should add an extra input for a nickname using the id. tho its not whats asked
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  aJ48lW: {
    id: "aJ48lW",
    email: "user2@example.com",
    password: "dishwasher-funk",
  }
};

/////////////////

app.use(morgan("dev"));
//app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: "session",
  keys: ["Slander", "Hofman", "Liftoff"],
  maxAge: 12 * 60 * 60 * 1000 // 12 hours
}));

// main urls
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// prints database to page in json format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

////////////////////////
// authentication urls
////////////////////////

app.get("/login", (req, res) => {
  const user = req.session.user_id;

  if (user) {
    res.redirect("/urls");
  } else {
    const templateVars = { userId: users[user] };
    res.render("login", templateVars);
  }
});

app.post("/login", (req, res) => {
  // if email exists in database and password equal the same in the database then logs in and gives cookie.
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("<p>Code 400: Email or password empty. Make sure they are both filled.</p>");
  }

  const userID = getUserByEmail(email, users);
  if (!userID) {
    return res.status(403).send("<p>No user by that email</p>");
  }

  const rightPass = bcrypt.compareSync(password, users[userID].password,);
  if (!rightPass) {
    return res.status(403).send("<p>Wrong password</p>");
  }

  req.session.user_id = userID;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// registration page
app.get("/register", (req, res) => {
  const user = req.session.user_id;

  if (user) {
    res.redirect("/urls");
  } else {
    const templateVars = { userId: users[user] };
    res.render("register", templateVars);
  }
});

////////////////////////

// hello world page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const user = req.session.user_id;
  const urls = urlsForUser(user, urlDatabase);
  const templateVars = { userId: users[user], urls };
  res.render("urls_index", templateVars);
});

// page with a form a user could fill and add to the database
app.get("/urls/new", (req, res) => {
  const user = req.session.user_id;

  if (!user) {
    res.redirect("/login");
  } else {
    const templateVars = { userId: users[user], urls: urlDatabase };
    res.render("urls_new", templateVars);
  }
});

// add new url to database
app.post("/urls/:id", (req, res) => {
  const { id } = req.params;
  const user = req.session.user_id;
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
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  const user = req.session.user_id;
  const { id } = req.params;

  if (!user) {
    return res.status(403).send("Need to be logged in to use this page.");
  }
  if (!urlsForUser(user, urlDatabase)[id]) {
    return res.status(403).send("Page not available to user");
  }

  const templateVars = { userId: users[user], id, longURL: urlDatabase[id].longURL };
  res.render("urls_show", templateVars);
});

// delete url in database
app.post("/urls/:id/delete", (req, res) => {
  const user = req.session.user_id;
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
app.post("/urls", (req, res) => {
  const userID = req.session.user_id;

  if (!userID) {
    res.send("Cannot shorten urls until logged in");
  } else {
    const shortUrl = generateRandomString(6);
    urlDatabase[shortUrl] = { longURL: req.body.longURL, userID };
    res.redirect(`/urls/${shortUrl}`);
  }
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;

  if (longURL) {
    res.redirect(longURL);
  } else res.send("Url does not exist.");
});

// adds new user to users database
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  // error handling for when either password or email is empty
  if (!email || !password) {
    res.status(400).send("<p>Code 400: Email or password empty. Make sure they are both filled.<p>");
  } else if (getUserByEmail(email, users)) {
    res.status(400).send("<p>Code 400: Email exists in database already.</p>");
  } else {
    const newId = generateRandomString(6);
    const salt = bcrypt.genSaltSync(10);
    const hashedPass = bcrypt.hashSync(password, salt);

    // assign new user to user database
    users[newId] = { id: newId, email, password: hashedPass };
    req.session.user_id = newId;
  }
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
