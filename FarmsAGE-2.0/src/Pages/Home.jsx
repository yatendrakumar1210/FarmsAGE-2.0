import React from "react";
import Hero from "../components/sections/Hero";
import Categories from "../components/sections/Categories";
import Offers from "../components/sections/Offers";
import Products from "../components/sections/Products";
import Trust from "../components/sections/Trust";
import BecomeVendorCard from "../components/sections/BecomeVendorCard";
import MainLayout from "../components/layout/MainLayout";

const Home = () => {
  return (
    <MainLayout>
      <Hero />
      <Categories />
      {/* <Products /> */}
      {/* <Offers /> */}
      <BecomeVendorCard />
      {/* <Trust /> */}
    </MainLayout>
  );
};

export default Home;
