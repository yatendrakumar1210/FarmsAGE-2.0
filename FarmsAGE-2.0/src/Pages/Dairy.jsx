import React from 'react';
import CategoryProducts from '../components/sections/CategoryProducts';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const Dairy = () => {
  return (
    <>
      <Navbar />
      <div>
        <CategoryProducts title="Dairy Products" category="Dairy" />
      </div>
      <Footer />
    </>
  );
};

export default Dairy;
