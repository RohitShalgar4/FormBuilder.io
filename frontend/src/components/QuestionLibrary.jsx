import React from 'react'
import { Grid3X3, FileText, BookOpen } from 'lucide-react'
import QuestionTypeCard from './QuestionTypeCard'

const questionTypes = [
  {
    type: 'categorize',
    title: 'Categorize',
    description: 'Drag and drop items into categories',
    icon: Grid3X3,
    color: 'bg-blue-500'
  },
  {
    type: 'cloze',
    title: 'Cloze',
    description: 'Fill in the blanks in text',
    icon: FileText,
    color: 'bg-green-500'
  },
  {
    type: 'comprehension',
    title: 'Comprehension',
    description: 'Reading passage with questions',
    icon: BookOpen,
    color: 'bg-purple-500'
  }
]

const QuestionLibrary = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Question Types</h2>
      <div className="space-y-3">
        {questionTypes.map((questionType) => (
          <QuestionTypeCard
            key={questionType.type}
            questionType={questionType}
          />
        ))}
      </div>
    </div>
  )
}

export default QuestionLibrary