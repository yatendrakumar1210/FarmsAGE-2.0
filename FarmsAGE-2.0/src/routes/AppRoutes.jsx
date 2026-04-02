import { Routes, Route } from "react-router-dom";
import Home from "../Pages/Home";
import Cart from "../Pages/Cart";
import Contact from "../pages/Contact";
import Login from "../pages/Login";
import Fruits from "../Pages/Fruits";
import Vegetables from "../Pages/Vegetables";

import Organic from "../Pages/Organic";
import AllProducts from "../Pages/AllProducts";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/category/fruits" element={<Fruits />} />
      <Route path="/category/vegetables" element={<Vegetables />} />
  
      <Route path="/category/organic" element={<Organic />} />
      <Route path="/category/all" element={<AllProducts />} />
    </Routes>
  );
};

export default AppRoutes;
