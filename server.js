const express = require('express')
const mongoose = require('mongoose')
const { Pool } = require('pg')
const bodyParser = require('body-parser')
const http = require('http')

const app = express()
app.use(bodyParser.json())

const PORT = process.env.PORT || 3000

const mongoUri = 'mongodb://test:test@localhost:27017/test'
mongoose.connect(mongoUri).then(() => {
  console.log('Connected to MongoDB')
}).catch(err => {
  console.error('MongoDB connection error', err)
})

const pool = new Pool({
  user: 'test',
  host: 'localhost',
  database: 'test',
  password: 'test',
  port: 5432,
})

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: Number,
  phone: String,
  token: String,
  isActive: Boolean,
})
mongoose.model('User', UserSchema)

const routes = require('./router')

app.use('/api', routes)

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception', error)
})

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection', error)
})

const server = http.createServer(app)

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)

  pool.query(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      channels TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
    
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      campaign_id INTEGER NOT NULL,
      phone TEXT,
      tg_id TEXT,
      text TEXT NOT NULL,
      channel_type VARCHAR(50) NOT NULL,
      status VARCHAR(50),
      sent_at TIMESTAMP,
      error_message TEXT
    )
  `).then(() => {
    console.log('Database tables created if not exists')
  }).catch(err => {
    console.error('Error creating database tables', err)
  })
})