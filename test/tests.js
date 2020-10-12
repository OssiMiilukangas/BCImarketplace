const chai = require("chai");
const chaiHttp = require("chai-http");
const bcrypt = require("bcryptjs");
chai.use(chaiHttp);
const server = require("../server");
const { response } = require("express");

const expect = chai.expect;

const apiAddress = "http://localhost:3000";

describe("User operations", function() {
    const userKeys = [
        "id", "username", "email", "password",
    ];

    const testUserObj = {
        username: "testUser",
        email: "test@email.com",
        password: "testPassword"
    }

    before(function() {
        server.start()
    });

    describe("Get users", function() {
        it("Should respond with an array of user objects", async function() {
            await chai
                .request(apiAddress)
                .get("/user")
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.body).to.be.a("object");
                    expect(response.body).to.have.a.property("users");
                    expect(response.body.users).to.be.a("array");
                    userKeys.forEach(e => {
                        expect(response.body.users[0]).to.have.a.property(e)
                    });
                })
        })
    })

    describe("Register user", function() {
        it("Should register a new user to the system", async function() {
            // test the response body
            await chai
                .request(apiAddress)
                .post("/user/register")
                .send(testUserObj)
                .then(response => {
                    expect(response.status).to.equal(201);
                    expect(response.body).to.be.a("object");
                    expect(response.body).to.have.a.property("newUser");
                    expect(response.body.newUser).to.be.a("object");
                    
                    userKeys.forEach(e => {
                        expect(response.body.newUser).to.have.a.property(e);
                    });

                    expect(response.body.newUser.id).to.be.a("number");
                    expect(response.body.newUser.username).to.equal(testUserObj.username);
                    expect(response.body.newUser.email).to.equal(testUserObj.email);
                    expect(bcrypt.compareSync(testUserObj.password, response.body.newUser.password)).to.equal(true);
                })
            
            // send a get users request and test that the user was added correctly
            await chai
                .request(apiAddress)
                .get("/user")
                .then((response) => {
                    addedUser = response.body.users[response.body.users.length - 1];

                    expect(addedUser.id).to.equal(response.body.users.length);
                    expect(addedUser.username).to.equal(testUserObj.username);
                    expect(addedUser.email).to.equal(testUserObj.email);
                    expect(bcrypt.compareSync(testUserObj.password, addedUser.password)).to.equal(true);
                })
        })

        it("Should respond with bad request if missing data", async function() {
            await chai
                .request(apiAddress)
                .post("/user/register")
                .send({
                    email: "test@email.com",
                    password: "testPassword"
                })
                .then(response => {
                    expect(response.status).to.equal(400);
                })

            await chai
                .request(apiAddress)
                .post("/user/register")
                .send({
                    username: "testUser",
                })
                .then(response => {
                    expect(response.status).to.equal(400);
                })
        })
    })


    describe("Login", function() {
        it("Should respond with a token when given right credentials", async function() {
            await chai
                .request(apiAddress)
                .get("/user/login")
                .auth("testUser", "testPassword")
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.body).to.be.a("object");
                    expect(response.body).to.have.a.property("token");
                    expect(response.body.token).to.be.a("string");
                })
        })

        it("Should respond with unauthorized if given wrong credentials", async function() {
            await chai
                .request(apiAddress)
                .get("/user/login")
                .auth("testUser", "wrongPassword")
                .then(response => {
                    expect(response.status).to.equal(401);
                })

            await chai
                .request(apiAddress)
                .get("/user/login")
                .auth("wrongUser", "password")
                .then(response => {
                    expect(response.status).to.equal(401);
                })
        })
    })
})

