import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/lender.css";

function BecomeLender() {
  const navigate = useNavigate();

  // ✅ SAFE USER
  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;

  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    businessName: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  // 🔒 NOT LOGGED IN
  if (!user) {
    return (
      <div className="lender-page">
        <h2>Please login first</h2>
        <button onClick={() => navigate("/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  const next = () => setStep(step + 1);
  const back = () => setStep(step - 1);

  const handleSubmit = async () => {
    try {
      await axios.post("http://localhost:5000/api/lender/register", {
        userId: user._id,
        ...form,
      });

      localStorage.setItem("isLender", "true");

      alert("🎉 You're now a lender!");

      navigate("/add-product");

    } catch (err) {
  console.log("ERROR:", err.response?.data || err.message);
  alert(err.response?.data?.message || "Failed ❌");
}
  };

  return (
    <div className="lender-page">

      <h1>Become a Lender</h1>

      {/* STEP */}
      {step === 1 && (
        <div>
          <input
            placeholder="Business Name"
            onChange={(e) =>
              setForm({ ...form, businessName: e.target.value })
            }
          />
          <button onClick={next}>Next</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <input
            placeholder="Phone"
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />
          <button onClick={back}>Back</button>
          <button onClick={next}>Next</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <input
            placeholder="Address"
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
          />
          <button onClick={back}>Back</button>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      )}

    </div>
  );
}

export default BecomeLender;