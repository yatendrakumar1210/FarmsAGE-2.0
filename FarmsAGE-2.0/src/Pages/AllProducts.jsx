import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import CategoryProducts from '../components/sections/CategoryProducts'
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

// Static data as fallback if API is down
import productsData from '../data/products'
import fruitsData from '../data/fruits'
import organicData from '../data/organic'

const API = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://farmsage-2-0-2.onrender.com";

const AllProducts = () => {
  const location = useLocation();
  const vendorName = location.state?.vendorName;
  const [activeTab, setActiveTab] = useState('All');
  const [dbProducts, setDbProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API}/api/products`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDbProducts(data);
        } else {
          // fallback to static data
          setDbProducts([]);
        }
      } catch (err) {
        console.warn("API unavailable, using local data:", err.message);
        setDbProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // If DB has products, use them filtered by category; otherwise fall back to static files
  const getProducts = (category) => {
    if (dbProducts.length > 0) {
      if (category === 'All') return dbProducts;
      return dbProducts.filter(p => p.category === category);
    }
    // Static fallback
    const allStatic = [
      ...productsData,
      ...fruitsData,
      ...organicData
    ];
    const unique = new Map();
    allStatic.forEach(p => unique.set(p.name, { ...p, id: p.name }));
    const all = Array.from(unique.values());
    if (category === 'All') return all;
    if (category === 'Fruits') return fruitsData.map(p => ({ ...p, id: p.name }));
    if (category === 'Vegetables') return productsData.map(p => ({ ...p, id: p.name }));
    if (category === 'Organic') return organicData.map(p => ({ ...p, id: p.name }));
    return all;
  };

  const tabs = ['All', 'Fruits', 'Vegetables', 'Organic'];

  const getTitle = () => {
    if (vendorName) return `Products from ${vendorName}`;
    if (activeTab === 'All') return 'All Products';
    return `${activeTab} Collection`;
  };

  return (
    <>
      <Navbar />
      <div className="pt-0">
        {loading ? (
          <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>
            Loading products...
          </div>
        ) : (
          <CategoryProducts
            title={getTitle()}
            productsData={getProducts(activeTab)}
          />
        )}
      </div>
      <Footer />
    </>
  );
}

export default AllProducts;
