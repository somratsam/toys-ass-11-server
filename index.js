const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.n1dwdgt.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const toysCollection = client.db('toyMarketplace').collection('toys');
    const addToyCollection = client.db('toyMarketplace').collection('addToy');

    // Retrieve all toys
    app.get('/toys', async (req, res) => {
      const cursor = toysCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Retrieve all added toys
    app.get('/addToy', async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { sellerEmail: req.query.email };
      }
      const result = await addToyCollection.find(query).toArray();
      res.send(result);
    });

    // Add a toy
    app.post('/addToy', async (req, res) => {
      const addToy = req.body;
      console.log(addToy);
      const result = await addToyCollection.insertOne(addToy);
      res.send(result);
    });

    // Delete a toy
    app.delete('/addToy/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addToyCollection.deleteOne(query);
      res.send(result);
    });

    // Update a toy
    app.put('/addToy/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = { $set: req.body };
      const options = { returnOriginal: false };
      const result = await addToyCollection.findOneAndUpdate(query, update, options);
      res.send(result);
    });

    // Retrieve all toys with sorting
    // Retrieve all toys from both collections
    app.get('/allToys', async (req, res) => {
      const sortDirection = req.query.sort || 'asc'; // Default sorting direction is ascending
      const sortField = 'price'; 
      const sortOptions = {};
      sortOptions[sortField] = sortDirection === 'asc' ? 1 : -1;

      try {
        
        const addToyCursor = addToyCollection.find().sort(sortOptions);

        const [ addedToys] = await Promise.all([ addToyCursor.toArray()]);

        const allToys = [ ...addedToys];
        console.log('All Toys:', allToys)
        res.send(allToys);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });



    // Search toys based on the toy name
    app.get('/toys/search', async (req, res) => {
      const { name } = req.query;

      try {
        const cursor = toysCollection.find({
          name: { $regex: new RegExp(name, 'i') },
        }).limit(20); // Adjust the limit as needed
        const result = await cursor.toArray();
        res.json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Toy server is running');
});

app.listen(port, () => {
  console.log(`Toy server running on port ${port}`);
});
