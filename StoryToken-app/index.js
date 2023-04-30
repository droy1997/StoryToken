const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.static('src'));
app.use(express.static('../StoryToken-contract/build/contracts'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name as the file name
  }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.render('index.html');
});

app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const dir = 'src/uploads/';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const filePath = path.join(dir, file.originalname); // Use the original file name as the file name
  fs.renameSync(file.path, filePath);
  res.send(file.originalname);
});

app.listen(3000, () => {
  console.log('StoryToken Dapp listening on port 3000!');
});
