import React from 'react'
import CategoryProducts from '../components/sections/CategoryProducts'
import productsData from '../data/products'
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const Vegetables = () => {
  // Filter out any known fruits from the generic products list if they exist
  const vegetablesData = productsData.filter(
    (product) => !['Apple', 'Banana'].includes(product.name)
  );

  return (
    <>
    <Navbar/>
      <div>
        <CategoryProducts
          title="Fresh Vegetables"
          productsData={vegetablesData}
        />
      </div>
      <Footer/>
    </>
  );
}

export default Vegetables

