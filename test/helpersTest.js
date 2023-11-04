const { assert } = require('chai');
const { getUserByEmail, urlsForUser } = require("../helpers");

const testUsers = {
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

const testUrlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lr",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

describe('getUserByEmail', () => {
  it('should return a user with valid email', () => {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(user, expectedUserID);
  });

  it('should return undefined from an email that doesnt exist in database.', () => {
    const user = getUserByEmail("user@typo.com", testUsers);
    const expectedUserID = undefined;
    assert.strictEqual(user, expectedUserID);
  });
});

describe('urlsForUser', () => {
  it('should return an object of urls that the user is only allowed', () => {
    const user = urlsForUser("aJ48lW", testUrlDatabase);
    const expectedUserID = {
      i3BoGr: {
        longURL: "https://www.google.ca",
        userID: "aJ48lW"
      }
    };
    assert.deepEqual(user, expectedUserID);
  });

  it('should return undefined from an email that doesnt exist in database.', () => {
    const user = getUserByEmail("aJ48lt", testUrlDatabase);
    const expectedUserID = undefined; // was kind of expecting an empty object but still works
    assert.strictEqual(user, expectedUserID);
  });
});
