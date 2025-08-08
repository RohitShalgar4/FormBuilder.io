import React, { useState, useEffect } from 'react'

const CategorizeForm = ({ question, answer = {}, onChange, error }) => {
  const { settings } = question
  const [categoryItems, setCategoryItems] = useState(answer || {})
  const [remainingItems, setRemainingItems] = useState([])

  useEffect(() => {
    // Initialize remaining items
    const assignedItems = Object.values(categoryItems).flat()
    const remaining = settings.items.filter(item => !assignedItems.includes(item))
    setRemainingItems(remaining)
  }, [settings.items, categoryItems])

  useEffect(() => {
    onChange(categoryItems)
  }, [categoryItems, onChange])

  const moveItemToCategory = (item, category) => {
    const newCategoryItems = { ...categoryItems }
    
    // Remove item from all categories
    Object.keys(newCategoryItems).forEach(cat => {
      newCategoryItems[cat] = (newCategoryItems[cat] || []).filter(i => i !== item)
    })
    
    // Add to new category
    if (!newCategoryItems[category]) {
      newCategoryItems[category] = []
    }
    newCategoryItems[category].push(item)
    
    setCategoryItems(newCategoryItems)
  }

  const removeItemFromCategory = (item) => {
    const newCategoryItems = { ...categoryItems }
    Object.keys(newCategoryItems).forEach(cat => {
      newCategoryItems[cat] = (newCategoryItems[cat] || []).filter(i => i !== item)
    })
    setCategoryItems(newCategoryItems)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Categories</h4>
          <div className="space-y-3">
            {settings.categories.map((category, index) => (
              <div key={index} className="min-h-[80px] p-3 border-2 border-gray-300 rounded-lg bg-gray-50">
                <p className="font-medium text-gray-900 mb-2">{category}</p>
                <div className="space-y-1">
                  {(categoryItems[category] || []).map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center justify-between px-2 py-1 bg-primary-100 border border-primary-300 rounded text-primary-800 text-sm">
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => removeItemFromCategory(item)}
                        className="text-primary-600 hover:text-primary-800 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Items */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Available Items</h4>
          <div className="space-y-2">
            {remainingItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg">
                <span>{item}</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      moveItemToCategory(item, e.target.value)
                    }
                  }}
                  className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
                  value=""
                >
                  <option value="">Move to...</option>
                  {settings.categories.map((category, catIndex) => (
                    <option key={catIndex} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {remainingItems.length === 0 && (
              <p className="text-gray-500 text-center py-4">All items have been categorized!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategorizeForm