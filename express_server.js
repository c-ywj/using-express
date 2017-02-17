const express = require("express");
const app = express();
const cookieParser = require('cookie-parser')
const PORT = process.env.PORT || 8080; //defaults to port 8080
//tells express app to use EJS as its templating engine
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

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
  res.end("Hello!\n");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user_id: req.cookies["user_id"],
    users: users,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req,res) => {
  let templateVars = {
    user_id: req.cookies["user_id"],
    users: users
  };
  res.render("urls_new", templateVars);
  res.redirect("/urls/new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    user_id: req.cookies["user_id"],
    users: users
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  res.render("urls_register");
})

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.post("/urls", (req, res) => {
  let result = req.body;
  let randStr = generateRandomString();
  urlDatabase[randStr] = result["longURL"];
  res.redirect("/urls/" + randStr);
  console.log(urlDatabase);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body["original"];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const loginUserId = Object.keys(users).find((k) => users[k].email === email);
  if (!loginUserId || users[loginUserId].password !== password) {
    res.status(403);
    res.send();
  } else {
    res.cookie("user_id", users[loginUserId].id);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  let emailInput = req.body["email"];
  let pwdInput = req.body["password"];
  let userID = generateRandomString();
  console.log(userID);
  if (emailInput === "" && pwdInput === "") {
    res.end("Error" + 400);
  } else if (checkForEmail(emailInput)) {
      res.end("Error" + 400);
  } else {
    users[userID] = { "id": userID,
    "email": emailInput,
    "password": pwdInput,
    }
    res.cookie("user_id", userID);
  }
  console.log(users);
  res.redirect("/urls");
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