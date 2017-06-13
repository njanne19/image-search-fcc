//Requirements
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const Bing = require('node-bing-api')({accKey: 'ad66f89d3a0c4a3c9c673dcf91bbb60f'});
var jade = require('jade');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));

//Importing Mongoose Schema
const searchTerm = require('./models/searchTerm');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/searchTerms');


app.use(bodyParser.json());
app.use(cors());

//Home instruction page
app.get('/', (req, res, next) => {
  res.render('index');
});

//GET Call for image search + optional query
app.get('/api/imagesearch/:searchVal*', (req, res, next) => {
  var {
    searchVal
  } = req.params;
  var {
    offset
  } = req.query;

  var data = new searchTerm({
    searchVal,
    searchDate: new Date()
  });

  //Saving data back to DB
  data.save((err) => {
    if (err) {
      res.send('Error Saving');
    }
  });

  var searchOffset;
  if (offset) {
    if (offset == 1) {
      offset = 0;
      searchOffset = 1;
    } else if (offset > 1) {
      searchOffset = offset + 1;
    }
  }

  Bing.images(searchVal, {
    top: (10 * searchOffset),
    skip: (10 * offset)
  }, function(error, rez, body) {
    let bingData = [];

    for (var i = 0; i < 10; i++) {
      bingData.push({
        url: body.value[i].webSearchUrl,
        snippet: body.value[i].name,
        thumbnail: body.value[i].thumbnailUrl,
        context: body.value[i].hostPageDisplayUrl
      });
    }
    res.json(bingData);
  });


});


app.get('/api/recent', (req, res, next) => {
  searchTerm.find({}, (err, data) => {

    let historyData = [];
    for (var i = 0; i < data.length; i++) {
      historyData.push({
        "keyword": data[i].searchVal,
        "time-stamp": data[i].searchDate
      });
    }
    res.json(historyData);
  });
});



app.listen(process.env.PORT || 3000, () => {
  console.log("You good B");
});
