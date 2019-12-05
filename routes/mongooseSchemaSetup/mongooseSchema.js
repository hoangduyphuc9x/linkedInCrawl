var mongoose = require("mongoose");

profile_collection = "Profile";

var ProfileSchema = new mongoose.Schema({
  publicIdentifier: String,
  body: Array,
  linkToAvatar: String,
  timeStamp: { type: Date, default: Date.now },
  querySearch: String
});

mongoose.model("profile", ProfileSchema, profile_collection);

module.exports = mongoose.model("profile");
