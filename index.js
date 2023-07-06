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

    app.get('/products', async(req, res) => {
        const query = {};
        const product = await productCollection.find(query).toArray();
        res.send(product);
    })
    app.get('/products/:id', async(req,res) => {
        const productId = req.params.id;
        const query = {_id: new ObjectId(productId)};
        const product = await productCollection.findOne(query);
        // const productsArray = product.products; 
        res.send(product);
    })
    app.post('/bookings', async(req, res) => {
      const booking = req.body;
      
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    })
    app.post('/sellingProducts', async(req, res) => {
      const sellingProduct = req.body;
      const result = await sellingProductCollection.insertOne(sellingProduct);
      res.send(result);
    })
  } finally {
    
  }
}
run().catch(console.dir);


app.get('/', async(req, res) => {
    res.send('resale mobile server is running')
})

app.listen(port, ()=> console.log(`Resale mobile running on ${port}`))