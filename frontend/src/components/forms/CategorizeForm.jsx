import React, { useState, useEffect, useCallback } from 'react'
import { useDrag, useDrop } from 'react-dnd'

const CategorizeForm = ({ question, answer = {}, onChange, error }) => {
  // Add safety check for question and settings
  if (!question || !question.settings) {
    return (
      <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
        <p className="text-gray-500">Loading question...</p>
      </div>
    )
  }

  const { settings } = question
  const [categoryItems, setCategoryItems] = useState({})
  const [remainingItems, setRemainingItems] = useState([])
  const [initialized, setInitialized] = useState(false)

  // Initialize only once when component mounts
  useEffect(() => {
    if (!initialized && settings.items && settings.categories) {
      console.log('📦 CategorizeForm - Initial setup')
      
      if (answer && typeof answer === 'object' && Object.keys(answer).length > 0) {
        setCategoryItems(answer)
        const assignedItems = Object.values(answer).flat()
        const remaining = settings.items.filter(item => !assignedItems.includes(item))
        setRemainingItems(remaining)
      } else {
        setCategoryItems({})
        setRemainingItems([...settings.items])
      }
      
      setInitialized(true)
    }
  }, [initialized, settings.items, settings.categories, answer])

  // Memoized move functions to prevent recreation
  const moveItemToCategory = useCallback((item, category) => {
    console.log('🚀 Moving item to category:', item, category)
    
    setCategoryItems(prev => {
      const newCategoryItems = { ...prev }
      
      // Remove item from all categories first
      Object.keys(newCategoryItems).forEach(cat => {
        if (newCategoryItems[cat]) {
          newCategoryItems[cat] = newCategoryItems[cat].filter(i => i !== item)
        }
      })
      
      // Add to new category
      if (!newCategoryItems[category]) {
        newCategoryItems[category] = []
      }
      newCategoryItems[category] = [...newCategoryItems[category], item]
      
      // Notify parent
      if (onChange) {
        onChange(newCategoryItems)
      }
      
      return newCategoryItems
    })
    
    // Update remaining items
    setRemainingItems(prev => prev.filter(i => i !== item))
  }, [onChange])

  const moveItemToRemaining = useCallback((item) => {
    console.log('🔄 Moving item back to remaining:', item)
    
    setCategoryItems(prev => {
      const newCategoryItems = { ...prev }
      
      // Remove from all categories
      Object.keys(newCategoryItems).forEach(cat => {
        if (newCategoryItems[cat]) {
          newCategoryItems[cat] = newCategoryItems[cat].filter(i => i !== item)
        }
      })
      
      // Notify parent
      if (onChange) {
        onChange(newCategoryItems)
      }
      
      return newCategoryItems
    })
    
    // Add back to remaining items
    setRemainingItems(prev => {
      if (!prev.includes(item)) {
        return [...prev, item]
      }
      return prev
    })
  }, [onChange])

  // Draggable Item Component
  const DraggableItem = ({ item, source }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: 'categorize-item',
      item: { item, source },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }), [item, source])

    return (
      <div
        ref={drag}
        className={`px-3 py-2 rounded-lg cursor-move transition-all select-none ${
          source === 'remaining' 
            ? 'bg-white border border-gray-300 shadow-sm hover:shadow-md' 
            : 'bg-blue-100 border border-blue-300 text-blue-800'
        } ${isDragging ? 'opacity-50' : ''}`}
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {item}
      </div>
    )
  }

  // Droppable Category Component
  const DroppableCategory = ({ category, items = [] }) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
      accept: 'categorize-item',
      drop: (draggedItem, monitor) => {
        if (monitor.didDrop()) {
          return
        }
        console.log('📥 Dropped item in category:', draggedItem.item, category)
        moveItemToCategory(draggedItem.item, category)
        return { moved: true }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }), [category, moveItemToCategory])

    const isActive = isOver && canDrop

    return (
      <div
        ref={drop}
        className={`min-h-[80px] p-3 border-2 border-dashed rounded-lg transition-all ${
          isActive 
            ? 'border-blue-400 bg-blue-50 shadow-lg' 
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        <p className="font-medium text-gray-900 mb-2">{category}</p>
        <div className="space-y-1">
          {items.map((item, itemIndex) => (
            <DraggableItem 
              key={`${item}-${itemIndex}-${category}`} 
              item={item} 
              source="category" 
            />
          ))}
          {items.length === 0 && (
            <p className="text-gray-400 text-sm italic">Drop items here</p>
          )}
        </div>
      </div>
    )
  }

  // Droppable Remaining Items Area
  const DroppableRemaining = () => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
      accept: 'categorize-item',
      drop: (draggedItem, monitor) => {
        if (monitor.didDrop()) {
          return
        }
        console.log('📥 Dropped item back to remaining:', draggedItem.item)
        moveItemToRemaining(draggedItem.item)
        return { moved: true }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }), [moveItemToRemaining])

    const isActive = isOver && canDrop

    return (
      <div
        ref={drop}
        className={`min-h-[200px] p-3 border-2 border-dashed rounded-lg transition-all ${
          isActive 
            ? 'border-gray-400 bg-gray-100 shadow-lg' 
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <div className="space-y-2">
          {remainingItems.map((item, index) => (
            <DraggableItem 
              key={`${item}-${index}-remaining`} 
              item={item} 
              source="remaining" 
            />
          ))}
        </div>
        {remainingItems.length === 0 && (
          <p className="text-gray-500 text-center py-8">All items categorized! 🎉</p>
        )}
      </div>
    )
  }

  if (!initialized) {
    return (
      <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
        <p className="text-gray-500">Initializing...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Categories</h4>
          <div className="space-y-3">
            {(settings.categories || []).map((category, index) => (
              <DroppableCategory 
                key={`${category}-${index}`} 
                category={category} 
                items={categoryItems[category] || []} 
              />
            ))}
            {(!settings.categories || settings.categories.length === 0) && (
              <p className="text-gray-500 italic">No categories defined</p>
            )}
          </div>
        </div>
        
        {/* Items */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Available Items</h4>
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

export default CategorizeForm