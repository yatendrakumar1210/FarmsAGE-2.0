import React, { useState, useEffect } from 'react'
import CategoryProducts from '../components/sections/CategoryProducts'
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import dairyData from '../data/dairy'

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";

const Dairy = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API}/api/products?category=Dairy`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(dairyData); // static fallback
        }
      } catch (err) {
        console.warn("API unavailable, using local dairy data");
        setProducts(dairyData);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <>
      <Navbar />
      <div>
        {loading ? (
          <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 600 }}>
            Loading products...
          </div>
        ) : (
          <CategoryProducts title="Dairy Products" productsData={products} />
        )}
      </div>
      <Footer />
    </>
  );
}

export default Dairy
