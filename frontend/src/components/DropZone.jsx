import React from 'react'
import { useDrop } from 'react-dnd'
import { Plus } from 'lucide-react'

const DropZone = ({ onDrop, isEmpty = false }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'QUESTION_TYPE',
    drop: (item) => {
      onDrop(item.type)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }))

  return (
    <div
      ref={drop}
      className={`drop-zone ${isOver ? 'drag-over' : ''} ${isEmpty ? 'py-16' : 'py-8'}`}
    >
      <div className="flex flex-col items-center gap-3">
        <Plus size={24} className="text-gray-400" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-600">
            {isEmpty ? 'Start building your form' : 'Add another question'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Drag question types from the sidebar or drop them here
          </p>
        </div>
      </div>
    </div>
  )
}

export default DropZone