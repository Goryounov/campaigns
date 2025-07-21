const express = require('express')
const mongoose = require('mongoose')
const { Pool } = require('pg')

const router = express.Router()

const { smsChannel, telegramChannel } = require('./channels')

const User = mongoose.model('User')
const pool = new Pool({
  user: 'test',
  host: 'localhost',
  database: 'test',
  password: 'test',
  port: 5432,
})

let usersCache = {}

router.post('/campaigns', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1]
    if (!token)
      return res.status(400).send('Invalid token')

    const user = await User.findOne({ token })
    if (!user)
      return res.status(404).send('User not found')

    usersCache[token] = user

    const { name, channels, messages } = req.body
    const channelsString = channels.join(',')

    const campaignResult = await pool.query(
      'INSERT INTO campaigns (name, user_id, channels, created_at) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, user._id, channelsString, new Date()]
    )

    const campaignId = campaignResult.rows[0].id

    for (const message of messages) {
      await pool.query(
        'INSERT INTO messages (campaign_id, phone, tg_id, text, channel_type, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [campaignId, message.phone, message.tg_id, message.text, message.channel, 'pending']
      )
    }

    res.status(201).json({
      id: campaignId,
      userId: user._id,
      name,
      channels,
      messages
    })
  } catch (error) {
    console.error('Error creating campaign', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/campaigns/:id/send', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1]
    if (!token)
      return res.status(400).send('Invalid token')

    const user = usersCache[token]
    if (!user)
      return res.status(404).send('User not found')

    const campaignId = req.params.id

    const campaignResult = await pool.query('SELECT * FROM campaigns WHERE id = $1', [campaignId])
    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const campaign = campaignResult.rows[0]
    const channels = campaign.channels ? campaign.channels.split(',') : []

    const messagesResult = await pool.query('SELECT text, channel_type FROM messages WHERE campaign_id = $1', [campaignId])
    const messages = messagesResult.rows

    const results = []
    for (const message of messages) {
      for (const channel of channels) {
        if (message.channel_type === channel) {
          let result

          if (channel === 'sms') {
            result = await smsChannel.send(message.phone, message.text)
          } else if (channel === 'telegram') {
            result = await telegramChannel.send(message.tg_id, message.text, 'HTML')
          }

          let status = 'pending'
          if (result.success || result.ok) {
            status = 'delivered'
          } else if (result.error || result.error_code) {
            status = 'failed'
          }

          await pool.query(
            'UPDATE messages SET status = $1, sent_at = $2, error_message = $3 WHERE campaign_id = $4 AND text = $5 AND channel_type = $6',
            [
              result.success ? 'delivered' : 'failed',
              new Date(),
              result.error || null,
              campaignId,
              message.text,
              channel
            ]
          )

          results.push(result)
        }
      }
    }

    res.json({
      campaign,
      user,
      results,
      sentAt: new Date()
    })
  } catch (error) {
    console.error('Error sending campaign messages', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const userId = req.body.userId

    const campaignCountResult = await pool.query('SELECT COUNT(*) FROM campaigns')
    const campaignCount = parseInt(campaignCountResult.rows[0].count)
    const campaignResult = await pool.query('SELECT * FROM campaigns WHERE user_id = $1', [userId])
    const campaigns = campaignResult.rows

    const messageCountResult = await pool.query('SELECT COUNT(*) FROM messages')
    const messageCount = parseInt(messageCountResult.rows[0].count)

    const messages = []
    for (const campaign of campaigns) {
      const messagesResult = await pool.query('SELECT text, channel_type FROM messages WHERE campaign_id = $1', [campaign.id])
      messages = [...messages, ...messagesResult.rows]
    }

    res.json({
      campaignCount,
      campaigns,
      messageCount,
      messages
    })
  } catch (error) {
    console.error('Error fetching stats', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router