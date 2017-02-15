const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; //defaults to port 8080
//tells express app to use EJS as its templating engine
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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


//app.get in this case serves as the if statements: IF request is GET @ / ,
//respond with respond object, with .end method to send back "Hello!"
app.get("/", (req, res) => {
  res.end("Hello!\n");
});

app.get("/urls", (req, res) => {
  let templateVars = {urls: urlDatabase}
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req,res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]};
  res.render("urls_show", templateVars)
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  let result = req.body;
  let randStr = generateRandomString();
  urlDatabase[randStr] = result["longURL"];
  res.redirect("/urls/" + randStr);
  console.log(urlDatabase);
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