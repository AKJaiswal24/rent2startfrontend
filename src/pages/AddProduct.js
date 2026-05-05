import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function AddProduct() {
  const navigate = useNavigate();

  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;
  const isLender = localStorage.getItem("isLender");

  // 🔥 FORM
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    deposit: "",
  });

  // 🔥 MULTIPLE IMAGES
  const [images, setImages] = useState(["", "", ""]);

  // 🔥 PRICING
  const [pricing, setPricing] = useState([
    { duration: "1 day", price: "" },
    { duration: "1 month", price: "" },
    { duration: "3 months", price: "" },
    { duration: "6 months", price: "" },
    { duration: "12 months", price: "" },
  ]);

  // 🔒 REDIRECT
  useEffect(() => {
    if (!isLender) navigate("/become-lender");
  }, [isLender, navigate]);

  if (!isLender) return <h2>Redirecting...</h2>;

  // ---------------- HANDLERS ----------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (index, value) => {
    const updated = [...images];
    updated[index] = value;
    setImages(updated);
  };

  const handlePricingChange = (index, value) => {
    const updated = [...pricing];
    updated[index].price = value;
    setPricing(updated);
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async () => {
    const validImages = images.filter((img) => img.trim() !== "");

    if (!form.name || !form.category) {
      alert("Fill required fields");
      return;
    }

    if (validImages.length < 3) {
      alert("Please add at least 3 images");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/products/add", {
        ...form,
        pricing,
        images: validImages,
        userId: user._id,
      });

      alert("Product added ✅");
      navigate("/");

    } catch (err) {
      console.log(err);
      alert("Error ❌");
    }
  };

  return (
    <div style={{ padding: "30px", maxWidth: "500px", margin: "auto" }}>

      <h1>Add Product</h1>

      {/* BASIC */}
      <input name="name" placeholder="Product Name" onChange={handleChange} />
      <input name="category" placeholder="Category" onChange={handleChange} />
      <input name="deposit" placeholder="Deposit ₹" onChange={handleChange} />

      <textarea
        name="description"
        placeholder="Description"
        onChange={handleChange}
      />

      {/* 🔥 IMAGES */}
      <h3>Product Images (Min 3)</h3>

      {images.map((img, index) => (
        <input
          key={index}
          placeholder={`Image URL ${index + 1}`}
          value={img}
          onChange={(e) =>
            handleImageChange(index, e.target.value)
          }
        />
      ))}

      {/* PREVIEW */}
      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        {images.map((img, i) =>
          img ? (
            <img
              key={i}
              src={img}
              alt="preview"
              style={{ width: "70px", borderRadius: "6px" }}
            />
          ) : null
        )}
      </div>

      {/* 🔥 PRICING */}
      <h3>Pricing Plans</h3>

      {pricing.map((plan, index) => (
        <div key={index} style={{ display: "flex", gap: "10px" }}>
          <input value={plan.duration} disabled />
          <input
            type="number"
            placeholder="₹ Price"
            onChange={(e) =>
              handlePricingChange(index, e.target.value)
            }
          />
        </div>
      ))}

      <button onClick={handleSubmit}>
        Add Product
      </button>

    </div>
  );
}

export default AddProduct;