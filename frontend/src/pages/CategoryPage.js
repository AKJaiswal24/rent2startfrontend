import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import "../styles/landing.css"; // reuse grid styles

function CategoryPage() {
  const { categoryName } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    api
      .get("/api/products")
      .then((res) => {
        // filter by category (case-insensitive)
        const data = Array.isArray(res.data) ? res.data : [];
        const filtered = data.filter(
          (p) =>
            p.category &&
            p.category.toLowerCase() === categoryName.toLowerCase()
        );

        setProducts(filtered);
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  }, [categoryName]);

  return (
    <div className="container">

      <h2 style={{ marginBottom: "20px" }}>
        {categoryName} Rentals
      </h2>

      <div className="product-grid">

        {loading ? (
          <div className="skeleton"></div>
        ) : products.length > 0 ? (
          products.map((item) => (
            <div
              className="product-card-new"
              key={item._id}
              onClick={() => navigate(`/product/${item._id}`)}
            >
              <img src={item.image || item.images?.[0]} alt={item.name} />
              <h4>{item.name}</h4>

              <p className="price">
                ₹
                {item.price ||
                  item.pricePerMonth ||
                  item.pricing?.[0]?.price}
              </p>
            </div>
          ))
        ) : (
          <p>No products found</p>
        )}

      </div>
    </div>
  );
}

export default CategoryPage;
