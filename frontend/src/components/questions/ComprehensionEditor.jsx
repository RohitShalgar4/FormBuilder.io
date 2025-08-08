import React from 'react'
import { Plus, Trash2 } from 'lucide-react'

const ComprehensionEditor = ({ question, onUpdate }) => {
  const { settings } = question

  const updatePassage = (passage) => {
    onUpdate({
      settings: { ...settings, passage }
    })
  }

  const updateMaxScore = (maxScore) => {
    onUpdate({
      settings: { ...settings, maxScore: parseInt(maxScore) || 0 }
    })
  }

  const addQuestion = () => {
    const newQuestion = {
      question: 'New question?',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: 0,
      score: 1
    }
    const newQuestions = [...settings.questions, newQuestion]
    onUpdate({
      settings: { ...settings, questions: newQuestions }
    })
  }

  const updateQuestion = (qIndex, field, value) => {
    const newQuestions = [...settings.questions]
    newQuestions[qIndex] = { ...newQuestions[qIndex], [field]: value }
    onUpdate({
      settings: { ...settings, questions: newQuestions }
    })
  }

  const updateQuestionScore = (qIndex, score) => {
    const newQuestions = [...settings.questions]
    newQuestions[qIndex] = { ...newQuestions[qIndex], score: parseInt(score) || 1 }
    onUpdate({
      settings: { ...settings, questions: newQuestions }
    })
  }

  const updateOption = (qIndex, optionIndex, value) => {
    const newQuestions = [...settings.questions]
    newQuestions[qIndex].options[optionIndex] = value
    onUpdate({
      settings: { ...settings, questions: newQuestions }
    })
  }

  const addOption = (qIndex) => {
    const newQuestions = [...settings.questions]
    newQuestions[qIndex].options.push(`Option ${newQuestions[qIndex].options.length + 1}`)
    onUpdate({
      settings: { ...settings, questions: newQuestions }
    })
  }

  const removeOption = (qIndex, optionIndex) => {
    const newQuestions = [...settings.questions]
    if (newQuestions[qIndex].options.length > 2) {
      newQuestions[qIndex].options.splice(optionIndex, 1)
      // Adjust correct answer if needed
      if (newQuestions[qIndex].correctAnswer >= optionIndex) {
        newQuestions[qIndex].correctAnswer = Math.max(0, newQuestions[qIndex].correctAnswer - 1)
      }
      onUpdate({
        settings: { ...settings, questions: newQuestions }
      })
    }
  }

  const removeQuestion = (qIndex) => {
    if (settings.questions.length > 1) {
      const newQuestions = settings.questions.filter((_, index) => index !== qIndex)
      onUpdate({
        settings: { ...settings, questions: newQuestions }
      })
    }
  }

  // Calculate total max score
  const totalMaxScore = settings.questions?.reduce((sum, q) => sum + (q.score || 1), 0) || 0

  return (
    <div className="space-y-6">
      {/* Reading Passage */}
      <div>
        <label className="text-sm font-medium text-gray-900 mb-2 block">
          Reading Passage
        </label>
        <textarea
          value={settings.passage || ''}
          onChange={(e) => updatePassage(e.target.value)}
          className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          placeholder="Enter the reading passage here..."
        />
      </div>

      {/* Max Score */}
      <div>
        <label className="text-sm font-medium text-gray-900 mb-2 block">
          Maximum Score
        </label>
        <input
          type="number"
          min="0"
          value={settings.maxScore || totalMaxScore}
          onChange={(e) => updateMaxScore(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Enter maximum score"
        />
        <p className="text-xs text-gray-500 mt-1">
          Total score from all questions: {totalMaxScore}
        </p>
      </div>

      {/* Questions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-900">Questions</h4>
          <button
            onClick={addQuestion}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
          >
            <Plus size={16} />
            Add Question
          </button>
        </div>

        <div className="space-y-6">
          {settings.questions.map((q, qIndex) => (
            <div key={qIndex} className="p-4 border border-gray-300 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-900">Question {qIndex + 1}</h5>
                {settings.questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(qIndex)}
                    className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Question Text */}
              <div className="mb-4">
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your question..."
                />
              </div>

              {/* Question Score */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-900 mb-1 block">
                  Question Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={q.score || 1}
                  onChange={(e) => updateQuestionScore(qIndex, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter question score"
                />
              </div>

              {/* Correct Answer (Admin Only) */}
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <label className="text-sm font-medium text-yellow-800 mb-1 block">
                  Correct Answer (Admin Only - Hidden from Users)
                </label>
                <select
                  value={q.correctAnswer || 0}
                  onChange={(e) => updateQuestion(qIndex, 'correctAnswer', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-yellow-50"
                >
                  {q.options.map((option, optionIndex) => (
                    <option key={optionIndex} value={optionIndex}>
                      Option {optionIndex + 1}: {option}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-yellow-600 mt-1">
                  This correct answer is only visible to admins and used for automatic scoring
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {q.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={q.correctAnswer === optionIndex}
                      onChange={() => updateQuestion(qIndex, 'correctAnswer', optionIndex)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(qIndex, optionIndex, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                    {q.options.length > 2 && (
                      <button
                        onClick={() => removeOption(qIndex, optionIndex)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  onClick={() => addOption(qIndex)}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add Option
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Preview</h4>
        <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
          {settings.passage && (
            <div className="mb-4">
              <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                {settings.passage}
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            {settings.questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-white p-3 rounded border">
                <p className="font-medium text-gray-900 mb-3">
                  {qIndex + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`preview-${qIndex}`}
                        className="text-primary-600"
                        disabled
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComprehensionEditor