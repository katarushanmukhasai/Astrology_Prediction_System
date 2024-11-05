const { response, request } = require('express')
const express = require('express')
const axios = require('axios');
const {MongoClient}=require('mongodb')
const cors = require('cors')
const app = express()
app.use(express.urlencoded({extended : true}));
app.use(cors())
app.use(express.json())


const uri = "mongodb+srv://admin:admin@cluster0.yhpwxwk.mongodb.net/?retryWrites=true&w=majority"
const client = new MongoClient(uri);
client.connect((err) => {
  if (err) {
    console.log('Error connecting to MongoDB Atlas', err);
  } else {
    console.log('Connected to MongoDB Atlas');
  }
});

const db = client.db("Astrology");
const col = db.collection("Register");
const cont = db.collection("Contact");
const prof = db.collection("Profile");
const log = db.collection("Status");


app.get('/adminreg', async (request, response) => {
  try {
    const data = await col.find().toArray();
    response.send(data);
  } catch (err) {
    console.log(err);
    response.status(500).send('Internal Server Error');
  }
});

app.get('/admincont', async (request, response) => {
  try {
    const contactData = await cont.find().toArray();
    response.json(contactData);
  } catch (error) {
    console.error(error);
    response.status(500).send('Internal server error');
  }
});

app.get('/adminprof', async (request, response) => {
  try {
    const profileData = await prof.find().toArray();
    response.json(profileData);
  } catch (error) {
    console.error(error);
    response.status(500).send('Internal server error');
  }
});

app.get('/adminstat', async (request, response) => {
  try {
    const statusData = await log.find().toArray();
    response.json(statusData);
  } catch (error) {
    console.error(error);
    response.status(500).send('Internal server error');
  }
});




app.post('/profile', async (request, response) => {
  const name = request.body.name;
  const surname = request.body.surname;
  const age = request.body.age
  const Phn = request.body.Phn;
  const dob = request.body.dob;
  const sign = request.body.sign;
  const state = request.body.state;
  const email = request.body.email;
  const country = request.body.country;
  const gender = request.body.gender;

  // Check if email exists in database
  const emailExists = await prof.findOne({ email });
  if (emailExists) {
    response.send("Email already exists");
  }
  else{
    // Check if phone number exists in database
    const phoneExists = await prof.findOne({ Phn });
    if (phoneExists) {
      response.send("Phone number already exists");
    }
    else{
      const data = {
        name,
        surname,
        age,
        Phn,
        dob,
        sign,
        state,
        email,
        country,
        gender
      };
    
      // Insert the data into the database
      prof.insertOne(data);
      console.log(data);
      response.send(data);
    }
  }

  

  
});



app.post('/', async (request, response) => {
  try {
  const existingUser = await col.findOne({ username: request.body.username });
  if (existingUser) {
    console.log(`Username already exists in the database with _id: ${existingUser._id}`);
    response.send("Username already exists in the database");
  } else {
    const existingEmail = await col.findOne({ email: request.body.email });
    
    if (existingEmail) {
      console.log(`Email already exists in the database with _id: ${existingEmail._id}`);
      response.send("Email already exists in the database");
    } else {
      const result = await col.insertOne(request.body);
      console.log(`Inserted document with _id: ${result.insertedId}`);
      response.send("Saved successfully");
    }
  }
} catch (error) {
  console.error(error);
  response.send("Error");
  }
  });  




  app.get('/check', async (request, response) => {
    console.log(request.query);
    try {
      const result = await col.findOne({ email: request.query.un });
      console.log(result);
      if (result == null) {
        response.send("fail");
      } else {
        if (result.password == request.query.pw) {
          const mail = result.email;
          const existingLog = await log.findOne({ mail });
          if (existingLog) {
            await log.updateOne({ mail }, { $set: { stat: true } });
          } else {
            const res = await log.insertOne({ mail, stat: true });
          }
          response.send("pass");
        } else {
          response.send("fail");
        }
      }
    } catch (error) {
      console.error(error);
      response.send("error");
    }
  });
  
  

app.post('/cot',async (request,response)=>{
  console.log(request.body);
  const result = await cont.insertOne(request.body);
  console.log("Detailes saves");
  response.send("Saved successfully");
})
 

app.get('/display', async (req, res) => {
  try {
    // Find the email address of the user whose stat value is true
    const logResult = await log.findOne({ stat: true }).projection({email: 1}).toArray();
    if (!logResult || logResult.length === 0) {
      return res.send('User not found');
    }

    // Retrieve the profile data for the user using their email address
    const profileResult = await prof.findOne({ email: logResult[0].email }).toArray();
    if (!profileResult || profileResult.length === 0) {
      return res.send('Profile not found');
    }

    // Send the profile data as a response
    console.log(profileResult)
    res.send(profileResult[0]);
  } catch (error) {
    console.error(error);
    res.send('Internal server error');
  }
});

app.get('/find', async (req, res) => {
  try {
    // Find the email address of the user whose stat value is true
    const logResult = await log.findOne({ stat: true }, { projection: { mail: 1 } });
    if (!logResult) {
      return res.send('User not found');
    }
    console.log(logResult.mail);

    // Find the user's profile details using their email address
    const profResult = await prof.findOne({ email: logResult.mail });
    if (!profResult) {
      return res.send('Profile not found');
    }

    // Send the profile details as the response
    res.send(profResult);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});




app.get('/logout', async (req, res) => {
  try {
    // Update the status of all users whose stat value is true
    const updateResult = await log.updateMany({ stat: true }, { $set: { stat: false } });
    if (!updateResult || updateResult.modifiedCount === 0) {
      return res.send('Logout failed');
    }

    // Send logout success message as response
    res.send('Logout successful');
  } catch (error) {
    console.error(error);
    res.send('Internal server error');
  }
});


app.get('/data', async (req, res) => {
  try {
    // Find the email address of the user whose stat value is true
    const logResult = await log.findOne({ stat: true }, { projection: { mail: 1 } });
    if (!logResult) {
      return res.send('User not found');
    }
    console.log(logResult.mail);
    
    // Find the user's profile using their email address
    const profileResult = await prof.findOne({ email: logResult.mail }, { projection: { name: 1 } });
    if (!profileResult) {
      return res.send('Profile not found');
    }
    
    // Send the user's username as response
    res.send(profileResult.name);
    
  } catch (error) {
    console.error(error);
    res.send('Internal server error');
  }
});









app.get('/horoscope/:sign', async (req, res) => {
  try {
    const { sign } = req.params;
    const options = {
      method: 'GET',
      url: 'https://horoscope-astrology.p.rapidapi.com/sign',
      params: { s: sign },
      headers: {
        'X-RapidAPI-Key': '5c5a401d23msh45240c508797ed1p16c92ajsn7086b7abb3d4',
        'X-RapidAPI-Host': 'horoscope-astrology.p.rapidapi.com',
      },
    };
    const response = await axios.request(options);
    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});



app.get('/compatibility', async (req, res) => {
  const { sign1, sign2 } = req.query;

  const options = {
    method: 'GET',
    url: 'https://horoscope-astrology.p.rapidapi.com/affinity',
    params: { sign1, sign2 },
    headers: {
      'X-RapidAPI-Key': '5c5a401d23msh45240c508797ed1p16c92ajsn7086b7abb3d4',
      'X-RapidAPI-Host': 'horoscope-astrology.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    res.status(200).send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.get('/tarotcards', async (req, res) => {
  let cachedData = null;
  if (cachedData) {
    res.status(200).send(cachedData);
    return;
  }

  const options = {
    method: 'GET',
    url: 'https://horoscope-astrology.p.rapidapi.com/threetarotcards',
    headers: {
      'X-RapidAPI-Key': '5c5a401d23msh45240c508797ed1p16c92ajsn7086b7abb3d4',
      'X-RapidAPI-Host': 'horoscope-astrology.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    console.log(response.data)
    cachedData = response.data;
    res.status(200).send(cachedData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});






const PORT = process.env.PORT || 8081;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  //app.listen(8081)
  //console.log("Server started")