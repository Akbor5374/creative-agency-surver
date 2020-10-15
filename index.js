const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs  = require('fs-extra');
const ObjectId = require('mongodb').ObjectId
const MongoClient = require('mongodb').MongoClient;
const fileUpload = require('express-fileupload');
require('dotenv').config()

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('images'));
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kliml.mongodb.net/service?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const serviceCollection = client.db("service").collection("serviceCollection");

    const orderServiceCollection = client.db("orderService").collection("orderServiceCollection");

    const adminCollection = client.db("dashboardAccess").collection("adminCollection");

    const reviewCollection = client.db("review").collection("reviewCollection");

    app.post('/addService', (req, res) => {
        const file = req.files.file;
        const title = req.body.title;
        const description = req.body.description;
        const filePath = `${__dirname}/images/${file.name}`;

        file.mv(filePath, err => {
            if (err) {
                res.status(500).send({ msg: "Failed to uploaded image" });
            }
            const newImg = fs.readFileSync(filePath);
            const encodeImg = newImg.toString('base64');
            const image = {
                contentType: file.mimetype,
                size: file.size,
                img: Buffer.from(encodeImg, 'base64')
            };

            serviceCollection.insertOne({ title, description, img:image })
            .then(result => {
                fs.remove(filePath, err => {
                    if(err){
                     console.log(err);
                     res.status(500).send({ msg: "Failed to uploaded image" });
                    }
                    res.send(result.insertedCount > 0);
                });
            });
        });
    });

    app.get('/getAllService', (req, res) => {
        serviceCollection.find({})
        .toArray( (error, documents) => {
            res.send(documents);
        })
    });

    app.get('/getSingleService/:id', (req, res) => {
        const id = req.params.id;
        serviceCollection.find({_id: ObjectId(id)})
        .toArray( (error, documents) => {
            res.send(documents[0]);
        })
    });

    app.post('/addOrderService', (req, res) => {
        orderServiceCollection.insertOne(req.body)
        .then((result) => {
            res.send(result.insertedCount > 0);
        })
    });

    app.get('/getOrderService', (req, res) => {
        const email = req.query.email;
        orderServiceCollection.find({email: email})
        .toArray( (err, documents) => {
            res.send(documents);
        })
    });

    app.post('/addAdmin', (req, res)  => {
        adminCollection.insertOne(req.body)
        .then(result => {
            res.send(result.insertedCount > 0);
        })
    });
    app.post('/checkAdmin', (req, res) => {
        adminCollection.find({email: req.body.email})
        .toArray( (err, documents) => {
            res.send(documents.length > 0);
        })
    });

    app.get('/getAllUserService', (req, res) => {
        orderServiceCollection.find({})
        .toArray( (err, documents) => {
            res.send(documents);
        })
    });

    app.post('/addReview', (req, res) => {
        reviewCollection.insertOne(req.body)
        .then(result => {
            res.send(result.insertedCount > 0)
        })
    });

    app.get('/getAllReview', (req, res) => {
        reviewCollection.find({})
        .toArray( (err, documents) => {
            res.send(documents);
        })
    });

});


app.get('/', (req, res) => {
    res.send("hello creative agency");
});
app.listen(process.env.PORT ||5000)