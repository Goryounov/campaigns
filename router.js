const express = require('express');
const mongoose = require('mongoose');
const { Pool } = require('pg');

const router = express.Router();
const { validateEmail, validatePhone } = require('./utils')

const { smsChannel, telegramChannel, vkChannel, whatsAppChannel } = require('./channels');

const User = mongoose.model('User');
const pool = new Pool({
  user: 'test',
  host: 'localhost',
  database: 'test',
  password: 'test',
  port: 5432,
});

let usersCache = {};

router.post('/admin/users/create', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1]
    if (!token)
      return res.status(400).send('Invalid token')

    const adminUser = await User.findOne({ token })
    if (!adminUser)
      return res.status(403).send('Forbidden')

    const userData = req.body;
    if (!validateEmail(userData.email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const user = new User(userData);
    await user.save();

    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user/:id', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1]
    if (!token)
      return res.status(400).send('Invalid token')

    const user = await User.findOne({ token })
    if (!user)
      return res.status(404).send('User not found')

    res.json(user);
  } catch (error) {
    console.error('Error fetching user', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/campaigns', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1]
    if (!token)
      return res.status(400).send('Invalid token')

    const user = await User.findOne({ token })
    if (!user)
      return res.status(404).send('User not found')

    const { name, channels, messages } = req.body;

    usersCache[user._id] = user;
    const channelsString = channels.join(',');

    const campaignResult = await pool.query(
      'INSERT INTO campaigns (name, user_id, channels, created_at) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, user._id, channelsString, new Date()]
    );

    const campaignId = campaignResult.rows[0].id;

    for (const message of messages) {
      await pool.query(
        'INSERT INTO messages (campaign_id, content, channel_type, status) VALUES ($1, $2, $3, $4)',
        [campaignId, message.content, message.channel, 'pending']
      );
    }

    res.status(201).json({
      id: campaignId,
      userId: user._id,
      name,
      channels,
      messages
    });
  } catch (error) {
    console.error('Error creating campaign', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/campaigns', async (req, res) => {
  try {
    const campaignId = req.body.id;

    const campaignResult = await pool.query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = campaignResult.rows[0];
    const channels = campaign.channels ? campaign.channels.split(',') : [];

    const messagesResult = await pool.query('SELECT * FROM messages WHERE campaign_id = $1', [campaignId]);

    res.json({
      ...campaign,
      channels,
      messages: messagesResult.rows
    });
  } catch (error) {
    console.error('Error fetching campaign', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/campaigns/:id/send', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1]
    if (!token)
      return res.status(400).send('Invalid token')

    const user = await User.findOne({ token })
    if (!user)
      return res.status(404).send('User not found')

    const campaignId = req.params.id;

    const campaignResult = await pool.query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = campaignResult.rows[0];
    const channels = campaign.channels ? campaign.channels.split(',') : [];

    const messagesResult = await pool.query('SELECT content, channel_type FROM messages WHERE campaign_id = $1', [campaignId]);
    const messages = messagesResult.rows;

    const results = [];
    for (const message of messages) {
      for (const channel of channels) {
        if (message.channel_type === channel) {
          let result;

          if (channel === 'sms') {
            result = await smsChannel.send(user.phone, message.content);
          } else if (channel === 'telegram') {
            result = await telegramChannel.send(user.telegram, message.content);
          } else if (channel === 'vk') {
            result = await vkChannel.send(user.vk, message.content);
          } else if (channel === 'whatsapp') {
            result = await whatsAppChannel.send(user.whatsapp, message.content);
          }

          let status = 'pending';
          if (result.success || result.ok) {
            status = 'delivered';
          } else if (result.error || result.error_code) {
            status = 'failed';
          }

          await pool.query(
            'UPDATE messages SET status = $1, sent_at = $2, error_message = $3 WHERE campaign_id = $4 AND content = $5 AND channel_type = $6',
            [
              result.success ? 'delivered' : 'failed',
              new Date(),
              result.error || null,
              campaignId,
              message.content,
              channel
            ]
          );

          results.push(result);
        }
      }
    }

    res.json({
      campaign,
      user,
      results,
      sentAt: new Date()
    });
  } catch (error) {
    console.error('Error sending campaign messages', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments();

    const campaignCountResult = await pool.query('SELECT COUNT(*) FROM campaigns');
    const campaignCount = parseInt(campaignCountResult.rows[0].count);

    const messageCountResult = await pool.query('SELECT COUNT(*) FROM messages');
    const messageCount = parseInt(messageCountResult.rows[0].count);

    res.json({
      userCount,
      campaignCount,
      messageCount
    });
  } catch (error) {
    console.error('Error fetching stats', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;