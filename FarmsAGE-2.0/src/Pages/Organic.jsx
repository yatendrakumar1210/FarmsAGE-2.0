import React from 'react'
import CategoryProducts from '../components/sections/CategoryProducts'
import organicData from '../data/organic'
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const Organic = () => {
  return (
    <>
    <Navbar/>
      <div>
        <CategoryProducts title="Organic Products" productsData={organicData} />
      </div>
    <Footer/>
    </>
  );
}

export default Organic

