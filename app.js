// app.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');

const hbs = require('hbs');

const app = express();

mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
  password: String,
  profilePic: String,
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: false }));

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
hbs.registerPartials(__dirname + '/views/partials');

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', upload.single('profilePic'), async (req, res) => {
  try {
    const { name, email, phone, address, password1, password2 } = req.body;

    // Check if passwords match
    if (password1 !== password2) {
      return res.status(400).send('Passwords do not match');
    }

    const hashedPassword = await bcrypt.hash(password1, 10);

    const profilePicData = req.file;

    const newUser = new User({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      profilePic: profilePicData ? profilePicData.buffer.toString('base64') : null,
    });

    await newUser.save();
    res.redirect('/login');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.userId = user._id;
      res.redirect('/dashboard');
    } else {
      res.redirect('/login');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/dashboard', async (req, res) => {
  try {
    if (req.session.userId) {
      const user = await User.findById(req.session.userId, '-password');
      res.render('dashboard', { user });
    } else {
      res.redirect('/login');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
