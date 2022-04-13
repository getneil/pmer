require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')

const caseTagThePm = require('./cases/tag-the-pm')

const app = express()
const port = 5000

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('hello world!');
})


app.post('/hooks', async (req, res) => {
  const {body} = req;
  const tasks = [];
  if (caseTagThePm.valid(body)) {
    console.log("passed")
    tasks.push(caseTagThePm(body))
  }
  if (tasks.length) {
    console.log(`has tasks ${tasks.length}`);
  } else {
    console.log('no tasks');
  }
  await Promise.all(tasks);
  res.send('');
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})