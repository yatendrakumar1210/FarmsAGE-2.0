import React, { useState } from 'react'
import CategoryProducts from '../components/sections/CategoryProducts'
import productsData from '../data/products'
import fruitsData from '../data/fruits'
import dairyData from '../data/dairy'
import organicData from '../data/organic'
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

// De-duplicate items based on name to prevent ID collisions from multiple files
const combineDistinctProducts = () => {
  const allArrays = [...productsData, ...fruitsData, ...organicData];
  const uniqueMap = new Map();
  
  allArrays.forEach(item => {
    // Re-assign ID using name to avoid key duplications since mock IDs overlap across files
    uniqueMap.set(item.name, { ...item, id: item.name });
  });
  
  return Array.from(uniqueMap.values());
};

const AllProducts = () => {
  const [activeTab, setActiveTab] = useState('All');

  const allItems = combineDistinctProducts();
  const vegetablesOnly = productsData.filter(p => !['Apple', 'Banana'].includes(p.name)).map(p => ({...p, id: p.name}));
  
  const categoryMap = {
    'All': allItems,
    'Vegetables': vegetablesOnly,
    'Fruits': fruitsData.map(p => ({...p, id: p.name})),
    // 'Dairy': dairyData.map(p => ({...p, id: p.name})),
    'Organic': organicData.map(p => ({...p, id: p.name}))
  };

  const tabs = ['All', 'Fruits', 'Vegetables', 'Organic'];

  return (
    <>
      <Navbar />
      
      <div className="pt-0">
        <CategoryProducts
          title={activeTab === 'All' ? "All Products" : `${activeTab} Collection`}
          productsData={categoryMap[activeTab]}
        />
      </div>
      <Footer />
    </>
  );
}

export default AllProducts;
