const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

const app = express();

const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_Key);

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

function verifyJWT(req, res, next) {
  console.log(req.headers.authorization);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).send('unauthorized access')
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'forbidden access' })
    }
    req.decoded = decoded;
    next()
  })
}

async function run() {
  try {
    const productCollection = client.db('resaleMobile').collection('products');
    const bookingsCollection = client.db('resaleMobile').collection('bookings');
    const sellingProductCollection = client.db('resaleMobile').collection('sellingProducts');
    const usersCollection = client.db('resaleMobile').collection('users');
    const paymentsCollection = client.db('resaleMobile').collection('payments');

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
    app.get('/brands/:brand', async (req, res) => {
      const brand = req.params.brand;
      const query = { category: brand };
      const productFromProductCollection = await productCollection.find(query).toArray();
      const productFromSellingProductCollection = await sellingProductCollection.find(query).toArray();
      const allProduct = [...productFromProductCollection, ...productFromSellingProductCollection];
      res.json(allProduct)
    })

    app.get('/bookings', verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        res.status(403).send({ message: 'forbidden access' })
      }
      const query = { buyerEmail: email };
      const booking = await bookingsCollection.find(query).toArray();
      res.send(booking);
    })
    app.get('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingsCollection.findOne(query);
      res.send(result);
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
          productAdvertise: 'advertising',
        }
      };
      const result = await sellingProductCollection.updateOne(filter, updateDoc, options);
      res.send(result)
    })
    app.put('/sellingProducts/:id/report', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          productReport: 'reported'
        }
      };
      const result = await sellingProductCollection.updateOne(filter, updateDoc, options);
      res.send(result)
    })
    app.delete('/sellingProducts/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await sellingProductCollection.deleteOne(filter);
      res.send(result);
    })
    app.get('/users', async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const user = await usersCollection.find(query).toArray();
      res.send(user);
    })
    app.get('/users/buyer', async (req, res) => {
      const query = { userType: 'user' };
      const buyer = await usersCollection.find(query).toArray();
      res.send(buyer);
    })
    app.get('/users/seller', async (req, res) => {
      const query = { userType: 'seller' };
      const seller = await usersCollection.find(query).toArray();
      res.send(seller);
    })
    // app.put('/users/seller/:id', async(req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) };
    //   const options = { upsert: true };
    //   const updateDoc = {
    //     $set: {
    //       verify: 'verified',
    //     }
    //   };
    //   const result = await sellingProductCollection.updateOne(filter, updateDoc, options);
    //   res.send(result)
    // })
    app.put('/users/seller/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          verify: 'verified',
        }
      };

      try {
        const existingDoc = await usersCollection.findOne(filter);

        if (!existingDoc) {
          console.log('Document not found:', id);
          return res.status(404).send('Document not found');
        }

        if (existingDoc.verify === 'verified') {
          console.log('Document already verified:', id);
          return res.status(200).send('Document already verified');
        }

        const result = await usersCollection.updateOne(filter, updateDoc, options);

        if (result.modifiedCount > 0) {
          console.log('Document verified:', id);
          res.status(200).send('Document verified');
        } else {
          console.log('Document not modified:', id);
          res.status(200).send('Document not modified');
        }
      } catch (error) {
        console.error('Update Error:', error);
        res.status(500).send('Internal Server Error');
      }
    });
    app.get('/users/seller/verify/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email, userType: 'seller', verify: 'verified' };
      const verifiedSeller = await usersCollection.findOne(query);

      if (verifiedSeller) {
        res.json({ isVerified: true });
      } else {
        res.json({ isVerified: false });
      }
    });


    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.userType === 'admin' })
    })
    app.delete('/users/buyer/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    })
    app.delete('/users/seller/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
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
    app.get('/reportedItems', async (req, res) => {
      const query = { productReport: "reported" };
      const reported = await sellingProductCollection.find(query).toArray();
      res.send(reported);
    })
    app.delete('/reportedItems/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await sellingProductCollection.deleteOne(filter);
      res.send(result);
    })
    app.post('/create-payment-intent', async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: 'bdt',
        amount: amount,
        "payment_method_types": ["card"]
      })
      console.log(paymentIntent)
      res.send({ clientSecret: paymentIntent.client_secret });
    })
    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transectionId: payment.transectionId

        }
      }
      const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })
    app.get('/jwt', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.find(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '2h' })
        return res.send({ accessToken: token })
      }

      res.status(403).send({ accrssToken: '' })
    })


  } finally {

  }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
  res.send('resale mobile server is running')
})

app.listen(port, () => console.log(`Resale mobile running on ${port}`))