describe("Item operations", function() {
    const itemKeys = [
        "id",
        "userId",
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
    
    const testItemObj = {
        title: "test object",
        desc: "this is test object",
        category: "ajoneuvot",
        location: "Oulu",
        images: [],
        price: "200.00",
        date: "12-10-2020",
        deliveryType: "pickup",
        name: "Ossi",
        tel: "0129091249",
    };

    let token;
    let wrongToken;

    after(function() {
        server.stop()
    });

    describe("Get items", function() {
        it("Should respond with an array of item objects", async function() {
            await chai
                .request(apiAddress)
                .get("/item")
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.body).to.be.a("object");
                    expect(response.body).to.have.a.property("items");
                    expect(response.body.items).to.be.a("array");
                    expect(response.body.items[0]).to.be.a("object");

                    itemKeys.forEach(e => {
                        expect(response.body.items[0]).to.have.a.property(e);
                    })
                })
        })
    })

    describe("Post item", function() {
        it("Should add a new item to the system", async function() {
            // get authorization token
            await chai
                .request(apiAddress)
                .get("/user/login")
                .auth("testUser", "testPassword")
                .then((response) => {
                    token = response.body.token
                })
            
            // send post item request
            await chai
                .request(apiAddress)
                .post("/item")
                .attach('image', 'testImage.png', 'testImage.png')
                .field(testItemObj)
                .set("Authorization", "bearer " + token)
                .then((response) => {
                    expect(response.status).to.equal(201);
                    expect(response.body).to.be.a("object");
                    
                    itemKeys.forEach(e => {
                        expect(response.body).to.have.a.property(e);
                        // exclude properties that are not given in post request
                        if(e !== "id" && e !== "userId" && e !== "images") {
                            expect(response.body[e]).to.equal(testItemObj[e]);
                        }
                    })

                    expect(response.body.id).to.equal(2);
                    expect(response.body.userId).to.equal(2);
                    expect(response.body.images).to.be.a("array");
                    expect(response.body.images[0]).to.have.a.property("fieldname");
                    expect(response.body.images[0].fieldname).to.equal("image");
                })

            // send a get items request and test that the item was added correctly
            await chai
                .request(apiAddress)
                .get("/item")
                .then(response => {
                    addedItem = response.body.items[response.body.items.length - 1];

                    itemKeys.forEach(e => {
                        // exclude properties that are not given in post request
                        if(e !== "id" && e !== "userId" && e !== "images") {
                            expect(addedItem[e]).to.equal(testItemObj[e]);
                        }
                    })

                    expect(addedItem.id).to.equal(2);
                    expect(addedItem.userId).to.equal(2);
                    expect(addedItem.images).to.be.a("array");
                    expect(addedItem.images[0]).to.be.a("object");
                    expect(addedItem.images[0]).to.have.a.property("fieldname");
                    expect(addedItem.images[0].fieldname).to.equal("image");
                })
                
        })

        it("Should respond with unauthorized if given incorrect token", async function() {
            await chai
                .request(apiAddress)
                .post("/item")
                .send(testItemObj)
                .set("Authorization", "bearer " + "nonExistingToken")
                .then(response => {
                    expect(response.status).to.equal(401);
                })
        })

        it("Should respond with bad request if missing data", async function() {
            await chai
                .request(apiAddress)
                .post("/item")
                .send({title: "test object"})
                .set("Authorization", "bearer " + token)
                .then(response => {
                    expect(response.status).to.equal(400);
                })
        })
    })

    describe("Get item by id", function () {
        it("Should respond with the new item added", async function() {
            await chai
                .request(apiAddress)
                .get("/item/2")
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.body).to.be.a("object");

                    itemKeys.forEach(e => {
                        expect(response.body.item).to.have.a.property(e);
                        // exclude properties that are not given in post request
                        if(e !== "id" && e !== "userId" && e !== "images") {
                            expect(response.body.item[e]).to.equal(testItemObj[e]);
                        }
                    })

                    expect(response.body.item.id).to.equal(2);
                    expect(response.body.item.userId).to.equal(2);
                    expect(response.body.item.images).to.be.a("array");
                    expect(response.body.item.images[0]).to.be.a("object");
                    expect(response.body.item.images[0]).to.have.a.property("fieldname");
                    expect(response.body.item.images[0].fieldname).to.equal("image");
                })
        })

        it("Should respond with not found if given incorrect id", async function() {
            await chai
                .request(apiAddress)
                .get("/item/99")
                .then(response => {
                    expect(response.status).to.equal(404);
                })
        })
    })

    describe("Modify item", function() {
       let modifiedItems = {
            title: "Modified title",
            desc: "this item has been modified"
        }

        it("Should modify the new item object", async function() {
            // test response body
            await chai
                .request(apiAddress)
                .put("/item/2")
                .send(modifiedItems)
                .set("Authorization", "bearer " + token)
                .then(response => {
                    expect(response.status).to.equal(200);
                    expect(response.body).to.be.a("object");
                    
                    itemKeys.forEach(e => {
                        expect(response.body).to.have.a.property(e);
                        // exclude modified properties and those that are not given in post request
                        if(e !== "id" && e !== "userId" && e !== "images" && e !== "title" && e !== "desc") {
                            expect(response.body[e]).to.equal(testItemObj[e]);
                        }
                    })

                    expect(response.body.id).to.equal(2);
                    expect(response.body.userId).to.equal(2);
                    expect(response.body.title).to.equal(modifiedItems.title);
                    expect(response.body.desc).to.equal(modifiedItems.desc);
                    expect(response.body.images).to.be.a("array");
                    expect(response.body.images[0]).to.be.a("object");
                    expect(response.body.images[0]).to.have.a.property("fieldname");
                    expect(response.body.images[0].fieldname).to.equal("image");
                })

            // send a get items request and test that items were modified correctly
            await chai
                .request(apiAddress)
                .get("/item/2")
                .then(response => {
                    itemKeys.forEach(e => {
                        expect(response.body.item).to.have.a.property(e);
                        // exclude modified properties and those that are not given in post request
                        if(e !== "id" && e !== "userId" && e !== "images" && e !== "title" && e !== "desc") {
                            expect(response.body.item[e]).to.equal(testItemObj[e]);
                        }
                    })

                    expect(response.body.item.id).to.equal(2);
                    expect(response.body.item.userId).to.equal(2);
                    expect(response.body.item.title).to.equal(modifiedItems.title);
                    expect(response.body.item.desc).to.equal(modifiedItems.desc);
                })
        })

        it("Should respond with bad request if given incorrect keys", async function() {
            await chai
                .request(apiAddress)
                .put("/item/2")
                .send({nonExistingKey: "test"})
                .set("Authorization", "bearer " + token)
                .then(response => {
                    expect(response.status).to.equal(400);
                })
        })

        it("Should respond with unauthorized if given incorrect token", async function() {
            await chai
                .request(apiAddress)
                .put("/item/2")
                .send(modifiedItems)
                .set("Authorization", "bearer " + "nonExistingToken")
                .then(response => {
                    expect(response.status).to.equal(401);
                })
        })

        it("Should respond with forbidden if given wrong users token", async function() {
            // get token of a different user
            await chai
                .request(apiAddress)
                .get("/user/login")
                .auth("ossi", "ossi123")
                .then((response) => {
                    wrongToken = response.body.token
                })
            
            await chai
                .request(apiAddress)
                .put("/item/2")
                .send(modifiedItems)
                .set("Authorization", "bearer " + wrongToken)
                .then(response => {
                    expect(response.status).to.equal(403);
                })
        })

        it("Should respond with not found if given incorrect id", async function() {
            await chai
                .request(apiAddress)
                .put("/item/99")
                .send(modifiedItems)
                .set("Authorization", "bearer " + token)
                .then(response => {
                    expect(response.status).to.equal(404);
                })
        })
    })

    describe("Delete item", function() {
        it("Should respond with unauthorized if given incorrect token", async function() {
            await chai
                .request(apiAddress)
                .delete("/item/2")
                .set("Authorization", "bearer " + "nonExistingToken")
                .then(response => {
                    expect(response.status).to.equal(401);
                })
        })

        it("Should respond with forbidden if given wrong users token", async function() {  
            await chai
                .request(apiAddress)
                .delete("/item/2")
                .set("Authorization", "bearer " + wrongToken)
                .then(response => {
                    expect(response.status).to.equal(403);
                })
        })

        it("Should respond with not found if given incorrect id", async function() {
            await chai
                .request(apiAddress)
                .delete("/item/99")
                .set("Authorization", "bearer " + token)
                .then(response => {
                    expect(response.status).to.equal(404);
                })
        })

        it("Should delete the new item from the system", async function() {
            await chai
                .request(apiAddress)
                .delete("/item/2")
                .set("Authorization", "bearer " + token)
                .then(response => {
                    expect(response.status).to.equal(200);
                })
            
            // send a get item request and test that item was deleted correctly
            await chai
                .request(apiAddress)
                .get("/item/2")
                .then(response => {
                    expect(response.status).to.equal(404);
                })
        })
    })

    describe("Search item", function() {
        it("Should respond with correctly searched items", async function() {
            await chai
                .request(apiAddress)
                .get("/item/search/location/oulu")
                .then(response => {
                    expect(response.status).to.equal(200);
                    response.body.results.forEach(e => {
                        expect(e.location.toLowerCase()).to.equal("oulu")
                    });
                })

            await chai
                .request(apiAddress)
                .get("/item/search/category/ajoneuvot")
                .then(response => {
                    expect(response.status).to.equal(200);
                    response.body.results.forEach(e => {
                        expect(e.category.toLowerCase()).to.equal("ajoneuvot")
                    });
                })
        })

        it("Should respond with bad request if given not supported searchtype parameter", async function() {
            await chai
                .request(apiAddress)
                .get("/item/search/notSupported/oulu")
                .then(response => {
                    expect(response.status).to.equal(400);
                })
        })

        it("Should respond with not found if no items was found by the keyword", async function() {
            await chai
                .request(apiAddress)
                .get("/item/search/location/nonExistingPlace")
                .then(response => {
                    expect(response.status).to.equal(404);
                })
        })
    })
})