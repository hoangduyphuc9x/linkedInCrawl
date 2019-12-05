var mongoose = require("mongoose");

MONGODB_HOST = "123.31.12.172";
MONGODB_PORT = 27017;
MONGODB_DATABASE = "LinkedInProfile";

mongoose.connect(
  `mongodb://${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}`,
  { useNewUrlParser: true }
);
mongoose.set("useFindAndModify", false);
