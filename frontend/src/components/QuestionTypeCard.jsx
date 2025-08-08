import React from 'react'
import { useDrag } from 'react-dnd'

const QuestionTypeCard = ({ questionType }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'QUESTION_TYPE',
    item: { type: questionType.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  const Icon = questionType.icon

  return (
    <div
      ref={drag}
      className={`p-3 border border-gray-200 rounded-lg cursor-move transition-all duration-200 hover:shadow-md hover:border-gray-300 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`${questionType.color} p-2 rounded-lg`}>
          <Icon size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 text-sm">{questionType.title}</h3>
          <p className="text-xs text-gray-600 mt-1">{questionType.description}</p>
        </div>
      </div>
    </div>
  )
}

export default QuestionTypeCard