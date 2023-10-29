const express = require("express");
const app = express();
const PORT = 8080; // default port
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// main urls
app.get("/", (req, res) => {
  res.send("Hello!");
});

// prints database to page in json format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// authentication urls
app.post("/login", (req, res) => {
  res.cookie("user_id", req.body.user_id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// hello world page
app.get("/hello", (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get("/urls", (req, res) => {
  const templateVars = { userId: users[req.cookies["user_id"]], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// page with a form a user could fill and add to the database
app.get("/urls/new", (req, res) => {
  const templateVars = { userId: users[req.cookies["user_id"]], urls: urlDatabase };
  res.render("urls_new", templateVars);
});

// add new url to database
app.post("/urls/:id", (req, res) => {
  const { newLongUrl } = req.body;
  const { id } = req.params;
  urlDatabase[id] = newLongUrl;
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { userId: users[req.cookies["user_id"]], id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

// delete url in database
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// adds recieved input from /urls/new form into database
app.post("/urls", (req, res) => {
  const shortUrl = generateRandomString();
  urlDatabase[shortUrl] = req.body.longURL;
  res.redirect(`/urls/${shortUrl}`);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// adds new user to users database
app.post("/register", (req, res) => {
  // error handling for when either password or email is empty
  // pass back 400 when error
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send("Code 400: Email or password empty. Make sure they are both filled.")
  }
  // also if email exists already then return code 400 as well.
  if (getUserByEmail(email)) {
    res.status(400).send("Code 400: Email exists in database already.")
  }
  const newId = generateRandomString()
  users[newId] = { id: newId, email, password }
  console.log(users)
  res.cookie("user_id", newId);
  res.redirect("/urls");
});

// registration page
app.get("/register", (req, res) => {
  const templateVars = { userId: users[req.cookies["user_id"]], id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("register", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const getUserByEmail = (email) => {
  // loops through users database
  // checking if each users email matches the email being used
  // if it doesnt exist in any user object then return true
  // else false
  for (let user in users) {
    if (user.email === email) {
      return false;
    }
  }
  return true;
}

// based on https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript?rq=1
const generateRandomString = (maxLength=6) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < maxLength; i++) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }
  return result;
};
