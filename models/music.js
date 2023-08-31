const mongoose = require("mongoose");

const music = new mongoose.Schema({
  guildId: String,
  channelId: String,
  interactionId: String,
  music: String,
  userId: String,
  title: String,
  uploader: String,
  time: String,
  views: String,
  thumbnail: String,
  video: String,
});

const MessageModel = (module.exports = mongoose.model("music", music));
