import React, { useState, useEffect } from 'react'

const ClozeForm = ({ question, answer = {}, onChange, error }) => {
  const { settings } = question
  const [answers, setAnswers] = useState(answer || {})

  useEffect(() => {
    onChange(answers)
  }, [answers, onChange])

  const handleAnswerChange = (blankIndex, value) => {
    const newAnswers = { ...answers, [blankIndex]: value }
    setAnswers(newAnswers)
  }

  const renderTextWithBlanks = () => {
    let text = settings.text || ''
    const blankPattern = /\[(.*?)\]/g
    let blankIndex = 0
    
    const parts = text.split(blankPattern)
    const result = []
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Regular text
        if (parts[i]) {
          result.push(
            <span key={`text-${i}`}>{parts[i]}</span>
          )
        }
      } else {
        // This is a blank
        const currentBlankIndex = blankIndex
        result.push(
          <input
            key={`blank-${blankIndex}`}
            type="text"
            value={answers[currentBlankIndex] || ''}
            onChange={(e) => handleAnswerChange(currentBlankIndex, e.target.value)}
            className="inline-block px-2 py-1 border border-gray-300 rounded bg-white min-w-[100px] mx-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={`Blank ${blankIndex + 1}`}
          />
        )
        blankIndex++
      }
    }
    
    return result
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 leading-relaxed text-gray-900">
        {renderTextWithBlanks()}
      </div>
      
      {settings.blanks && settings.blanks.length > 0 && (
        <div className="text-sm text-gray-600">
          <p>Fill in the blanks ({settings.blanks.length} total)</p>
        </div>
      )}
    </div>
  )
}

export default ClozeForm