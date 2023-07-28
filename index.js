const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

const app = express();

require('dotenv').config();

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6ix5jrq.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const productCollection = client.db('resaleMobile').collection('products');
    const bookingsCollection = client.db('resaleMobile').collection('bookings');
    const sellingProductCollection = client.db('resaleMobile').collection('sellingProducts');
    const usersCollection = client.db('resaleMobile').collection('users');

    app.get('/products', async (req, res) => {
      const query = {};
      const product = await productCollection.find(query).toArray();
      res.send(product);
    })
    app.get('/products/:id', async (req, res) => {
      const productId = req.params.id;
      const query = { _id: new ObjectId(productId) };
      const product = await productCollection.findOne(query);
      res.send(product);
    })
    app.get('/bookings', async (req, res) => {
      const email = req.query.email;
      const query = { buyerEmail: email };
      const booking = await bookingsCollection.find(query).toArray();
      res.send(booking);
    })
    app.post('/bookings', async (req, res) => {

      const booking = req.body;

      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    })
    app.get('/sellingProducts', async (req, res) => {
      const email = req.query.email;
      const productAdvertise = req.query.productAdvertise;
      if (email) { 
        const query = { email: email };
        const myProducts = await sellingProductCollection.find(query).toArray();
        res.send(myProducts);
      } 
      else if (productAdvertise === "advertising") {
        const query = { productAdvertise: productAdvertise };
        const advertised = await sellingProductCollection.find(query).toArray();
        res.send(advertised);
      } 
      else {
        res.status(400).send("Invalid request. Please provide either 'email' or 'productAdvertise' query parameter.");
      }
    });
    app.post('/sellingProducts', async (req, res) => {
      const sellingProduct = req.body;
      const result = await sellingProductCollection.insertOne(sellingProduct);
      res.send(result);
    })
    app.put('/sellingProducts/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          productAdvertise: 'advertising'
        }
      };
      const result = await sellingProductCollection.updateOne(filter, updateDoc, options);
      res.send(result)
    })
    app.delete('/sellingProducts/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const result = await sellingProductCollection.deleteOne(filter);
      res.send(result);
    })
    app.get('/users/buyer', async (req, res) => {
        const query = {userType: 'user'};
        const buyer = await usersCollection.find(query).toArray();
        res.send(buyer);
    })
    app.get('/users/seller', async (req,res) =>{
      const query = {userType: 'seller'};
      const seller = await usersCollection.find(query).toArray();
      res.send(seller);
    })
    app.delete('/users/buyer/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    })
    app.delete('/users/seller/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    })
    app.post('/users', async (req, res) => {
      const { name, email, userType } = req.body;
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        console.log('User already exists');
        return;
      }
      const user = { name, email, userType };
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
  } finally {

  }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
  res.send('resale mobile server is running')
})

app.listen(port, () => console.log(`Resale mobile running on ${port}`))