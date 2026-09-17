import React from 'react';
import CategoryProducts from '../components/sections/CategoryProducts';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const AllProducts = () => {
  return (
    <>
      <Navbar />
      <div className="pt-0">
        <CategoryProducts title="All Products" category="All" />
      </div>
      <Footer />
    </>
  );
};

export default AllProducts;
