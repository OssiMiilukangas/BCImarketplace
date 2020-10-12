const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const BasicStrategy = require("passport-http").BasicStrategy;
const jwt = require("jsonwebtoken");
const jwtStrategy = require("passport-jwt").Strategy,
  ExtractJwt = require("passport-jwt").ExtractJwt;
const jwtSecretKey = require("./jwt-key.json");
const multer = require("multer");
const multerUpload = multer({ dest: "uploads/" });
const app = express();
const port = 3000;

app.use(bodyParser.json());

// users array with example user resource
let users = [
  {
    id: 1,
    username: "ossi",
    email: "ossi.miilukangas@hotmail.com",
    password: bcrypt.hashSync("ossi123", 6),
  },
];

// items array with example item resource
let items = [
  {
    id: 1,
    userId: 1,
    title: "Testituote",
    desc: "Helvetin hyvä tuote",
    category: "Ajoneuvot",
    location: "Oulu",
    images: [],
    price: 99999.99,
    date: "1204i10142",
    deliveryType: "pickup",
    name: "Ossi",
    tel: "0129091249",
  },
];

// Http basic authentication strategy
passport.use(
  new BasicStrategy(function (username, password, done) {
    // find user from resources by username
    const user = users.find((e) => e.username == username);

    // if user not found
    if (user == undefined) {
      return done(null, false, { message: "HTTP Basic username not found" });
    }

    // compare passwords
    if (bcrypt.compareSync(password, user.password) == false) {
      return done(null, false, { message: "HTTP Basic password not found" });
    }
    return done(null, user);
  })
);

// JWT authentication strategy
let options = {};

options.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
options.secretOrKey = jwtSecretKey.secret;

passport.use(
  new jwtStrategy(options, function (jwt_payload, done) {
    // test if the token is expired
    const now = Date.now() / 1000;
    if (jwt_payload.exp > now) {
      done(null, jwt_payload.user);
    } else {
      done(null, false);
    }
  })
);

/*********************************************
 * USER ENDPOINTS
 ********************************************/

app.post("/user/register", (req, res) => {
  // tests that request body has required data
  if ("username" in req.body == false) {
    res.status(400).send("Bad Request: Missing username");
    return;
  }
  if ("password" in req.body == false) {
    res.status(400).send("Bad Request: Missing password");
    return;
  }
  if ("email" in req.body == false) {
    res.status(400).send("Bad Request: Missing email");
    return;
  }

  // hash the password
  const hashedPassword = bcrypt.hashSync(req.body.password, 6);

  const newUser = {
    id: users.length + 1,
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
  };
  users.push(newUser);

  res.status(201).json({ newUser });
});

app.get(
  "/user/login",
  passport.authenticate("basic", { session: false }),
  (req, res) => {
    // construct body and set options
    const body = {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
    };

    const payload = {
      user: body,
    };

    const options = {
      expiresIn: "600s",
    };

    // create and return token
    const token = jwt.sign(payload, jwtSecretKey.secret, options);
    res.status(200).json({ token });
  }
);

// get users for testing
app.get("/user", (req, res) => {
  res.json({ users });
});

/*********************************************
 * ITEM ENDPOINTS
 ********************************************/

function testPostItemBody(requestBody) {
  // Keys that request body object should contain
  const jsonKeys = [
    "title",
    "desc",
    "category",
    "location",
    "price",
    "date",
    "deliveryType",
    "name",
    "tel",
  ];
  let missingKeys = [];

  // loop through keys and if request object doesn't contain a key, add it to the missing keys list
  jsonKeys.forEach((element) => {
    if (element in requestBody === false) {
      missingKeys.push(element);
    }
  });

  // if any missing keys was found, return them
  if (missingKeys.length > 0) {
    return missingKeys;
  } else {
    return false;
  }
}

app.get("/item", (req, res) => {
  res.json({ items });
});

app.get("/item/:id", (req, res) => {
  // find json object from resources by id
  const result = items.find((e) => e.id == req.params.id);
  if (result !== undefined) {
    res.json({ result });
  } else {
    res.status(404).send("Item Id Not Found");
  }
});

app.post(
  "/item",
  passport.authenticate("jwt", { session: false }),
  multerUpload.array("image", 4),
  (req, res) => {
    // test the request body for including all the keys
    t = testPostItemBody(req.body);
    if (t) {
      // if test returns keys, send bad request status and the missing keys
      res.status(400).send("Bad Request, Missing Key(s): " + t);
      return;
    }

    //upload images
    req.files.forEach((f) => {
      fs.renameSync(f.path, "./uploads/" + f.originalname);
    });

    const newItem = {
      id: items.length + 1,
      userId: req.user.id, // id of the user who created the item
      title: req.body.title,
      desc: req.body.desc,
      category: req.body.category,
      location: req.body.location,
      images: req.files,
      price: req.body.price,
      date: req.body.date,
      deliveryType: req.body.deliveryType,
      name: req.body.name,
      tel: req.body.tel,
    };
    items.push(newItem);

    res.status(201).json(items[items.length - 1]);
  }
);

app.put(
  "/item/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // find json object from resources by id
    const result = items.find((e) => e.id == req.params.id);

    // test that the object exists
    if (result === undefined) {
      res.status(404).send("Item Id Not Found");
      return;
    }

    // test that the user is authorized to modify the resource
    if (result.userId !== req.user.id) {
      res.status(403).send("Forbidden: User not authorized");
      return;
    }

    let resourceModified = false;
    // loop through keys in request body object
    for (const key in req.body) {
      // if key from request body exists in resource object
      if (key in result) {
        result[key] = req.body[key];
        resourceModified = true;
      }
    }

    // test if anything was modified
    if (resourceModified) {
      res.status(200).json(result);
    } else {
      res.status(404).send("Couldn't find any corresponding keys to modify");
    }
  }
);

app.delete(
  "/item/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // find index of a json object from resources by id
    const result = items.findIndex((e) => e.id == req.params.id);

    // test that index was found
    if (result === -1) {
      res.status(404).send("Item Id Not Found");
      return;
    }

    // test that the user is authorized to modify the resource
    if (items[result].userId !== req.user.id) {
      res.status(403).send("Forbidden: User not authorized");
      return;
    }
    items.splice(result, 1);
    res.status(200).send("Item deleted, Id: " + req.params.id);
  }
);

app.get("/item/search/:searchtype/:keyword", (req, res) => {
  // test if "searchtype" path parameter is supported
  if (
    req.params.searchtype.toLowerCase() !== "category" &&
    req.params.searchtype.toLowerCase() !== "location" &&
    req.params.searchtype.toLowerCase() !== "date"
  ) {
    res.status(400).send("Bad Request: Searchtype not supported");
    return;
  }

  // find all json objects from resources that contains the given keyword in a given key
  const results = items.filter((e) =>
    e[req.params.searchtype]
      .toLowerCase()
      .includes(req.params.keyword.toLowerCase())
  );

  // if any objects found
  if (results.length > 0) {
    res.json({ results });
  } else {
    res.status(404).send("No results found");
  }
});

let apiInstance = null;
exports.start = () => {
  apiInstance = app.listen(port, () => {
    //console.log(`Example app listening at http://localhost:${port}`);
  });
};

exports.stop = () => {
  apiInstance.close();
};
