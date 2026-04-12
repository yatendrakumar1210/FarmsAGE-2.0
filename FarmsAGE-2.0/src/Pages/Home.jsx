import Hero from "../components/sections/Hero";
import Categories from "../components/sections/Categories";
import Offers from "../components/sections/Offers";
import Products from "../components/sections/Products";
import Trust from "../components/sections/Trust";
import MainLayout from "../components/layout/MainLayout";
import NearbyVendors from "../components/sections/NearbyVendors";


const Home = () => {
  return (
    <MainLayout>

      <Hero />
      {/* <AllProducts/> */}
      <NearbyVendors />
      <Categories />
      <Offers />
      <Products />
      <Trust />
    </MainLayout>
  );
};

export default Home;


