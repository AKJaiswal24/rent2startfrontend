import React from "react";
import { Navigate } from "react-router-dom";

function LenderRoute({ children }) {
  const isLender = localStorage.getItem("isLender");

  // 🔒 BLOCK NON-LENDER
  if (!isLender) {
    return <Navigate to="/become-lender" />;
  }

  return children;
}

export default LenderRoute;