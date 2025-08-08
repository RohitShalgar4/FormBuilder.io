import React, { useState } from 'react'

const CategorizePreview = ({ question, preview = false }) => {
  const { settings } = question
  const [draggedItem, setDraggedItem] = useState(null)
  const [categoryItems, setCategoryItems] = useState({})
  const [remainingItems, setRemainingItems] = useState([...settings.items])

  const handleDragStart = (item) => {
    setDraggedItem(item)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (category) => {
    if (!draggedItem) return
    
    // Remove from current category if exists
    const newCategoryItems = { ...categoryItems }
    Object.keys(newCategoryItems).forEach(cat => {
      newCategoryItems[cat] = newCategoryItems[cat].filter(item => item !== draggedItem)
    })
    
    // Add to new category
    if (!newCategoryItems[category]) {
      newCategoryItems[category] = []
    }
    newCategoryItems[category].push(draggedItem)
    
    // Remove from remaining items
    setRemainingItems(prev => prev.filter(item => item !== draggedItem))
    setCategoryItems(newCategoryItems)
    setDraggedItem(null)
  }

  const handleDropToRemaining = () => {
    if (!draggedItem) return
    
    // Remove from categories
    const newCategoryItems = { ...categoryItems }
    Object.keys(newCategoryItems).forEach(cat => {
      newCategoryItems[cat] = newCategoryItems[cat].filter(item => item !== draggedItem)
    })
    
    // Add back to remaining if not already there
    if (!remainingItems.includes(draggedItem)) {
      setRemainingItems(prev => [...prev, draggedItem])
    }
    
    setCategoryItems(newCategoryItems)
    setDraggedItem(null)
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
              <div
                key={index}
                className="min-h-[80px] p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 transition-colors hover:border-primary-400 hover:bg-primary-50"
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  e.preventDefault()
                  handleDrop(category)
                }}
              >
                <p className="font-medium text-gray-900 mb-2">{category}</p>
                <div className="space-y-1">
                  {(categoryItems[category] || []).map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="px-2 py-1 bg-primary-100 border border-primary-300 rounded text-primary-800 text-sm cursor-move"
                      draggable={!preview}
                      onDragStart={() => handleDragStart(item)}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Items */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Items to Categorize</h4>
          <div
            className="min-h-[200px] p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 transition-colors hover:border-gray-400"
            onDragOver={handleDragOver}
            onDrop={(e) => {
              e.preventDefault()
              handleDropToRemaining()
            }}
          >
            <div className="space-y-2">
              {remainingItems.map((item, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-move shadow-sm hover:shadow-md transition-shadow"
                  draggable={!preview}
                  onDragStart={() => handleDragStart(item)}
                >
                  {item}
                </div>
              ))}
            </div>
            {remainingItems.length === 0 && (
              <p className="text-gray-500 text-center py-8">All items categorized!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategorizePreview