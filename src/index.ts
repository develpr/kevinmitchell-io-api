const serverless = require('serverless-http');
import * as express from "express";
import * as bodyParser from 'body-parser';
import * as marked from 'marked';

const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: "us-west-2"
});


const app = express()

app.disable('x-powered-by');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.json({"ok": "ok"});
});

app.get('/content/blocks/:id', function(req, res) {

  const params = {
    TableName: "kevinmitchell-io-content-blocks",
    Key: {
      id: req.params.id,
    },
  }
  
  dynamoDb.get(params, (error: any, result: any) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get user' });
    }
    if (result.Item) {    
      let response = result.Item;
      response.html = marked(response.content);        
      res.json(result.Item);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

});

app.get('/content', function (req, res) {
  res.status(404);
  res.json({"error": true, "message":"Please check /content/blogs or /content/blocks for specific content."});
});

module.exports.handler = serverless(app);