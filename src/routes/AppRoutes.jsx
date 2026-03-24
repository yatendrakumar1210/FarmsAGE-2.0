import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Cart from "../pages/Cart";
import Contact from "../pages/Contact";
import Login from "../pages/Login";
import Fruits from "../Pages/Fruits";
import Vegetables from "../Pages/Vegetables";
import Dairy from "../Pages/Dairy";
import Organic from "../Pages/Organic";

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
      <Route path="/category/dairy" element={<Dairy />} />
      <Route path="/category/organic" element={<Organic />} />
    </Routes>
  );
};

export default AppRoutes;
