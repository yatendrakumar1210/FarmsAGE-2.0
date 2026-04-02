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
      
      {/* Category Menu Bar */}
      <div className="bg-white border-b border-gray-100 pt-28 shadow-sm relative z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-4 overflow-x-auto py-4 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab 
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200 translate-y-0" 
                    : "bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent shadow-sm"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="-mt-20">
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
