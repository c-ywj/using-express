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

function generateRandomString () {
  const charBank = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 6; i++) {
  let randomChar = Math.floor(Math.random() * (charBank.length+1));
  result += charBank[randomChar];
  }
  return result;
}

function checkForEmail (emailInput) {
  for (let key in users) {
    if (users[key]["email"] === emailInput) {
      return true;
    }
  }
}


//app.get in this case serves as the if statements: IF request is GET @ / ,
//respond with respond object, with .end method to send back "Hello!"
app.get("/", (req, res) => {
  let user_id = req.session.user_id;
  if(user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

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

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {shortURL: req.params.shortURL,
    realURL: urlDatabase[req.params.shortURL],
    user_id: req.session.user_id,
    users: users
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let originalURL = urlDatabase[req.params.shortURL]["longURL"];
  if(originalURL) {
    res.redirect(originalURL);
  } else {
    res.status(404);
  }
});

app.get("/register", (req, res) => {
  res.render("urls_register");
})

app.get("/login", (req, res) => {
  if(req.session.user_id) {
    res.redirect("/");
  } else {
    res.render("urls_login")
  }
});

app.post("/urls", (req, res) => {
  let result = req.body;
  let randStr = generateRandomString();
  urlDatabase[randStr] = {"longURL": result["newURL"], "userID": req.session.user_id};
  res.redirect("/urls/");
  console.log(urlDatabase);
});

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

app.post("/urls/:shortURL/update", (req, res) => {
  urlDatabase[req.params.shortURL]["longURL"] = req.body["original"];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const loginUserId = Object.keys(users).find((k) => users[k].email === email);
  const dbPassword = users[loginUserId]['password'] // use this for comparison
  // const hashed_password = bcrypt.hashSync(password, 10);
  // bcrypt.compareSync(password, hashed_password);
  if (!loginUserId || !bcrypt.compareSync(password, dbPassword)) {
    res.status(403);
    res.send();
  } else {
    req.session.user_id = users[loginUserId].id;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  let emailInput = req.body["email"];
  let pwdInput = req.body["password"];
  const hashed_password = bcrypt.hashSync(pwdInput, 10);
  if (emailInput === "" && pwdInput === "") {
    res.status(400);
    res.end("Error" + 400);
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