import React, { useState, useEffect } from 'react'
import { useDrag, useDrop } from 'react-dnd'

const CategorizePreview = ({ question, preview = false }) => {
  const { settings } = question
  const [categoryItems, setCategoryItems] = useState({})
  const [remainingItems, setRemainingItems] = useState([...settings.items])

  // Initialize remaining items when component mounts or settings change
  useEffect(() => {
    const assignedItems = Object.values(categoryItems).flat()
    const remaining = settings.items.filter(item => !assignedItems.includes(item))
    setRemainingItems(remaining)
  }, [settings.items]) // Only depend on settings.items to avoid infinite loop

  const moveItemToCategory = (item, category) => {
    setCategoryItems(prev => {
      const newCategoryItems = { ...prev }
      
      // Remove item from all categories
      Object.keys(newCategoryItems).forEach(cat => {
        newCategoryItems[cat] = (newCategoryItems[cat] || []).filter(i => i !== item)
      })
      
      // Add to new category
      if (!newCategoryItems[category]) {
        newCategoryItems[category] = []
      }
      newCategoryItems[category].push(item)
      
      return newCategoryItems
    })

    // Update remaining items
    setRemainingItems(prev => prev.filter(i => i !== item))
  }

  const moveItemToRemaining = (item) => {
    setCategoryItems(prev => {
      const newCategoryItems = { ...prev }
      Object.keys(newCategoryItems).forEach(cat => {
        newCategoryItems[cat] = (newCategoryItems[cat] || []).filter(i => i !== item)
      })
      return newCategoryItems
    })

    // Add back to remaining items
    setRemainingItems(prev => [...prev, item])
  }

  // Draggable Item Component
  const DraggableItem = ({ item, source }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'categorize-item',
      item: { item, source },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    })

    return (
      <div
        ref={drag}
        className={`px-3 py-2 rounded-lg cursor-move transition-all ${
          source === 'remaining' 
            ? 'bg-white border border-gray-300 shadow-sm hover:shadow-md' 
            : 'bg-primary-100 border border-primary-300 text-primary-800'
        } ${isDragging ? 'opacity-50' : ''}`}
      >
        {item}
      </div>
    )
  }

  // Droppable Category Component
  const DroppableCategory = ({ category, items = [] }) => {
    const [{ isOver }, drop] = useDrop({
      accept: 'categorize-item',
      drop: (item) => moveItemToCategory(item.item, category),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    })

    return (
      <div
        ref={drop}
        className={`min-h-[80px] p-3 border-2 border-dashed rounded-lg transition-colors ${
          isOver 
            ? 'border-primary-400 bg-primary-50' 
            : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50'
        }`}
      >
        <p className="font-medium text-gray-900 mb-2">{category}</p>
        <div className="space-y-1">
          {items.map((item, itemIndex) => (
            <DraggableItem key={`${item}-${itemIndex}`} item={item} source="category" />
          ))}
        </div>
      </div>
    )
  }

  // Droppable Remaining Items Area
  const DroppableRemaining = () => {
    const [{ isOver }, drop] = useDrop({
      accept: 'categorize-item',
      drop: (item) => moveItemToRemaining(item.item),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    })

    return (
      <div
        ref={drop}
        className={`min-h-[200px] p-3 border-2 border-dashed rounded-lg transition-colors ${
          isOver 
            ? 'border-gray-400 bg-gray-100' 
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <div className="space-y-2">
          {remainingItems.map((item, index) => (
            <DraggableItem key={`${item}-${index}`} item={item} source="remaining" />
          ))}
        </div>
        {remainingItems.length === 0 && (
          <p className="text-gray-500 text-center py-8">All items categorized!</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {preview && (
        <p className="text-sm text-gray-600 italic">
          Interactive preview - try dragging items to categories
        </p>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Categories</h4>
          <div className="space-y-3">
            {settings.categories.map((category, index) => (
              <DroppableCategory 
                key={index} 
                category={category} 
                items={categoryItems[category] || []} 
              />
            ))}
          </div>
        </div>
        
        {/* Items */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Items to Categorize</h4>
          <DroppableRemaining />
          {remainingItems.length > 0 && (
            <p className="text-xs text-gray-500 mt-2 italic">
              💡 Drag items to the categories on the left
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CategorizePreview