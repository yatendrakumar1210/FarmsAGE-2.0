import React from 'react'
import CategoryProducts from '../components/sections/CategoryProducts'
import fruitsData from '../data/fruits'
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const Fruits = () => {
  return (
    <>
    <Navbar/>
      <div>
        <CategoryProducts title="Seasonal Fruits" productsData={fruitsData} />
      </div>
      <Footer/>
    </>
  );
}

export default Fruits

