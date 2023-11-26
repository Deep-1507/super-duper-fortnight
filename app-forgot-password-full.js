// app.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const hbs = require('hbs');
const nodemailer = require('nodemailer');

const app = express();

mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  dob: String,
  username: { type: String, unique: true },
  password: String,
  emailOrPhone: String,
  profilePic: String,
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: false }));

// Set up hbs as the view engine
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
hbs.registerPartials(__dirname + '/views/partials');

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-email-password',
  },
});

// Helper function to send email
function sendEmail(to, subject, text) {
  transporter.sendMail({
    from: 'your-email@gmail.com',
    to,
    subject,
    text,
  }, (error, info) => {
    if (error) {
      console.log(`Email sending error: ${error.message}`);
    } else {
      console.log(`Email sent: ${info.response}`);
    }
  });
}

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', upload.single('profilePic'), async (req, res) => {
  try {
    const { name, age, dob, username, password, emailOrPhone } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get the profile picture data from the request
    const profilePicData = req.file;

    // Create a new user with the profile picture data
    const newUser = new User({
      name,
      age,
      dob,
      username,
      password: hashedPassword,
      emailOrPhone,
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
    const { username, password } = req.body;
    const user = await User.findOne({ username });

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

app.get('/forgot-password', (req, res) => {
  res.render('forgot-password');
});

app.post('/forgot-password', async (req, res) => {
  try {
    const { username, emailOrPhone } = req.body;
    const user = await User.findOne({ username, emailOrPhone });

    if (user) {
      // Generate and send email with password reset instructions
      const resetLink = `http://your-website.com/reset-password?username=${username}`;
      const emailText = `Click on the following link to reset your password: ${resetLink}`;
      sendEmail(user.emailOrPhone, 'Password Reset', emailText);

      res.redirect('/login');
    } else {
      res.redirect('/forgot-password');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/reset-password', (req, res) => {
  res.render('reset-password');
});

app.post('/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    const username = req.query.username;

    // Reset the user's password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ username }, { password: hashedPassword });

    res.redirect('/login');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
