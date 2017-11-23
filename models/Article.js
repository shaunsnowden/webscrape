var mongoose = require("mongoose");

// to the Schema constructor
var Schema = mongoose.Schema;


var ArticleSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: false
  },
  type: {
    type: String,
    required: false
  },
  localLink: {
    type: String,
    required: true
  },
  note: {
    type: Schema.Types.ObjectId,
    ref: "Note"
  }
});

// This creates our model from the above schema, using mongoose's model method
var Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;
