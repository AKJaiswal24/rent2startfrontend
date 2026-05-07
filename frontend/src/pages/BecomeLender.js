import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import "../styles/lender.css";

function BecomeLender() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const isLender = user?.isLender === true;

  // Move hooks to top level to avoid conditional calls
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    businessName: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  if (!user) {
    return (
      <div className="lender-page">
        <h2>Please login first</h2>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  if (isLender) {
    // Redirect to my-listings to manage/edit products
    navigate("/my-listings", { replace: true });
    return null; // Temporary null to avoid rendering anything during redirect
  }

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    try {
      await api.post("/api/lender/register", {
        userId: user._id,
        ...form,
      });

      // Update user object with isLender flag
      const updatedUser = { ...user, isLender: true };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      alert("You're now a lender!");
      navigate("/add-product");
    } catch (error) {
      const message = error?.response?.data?.message || "Failed";
      alert(message);
    }
  };

  return (
    <div className="lender-page">
      <h1>Become a Lender</h1>

      {step === 1 ? (
        <div>
          <input
            placeholder="Business Name"
            value={form.businessName}
            onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
          />
          <button onClick={next}>Next</button>
        </div>
      ) : null}

      {step === 2 ? (
        <div>
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <button onClick={back}>Back</button>
          <button onClick={next}>Next</button>
        </div>
      ) : null}

      {step === 3 ? (
        <div>
          <input
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          />
          <button onClick={back}>Back</button>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      ) : null}
    </div>
  );
}

export default BecomeLender;
