const getUserByEmail = (email, database) => {
  for (let user in database) {
    if (database[user].email === email) {
      return user;
    }
  }
};

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