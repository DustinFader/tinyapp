const express = require("express");
const morgan = require("morgan");
const app = express();
const cookieParser = require("cookie-parser");

const PORT = 8080; // default port
app.set("view engine", "ejs");

//////////////////
// test databases
//////////////////

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

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

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

/////////////////

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

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
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  } else {
    const templateVars = { userId: users[req.cookies["user_id"]] };
    res.render("login", templateVars);
  }
});

app.post("/login", (req, res) => {
  // if email passed is in database then
  // if password equal the same in the database then logs in and gives cookie
  // else return 400 code
  const { email, password } = req.body;
  const user = getUserByEmail(email);

  if (!email || !password) {
    res.status(400).end("<p>Code 400: Email or password empty. Make sure they are both filled.</p>");
  }

  if (!user) {
    res.status(403).end("<p>No user by that email</p>");
  } else if (users[user].password !== password) {
    res.status(403).end("<p>Wrong password</p>");
  }

  res.cookie("user_id", user);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// registration page
app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  } else {
    const templateVars = { userId: users[req.cookies["user_id"]] };
    res.render("register", templateVars);
  }
});

////////////////////////

// hello world page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { userId: users[req.cookies["user_id"]], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// page with a form a user could fill and add to the database
app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  } else {
    const templateVars = { userId: users[req.cookies["user_id"]], urls: urlDatabase };
    res.render("urls_new", templateVars);
  }
});

// add new url to database
app.post("/urls/:id", (req, res) => {
  const { newLongUrl } = req.body;
  const { id } = req.params;
  urlDatabase[id].longURL = newLongUrl;
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { userId: users[req.cookies["user_id"]], id: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  res.render("urls_show", templateVars);
});

// delete url in database
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// adds recieved input from /urls/new form into database
app.post("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
  if (!userID) {
    res.send("Cannot shorten urls until logged in");
  } else {
    const shortUrl = generateRandomString(6);
    urlDatabase[shortUrl] = { longURL: req.body.longURL, userID};
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
    res.status(400).end("<p>Code 400: Email or password empty. Make sure they are both filled.<p>");
  }

  // also if email exists already then return code 400 as well.
  if (getUserByEmail(email)) {
    res.status(400).end("<p>Code 400: Email exists in database already.</p>");
  }

  const newId = generateRandomString(6);
  users[newId] = { id: newId, email, password };

  res.cookie("user_id", newId);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const getUserByEmail = (email) => {
  // loops through users database
  // checking if each users email matches the email being used
  // if it matches then returns the emails user id else false
  for (let user in users) {
    if (users[user].email === email) {
      return user;
    }
  }
  return false;
};

const urlsForUser = (id) => {
  let urls = {};
  for (let short in urlDatabase) {
    if (urlDatabase[short].userID === id) {
      urls[short] = urlDatabase[short];
    }
  }
  return urls;
};

// based on https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript?rq=1
const generateRandomString = (maxLength) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < maxLength; i++) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }
  return result;
};
