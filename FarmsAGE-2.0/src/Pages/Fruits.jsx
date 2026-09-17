import React from 'react';
import CategoryProducts from '../components/sections/CategoryProducts';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const Fruits = () => {
  return (
    <>
      <Navbar />
      <div>
        <CategoryProducts title="Seasonal Fruits" category="Fruits" />
      </div>
      <Footer />
    </>
  );
};

export default Fruits;
