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

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function (req, res) {
  res.status(418);
  res.json({"teapot": true});
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
      res.status(400).json({ error: 'Could not load block.' });
    }
    if (result.Item) {    
      let response = result.Item;
      response.html = marked(response.content);        
      res.json(response);
    } else {
      res.status(404).json({ error: "Block not found" });
    }
  });
});


app.get('/content/blogs/:slug', function(req, res) {
  const params = {
    TableName: "kevinmitchell-io-content-blogs",
    FilterExpression: "slug = :slug",    
    ExpressionAttributeValues: {
         ":slug": req.params.slug
    }
  }
  dynamoDb.scan(params, (error: any, result: any) => {
    if (error) {      
      res.status(400).json({ error: 'Could not load blog post.' });
    }
    
    if (result.Items && result.Items.length > 0) {          
      let response = result.Items[0];      
      response.html = marked(response.post);        
      res.json(response);
    } else {
      res.status(404).json({ error: "Blog post not found" });
    }
  });
});


app.get('/content/blogs', function(req, res) {

  let site = req.query.site;

  if( ! site ) {
    res.status(400).json({ error: "'site' parameter required." });
    return;
  }
  
  const params = {
    TableName: "kevinmitchell-io-content-blogs",
    IndexName: "site-dateCreated-index",    
    KeyConditionExpression: 'site = :site',
    ExpressionAttributeValues: {
      ':site': site
    },
    ProjectionExpression: "title,slug,dateCreated",
    ScanIndexForward: false,    // true = ascending, false = descending    
  }  
  dynamoDb.query(params, (error: any, result: any) => {
    if (error) {
      res.status(400).json({ error: 'Could not load blog post.' });
    }    
    if (result.Items) {          
      res.json(result.Items);
    } else {
      res.status(404).json({ error: "Blog post not found" });
    }
  });
});


app.get('/content', function (req, res) {
  res.status(404);
  res.json({"error": true, "message":"Please check /content/blogs or /content/blocks for specific content."});
});

module.exports.handler = serverless(app);