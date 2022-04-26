const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const router = express.Router();
const config = require("./config.json");
const middlewareAuth = require('./tokenChecker');

const tokenList = {};
const app = express();

router.get("/", (req, res) => {
  res.send("OK");
});

router.post("/login", (req, res) => {
  const postData = req.body;
  const user = {
    email: postData.email,
    name: postData.name,
  };
  // do the database authentication here, with user name and password combination.
  console.log(config.tokenLife);
  const token = jwt.sign(user, config.secret, { expiresIn: config.tokenLife });
  const refreshToken = jwt.sign(user, config.refreshTokenSecret, {
    expiresIn: config.refreshTokenLife,
  });
  const response = {
    status: "Logged in",
    token: token,
    refreshToken: refreshToken,
  };
  tokenList[refreshToken] = response;
  res.status(200).json(response);
});

router.post("/token", (req, res) => {
  // refresh the damn token
  const postData = req.body;
  // if refresh token exists
  if (postData.refreshToken && postData.refreshToken in tokenList) {
    const user = {
      email: postData.email,
      name: postData.name,
    };
    const token = jwt.sign(user, config.secret, {
      expiresIn: config.tokenLife,
    });
    const response = {
      token: token,
    };
    // update the token in the list
    tokenList[postData.refreshToken].token = token;
    res.status(200).json(response);
  } else {
    res.status(404).send("Invalid request");
  }
});

router.get('/secure', middlewareAuth, (req,res) => {
  // all secured routes goes here
  res.send('I am secured...')
})
router.use(middlewareAuth);
app.use(bodyParser.json());
app.use(cors());
app.use("/api", router);
app.listen(config.port || process.env.PORT || 8080);
