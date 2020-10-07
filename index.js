const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;

app.use(bodyParser.json());

const jsonKeys = [
  "title",
  "desc",
  "category",
  "location",
  "images",
  "price",
  "date",
  "deliveryType",
  "name",
  "tel",
];

let items = [
  {
    id: 1,
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

function testRequestBody(requestBody) {
  let missingKeys = [];
  jsonKeys.forEach((element) => {
    if (!requestBody.hasOwnProperty(element)) {
      console.log(element);
      missingKeys.push(element);
    }
  });
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
  const result = items.find((e) => e.id == req.params.id);
  if (result !== undefined) {
    res.json({ result });
  } else {
    res.status(404).send("Item Id Not Found");
  }
});

app.post("/item", (req, res) => {
  t = testRequestBody(req.body);
  if (t) {
    res.status(400).send("Bad Request, Missing Key(s): " + t);
  } else {
    const newItem = {
      id: items.length + 1,
      title: req.body.title,
      desc: req.body.desc,
      category: req.body.category,
      location: req.body.location,
      images: req.body.images,
      price: req.body.price,
      date: req.body.date,
      deliveryType: req.body.deliveryType,
      name: req.body.name,
      tel: req.body.tel,
    };
    items.push(newItem);

    res.status(201).json(items[items.length - 1]);
  }
});

app.put("/item/:id", (req, res) => {
  let resourceModified = false;
  // find json object from resources by id
  const result = items.find((e) => e.id == req.params.id);
  // if object found
  if (result !== undefined) {
    // loop through keys in request body object
    for (const key in req.body) {
      // if key from request body exists in resource object
      if (result.hasOwnProperty(key)) {
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
  } else {
    res.status(404).send("Item Id Not Found");
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
