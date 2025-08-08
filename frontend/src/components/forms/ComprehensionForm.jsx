import React, { useState, useEffect } from 'react'

const ComprehensionForm = ({ question, answer = {}, onChange, error }) => {
  const { settings } = question
  const [answers, setAnswers] = useState(answer || {})

  useEffect(() => {
    onChange(answers)
  }, [answers, onChange])

  const handleAnswerChange = (questionIndex, optionIndex) => {
    const newAnswers = { ...answers, [questionIndex]: optionIndex }
    setAnswers(newAnswers)
  }

  return (
    <div className="space-y-6">
      {/* Reading Passage */}
      {settings.passage && (
        <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Reading Passage</h4>
          <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
            {settings.passage}
          </p>
        </div>
      )}
      
      {/* Questions */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Questions</h4>
        {settings.questions.map((q, qIndex) => (
          <div key={qIndex} className="p-4 border border-gray-300 rounded-lg bg-white">
            <p className="font-medium text-gray-900 mb-3">
              {qIndex + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((option, optionIndex) => (
                <label 
                  key={optionIndex} 
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                >
                  <input
                    type="radio"
                    name={`question-${qIndex}`}
                    value={optionIndex}
                    checked={answers[qIndex] === optionIndex}
                    onChange={() => handleAnswerChange(qIndex, optionIndex)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ComprehensionForm