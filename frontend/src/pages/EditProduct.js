import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client";

function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams();

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const isLender = Boolean(localStorage.getItem("isLender"));
  const userId = user?._id || "";

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    deposit: "",
  });

  const [images, setImages] = useState(["", "", ""]);
  const [pricing, setPricing] = useState([
    { duration: "1 day", price: "" },
    { duration: "1 month", price: "" },
    { duration: "3 months", price: "" },
    { duration: "6 months", price: "" },
    { duration: "12 months", price: "" },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLender) navigate("/become-lender");
    if (!userId) navigate("/login");
    
    // Fetch product data for editing
    const fetchProduct = async () => {
      if (!id || !userId || !isLender) return;
      setIsLoading(true);
      try {
        const response = await api.get(`/api/products/${id}`);
        const product = response.data;
        
        // Check if product belongs to current user
        if (product.userId !== userId) {
          navigate("/my-listings");
          return;
        }
        
        // Populate form with product data
        setForm({
          name: product.name || "",
          description: product.description || "",
          category: product.category || "",
          deposit: product.deposit || "",
        });
        
        setImages(product.images || ["", "", ""]);
        setPricing(product.pricing || [
          { duration: "1 day", price: "" },
          { duration: "1 month", price: "" },
          { duration: "3 months", price: "" },
          { duration: "6 months", price: "" },
          { duration: "12 months", price: "" },
        ]);
      } catch (error) {
        console.error("Error fetching product:", error);
        navigate("/my-listings");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProduct();
  }, [isLender, navigate, userId, id]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (index, value) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handlePricingChange = (index, value) => {
    setPricing((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], price: value };
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!userId) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    const validImages = images.map((x) => x.trim()).filter(Boolean);

    if (!form.name || !form.category) {
      alert("Fill required fields");
      return;
    }

    if (validImages.length < 3) {
      alert("Please add at least 3 images");
      return;
    }

    try {
      await api.put(`/api/products/${id}`, {
        ...form,
        pricing,
        images: validImages,
        userId, // Include userId for authorization check in backend
      });

      alert("Product updated ✅");
      navigate("/my-listings");
    } catch (error) {
      const message = error?.response?.data?.message || "Error updating product";
      alert(message);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: "30px", maxWidth: "500px", margin: "auto" }}>
        <h1>Loading Product...</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", maxWidth: "500px", margin: "auto" }}>
      <h1>Edit Product</h1>

      <input name="name" placeholder="Product Name" onChange={handleChange} />
      <input name="category" placeholder="Category" onChange={handleChange} />
      <input name="deposit" placeholder="Deposit ₹" onChange={handleChange} />

      <textarea name="description" placeholder="Description" onChange={handleChange} />

      <h3>Product Images (Min 3)</h3>
      {images.map((img, index) => (
        <input
          key={index}
          placeholder={`Image URL ${index + 1}`}
          value={img}
          onChange={(e) => handleImageChange(index, e.target.value)}
        />
      ))}

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

      <h3>Pricing Plans</h3>
      {pricing.map((plan, index) => (
        <div key={index} style={{ display: "flex", gap: "10px" }}>
          <input value={plan.duration} disabled />
          <input
            type="number"
            placeholder="₹ Price"
            value={plan.price}
            onChange={(e) => handlePricingChange(index, e.target.value)}
          />
        </div>
      ))}

      <button onClick={handleSubmit}>Update Product</button>
      <button onClick={() => navigate("/my-listings")} style={{ marginLeft: "10px" }}>
        Cancel
      </button>
    </div>
  );
}

export default EditProduct;