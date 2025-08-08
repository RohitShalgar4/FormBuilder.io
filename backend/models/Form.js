const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['categorize', 'cloze', 'comprehension'], 
    required: true 
  },
  title: { type: String, required: true },
  description: String,
  image: String,
  required: { type: Boolean, default: false },
  settings: {
    // For Categorize questions
    categories: [String],
    items: [String],
    
    // For Cloze questions
    text: String,
    blanks: [String],
    
    // For Comprehension questions
    passage: String,
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number
    }]
  }
}, { _id: false });

const formSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  headerImage: String,
  questions: [questionSchema],
  isPublished: { type: Boolean, default: false },
  shareId: { type: String, unique: true },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Form', formSchema);