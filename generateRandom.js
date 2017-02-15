function generateRandomString () {
 const charBank = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
 let result = "";
 for(var i = 0; i <6; i++) {
   let randomChar = Math.floor(Math.random() * (charBank.length+1));
   result += charBank[randomChar];
   console.log(result);
  }
   // console.log(result);
}

generateRandomString();

