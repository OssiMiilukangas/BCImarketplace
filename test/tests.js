const chai = require("chai");
const chaiHttp = require("chai-http");
const bcrypt = require("bcryptjs");
chai.use(chaiHttp);
const server = require("../server");

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
    after(function() {
        server.stop()
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
                .catch((error) => {
                    expect.fail(error);
                });
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
            
            // do a get users request and test that the user was added correctly
            await chai
                .request(apiAddress)
                .get("/user")
                .then((getResponse) => {
                    addedUser = getResponse.body.users[getResponse.body.users.length - 1];

                    expect(addedUser.id).to.equal(getResponse.body.users.length);
                    expect(addedUser.username).to.equal(testUserObj.username);
                    expect(addedUser.email).to.equal(testUserObj.email);
                    expect(bcrypt.compareSync(testUserObj.password, addedUser.password)).to.equal(true);
                })
                .catch((error) => {
                    expect.fail(error);
                });
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
    };

    let bearerToken = "";

    before(function() {
        server.start()
    });
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
                .catch((error) => {
                    expect.fail(error);
                })
        })
    })

    /*describe("Post item", function() {
        it("Should add a new item to the system", async function() {
            await chai
                .request(apiAddress)
                .get("/user/login")
                .auth("ossi", "ossi123")
                .then((loginResponse) => {
                    // get authorization token
                    token = loginResponse.body.token;
                    // send post item request
                    return chai.request(apiAddress)
                            .post("/item")
                            .send(testItemObj)
                            .set("Authorization", "bearer " + token);
                })
                .then((postResponse) => {
                    expect(postResponse.status).to.equal(201);
                })
        })
    })*/


    /*describe("Get item by id", function () {
        it("Should respond with the new item added", async function() {
            await chai
                .request(apiAddress)
                .post("/item")
                .send()
        })
    })*/
})