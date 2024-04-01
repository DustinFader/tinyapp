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


// Require the dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const app = require('../express_server'); // The express app to be tested

// Use chai-http plugin
chai.use(chaiHttp);

// Create a reusable agent for authenticated requests
const agent = chai.request.agent(app);

describe('Test redirections and permissions', () => {
  // Test the first case
  it('should redirect to /login when accessing the root route', () => {
    // Make a GET request to the root route
    return chai.request(app)
      .get('/')
      .then(res => {
        // Expect a 302 status code
        expect(res).to.have.status(302);
        // Expect the redirection location to be /login
        expect(res).to.redirectTo('http://localhost:8080/login');
      });
  });

  // Test the second case
  it('should redirect to /login when accessing a short URL without logging in', () => {
    // Make a GET request to a short URL route
    return chai.request(app)
      .get('/urls/b2xVn2')
      .then(res => {
        // Expect a 302 status code
        expect(res).to.have.status(302);
        // Expect the redirection location to be /login
        expect(res).to.redirectTo('http://localhost:8080/login');
      });
  });

  // Test the third case
  it('should allow access to a short URL after logging in as the owner', () => {
    // Make a POST request to the login route with the credentials of the owner
    return agent
      .post('/login')
      .send({ email: 'user@example.com', password: 'purple-monkey-dinosaur' })
      .then(res => {
        // Expect a 200 status code
        expect(res).to.have.status(200);
        // Expect a cookie to be set
        expect(res).to.have.cookie('session');
        // Make a GET request to the short URL route using the same agent
        return agent
          .get('/urls/b2xVn2')
          .then(res => {
            // Expect a 200 status code
            expect(res).to.have.status(200);
            // Expect the response body to contain the long URL
            expect(res.body).to.contain('http://www.lighthouselabs.ca');
          });
      });
  });

  // Test the fourth case
  it('should deny access to a short URL after logging in as a non-owner', () => {
    // Make a POST request to the login route with the credentials of a non-owner
    return agent
      .post('/login')
      .send({ email: 'user2@example.com', password: 'dishwasher-funk' })
      .then(res => {
        // Expect a 200 status code
        expect(res).to.have.status(200);
        // Expect a cookie to be set
        expect(res).to.have.cookie('session');
        // Make a GET request to the short URL route using the same agent
        return agent
          .get('/urls/b2xVn2')
          .then(res => {
            // Expect a 403 status code
            expect(res).to.have.status(403);
            // Expect the response body to contain an error message
            expect(res.body).to.contain('You are not authorized to access this URL');
          });
      });
  });

  // Close the agent after the tests
  after(() => {
    agent.close();
  });
});

