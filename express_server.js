const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session')
const PORT = process.env.PORT || 8080; //defaults to port 8080
//tells express app to use EJS as its templating engine
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.use(cookieSession({
  name: 'session',
  keys: ['user_id'],
}));

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: 'userRandomID' },
  "9sm5xK": { longURL: "http://www.google.com", userID: 'userRandomID'},
  "aabbaa": { longURL: "http://www.lighthouselabs.ca", userID:'user2RandomID'},
  "xxyyzz": { longURL: "http://www.google.com", userID: "user2RandomID"},
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2a$10$4p4eErzF5d6TTOhgEmalR.zR0ru8vnbX9ZeGdkD3dXkMk0YPOcezO"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2a$10$waaltgS2hMUgNQogmDgOJecOkH.BMZg5AdDUpCj.5BIXNRP1BXMMO"
  }
};

function urlsForUser(id) {
  const userURLS = {};
  for(let shortURLS in urlDatabase) {
    if(urlDatabase[shortURLS]["userID"] === id) {
      userURLS[shortURLS] = urlDatabase[shortURLS];
    }
  }
  return userURLS;
}

//function for generating new shortURL ID's
function generateRandomString () {
  const charBank = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 6; i++) {
  let randomChar = Math.floor(Math.random() * (charBank.length+1));
  result += charBank[randomChar];
  }
  return result;
}

//function for checking matching emails (input against database emails)
function checkForEmail (emailInput) {
  for (let key in users) {
    if (users[key]["email"] === emailInput) {
      return true;
    }
  }
}


// To home page
app.get("/", (req, res) => {
  let user_id = req.session.user_id;
  if(user_id) {
    res.redirect("/urls");
  } else {
    res.render("urls_home");
  }
});

//Page containing all URLs owned by user
app.get("/urls", (req, res) => {
  const userURLS = urlsForUser(req.session.user_id);
  let templateVars = {
    urls: urlDatabase,
    user_id: req.session.user_id,
    users: users,
    userURLS: userURLS,
  };
  if(req.session.user_id) {
    res.status(200);
    res.render("urls_index", templateVars);
  } else {
    res.status(401);
    res.redirect("/login");
  }
});

//Page for adding new links
app.get("/urls/new", (req,res) => {
  let templateVars = {
    user_id: req.session.user_id,
    users: users
  };
  if(req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.status(401);
    res.redirect("/login");
  }
});

//Allows modification to shortURL content
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user_id: req.session.user_id,
    users: users
  };
  if(req.session.user_id) {
    res.render("urls_show", templateVars);
  } else if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.sendStatus(403);
  } else if (req.params.shortURL.length > 6 || req.params.shortURL !== urlDatabase[req.params.shortURL]) {
    res.sendStatus(404);
  } else {
    res.status(401).redirect('/login');
  }
});

//accesses website to the corresponding shortURL
app.get("/u/:shortURL", (req, res) => {
  let originalURL = urlDatabase[req.params.shortURL]["longURL"];
  if(originalURL) {
    res.redirect(originalURL);
  } else {
    res.sendStatus(404);
  }
});

//register page
app.get("/register", (req, res) => {
  res.render("urls_register");
})

//login page
app.get("/login", (req, res) => {
  if(req.session.user_id) {
    res.redirect("/");
  } else {
    res.render("urls_login")
  }
});

//Handler for new link submissions
app.post("/urls", (req, res) => {
  let result = req.body;
  let randStr = generateRandomString();
  urlDatabase[randStr] = {"longURL": result["newURL"], "userID": req.session.user_id};
  res.redirect("/urls/");
  console.log(urlDatabase);
});

//Handler for deleting links
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id && req.session.user_id === urlDatabase[req.params.shortURL]["userID"]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    res.send(401, "sorry you cannot delete this link because it is not YOURS, pleases go back!");
    res.redirect("/urls");
  }
});

//Handler for updating shortURL content
app.post("/urls/:shortURL/update", (req, res) => {
  urlDatabase[req.params.shortURL]["longURL"] = req.body["original"];
  res.redirect("/urls");
});

//User verification
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const loginUserId = Object.keys(users).find((k) => users[k].email === email);
  const dbPassword = users[loginUserId]['password'];
  if (!loginUserId || !bcrypt.compareSync(password, dbPassword)) {
    res.status(403);
    res.send();
  } else if (email !== users[loginUserId].email) {
    res.sendStatus(406);
  } else {
    req.session.user_id = users[loginUserId].id;
    res.redirect("/urls");
  }
});

//logout button
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//Handler for registration form, creates new user object
app.post("/register", (req, res) => {
  let emailInput = req.body["email"];
  let pwdInput = req.body["password"];
  const hashed_password = bcrypt.hashSync(pwdInput, 10);
  if (emailInput === "" && pwdInput === "") {
    res.status(400);
  } else if (checkForEmail(emailInput)) {
      res.status(400);
      res.end("Error" + 400);
  } else {
    users[emailInput] = { "id": emailInput,
    "email": emailInput,
    "password": hashed_password,
    };
    req.session.user_id = emailInput;
    res.redirect("/");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

generateRandomString();