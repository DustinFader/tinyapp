const getUserByEmail = (email, database) => {
  // loops through users database
  // checking if each users email matches the email being used
  // if it matches then returns the emails user id else false
  for (let user in database) {
    if (database[user].email === email) {
      return user;
    }
  }
};

// returns object of all urls available to user
const urlsForUser = (id, urlDatabase) => {
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

module.exports = { getUserByEmail, generateRandomString, urlsForUser };