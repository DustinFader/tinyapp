const { assert } = require("chai");
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
  },
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

describe("getUserByEmail", () => {
  it("should return a user with valid email", () => {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(user, expectedUserID);
  });

  it("should return undefined from an email that doesnt exist in database.", () => {
    const user = getUserByEmail("user@typo.com", testUsers);
    const expectedUserID = undefined;
    assert.strictEqual(user, expectedUserID);
  });
});

describe("urlsForUser", () => {
  it("should return an object of urls that the user is only allowed", () => {
    const user = urlsForUser("aJ48lW", testUrlDatabase);
    const expectedUserID = {
      i3BoGr: {
        longURL: "https://www.google.ca",
        userID: "aJ48lW",
      },
    };
    assert.deepEqual(user, expectedUserID);
  });

  it("should return undefined from an email that doesnt exist in database.", () => {
    const user = getUserByEmail("aJ48lt", testUrlDatabase);
    const expectedUserID = undefined; // was kind of expecting an empty object but still works
    assert.strictEqual(user, expectedUserID);
  });
});

// Require the dependencies
const chai = require("chai");
const chaiHttp = require("chai-http");
const expect = chai.expect;
const app = require("../express_server"); // The express app to be tested

// Use chai-http plugin
chai.use(chaiHttp);

// Create a reusable agent for authenticated requests
// const agent = chai.request.agent(app);

describe("Test redirections and permissions", () => {
  let agent;

  // Before each test, create a reusable agent for authenticated requests
  beforeEach(() => {
    agent = chai.request.agent(app);
  });

  // After each test, close the agent
  afterEach(() => {
    agent.close();
  });

  // Test the first case
  it("should redirect to /login when accessing the root route", () => {
    // Make a GET request to the root route
    chai
      .request(app)
      .get("/")
      .redirects(0)
      .then((res) => {
        expect(res.statusCode).to.equal(302);
      })

      .then((res) => {
        // Expect the redirection location to be /login
        const path = new URL(res.request.req.path, `http://${res.request.host}`)
          .pathname;
        expect(path).to.equal("/login");
      });
  });

  // Test 2
  it("GET /urls/new, a user should be redirected to /login if they are not logged in", () => {
    // Make a GET request to the root route
    chai
      .request(app)
      .get("/urls/new")
      .redirects(0)
      .then((res) => {
        expect(res.statusCode).to.equal(302);
      })

      .then((res) => {
        // Expect the redirection location to be /login
        const path = new URL(res.request.req.path, `http://${res.request.host}`)
          .pathname;
        expect(path).to.equal("/login");
      });
  });

  // Test 3
  it("should give status 403 when accessing a short URL without logging in", () => {
    // Make a GET request to a short URL route
    return chai
      .request(app)
      .get("/urls/i3BoGr")
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  // Test case 3: GET request to a non-existent short URL should return 404
  it("should return 404 when accessing a non-existent short URL", () => {
    return agent
      .post("/register")
      .send({ email: "kofao@example.com", password: "pandomonium" })
      .then((res) => {
        expect(res).to.have.status(200);
        return agent.get("/urls/NOTEXISTS").then((res) => {
          expect(res).to.have.status(404);
          expect(res.error.text).to.equal("URL not found.");
        });
      });
  });

  // test 3.5
  it("should allow access to a short URL after logging in as the owner", () => {
    // Make a POST request to the login route with the credentials of the owner
    return agent
      .post("/login")
      .send({ email: "user@example.com", password: "purple-monkey-dinosaur" })
      .then((res) => {
        // Expect a 200 status code
        expect(res).to.have.status(200);
        // Expect a cookie to be set
        // Make a GET request to the short URL route using the same agent
        return agent.get("/urls/i3BoGr").then((res) => {
          // Expect a 200 status code
          expect(res).to.have.status(200);
          // Expect the response body to contain the long URL
          expect(res.text).to.contain("http://www.lighthouselabs.ca");
        });
      });
  });

  // Test 5
  it("should deny access to a short URL after logging in as a non-owner, rather, it doesnt exist to them.", () => {
    // Make a POST request to the login route with the credentials of a non-owner
    return agent
      .post("/login")
      .send({ email: "user2@example.com", password: "dishwasher-funk" })
      .then((res) => {
        // Expect a 200 status code
        expect(res).to.have.status(200);
        // Make a GET request to the short URL route using the same agent
        return agent.get("/urls/i3BoGr").then((res) => {
          expect(res).to.have.status(404);
          // Expect the response body to contain an error message
          expect(res.text).to.contain(
            "URL not found"
            // "You are not authorized to access this URL"
            // Only returns all relevent urls to the user and checks that list instead of the actual database. So no rejection on an url, just non existence.
          );
        });
      });
  });
});
