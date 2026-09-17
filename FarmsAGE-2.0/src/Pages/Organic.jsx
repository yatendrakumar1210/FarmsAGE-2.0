import React from 'react';
import CategoryProducts from '../components/sections/CategoryProducts';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const Organic = () => {
  return (
    <>
      <Navbar />
      <div>
        <CategoryProducts title="Organic Products" category="Organic" />
      </div>
      <Footer />
    </>
  );
};

export default Organic;
