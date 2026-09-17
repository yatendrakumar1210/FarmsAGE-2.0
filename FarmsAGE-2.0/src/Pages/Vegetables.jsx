import React from 'react';
import CategoryProducts from '../components/sections/CategoryProducts';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const Vegetables = () => {
  return (
    <>
      <Navbar />
      <div>
        <CategoryProducts title="Fresh Vegetables" category="Vegetables" />
      </div>
      <Footer />
    </>
  );
};

export default Vegetables;
