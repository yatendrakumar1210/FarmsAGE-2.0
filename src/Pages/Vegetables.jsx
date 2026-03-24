import React from 'react'
import CategoryProducts from '../components/sections/CategoryProducts'
import productsData from '../data/products'

const Vegetables = () => {
  // Filter out any known fruits from the generic products list if they exist
  const vegetablesData = productsData.filter(
    (product) => !['Apple', 'Banana'].includes(product.name)
  );

  return (
    <div>
      <CategoryProducts title="Fresh Vegetables" productsData={vegetablesData} />
    </div>
  )
}

export default Vegetables
