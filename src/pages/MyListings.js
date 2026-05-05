// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import "../styles/listings.css";

// function MyListings() {
//   const [products, setProducts] = useState([]);
//   const navigate = useNavigate();

//   const userData = localStorage.getItem("user");
//   const user = userData ? JSON.parse(userData) : null;

//   const isLender = localStorage.getItem("isLender");

//   // 🔒 PROTECTION
//   useEffect(() => {
//     if (!user) {
//       navigate("/login");
//       return;
//     }

//     if (!isLender) {
//       navigate("/become-lender");
//     }
//   }, [user, isLender, navigate]);

//   if (!user || !isLender) {
//     return <h2>Redirecting...</h2>;
//   }

//   // FETCH PRODUCTS
//   const fetchProducts = () => {
//     axios
//       .get(`http://localhost:5000/api/products/lender/${user._id}`)
//       .then((res) => setProducts(res.data))
//       .catch((err) => console.log(err));
//   };

//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   // DELETE
//   const handleDelete = async (id) => {
//     try {
//       await axios.delete(
//         `http://localhost:5000/api/products/${id}`
//       );

//       alert("Deleted ✅");
//       fetchProducts();

//     } catch (err) {
//       alert("Delete failed ❌");
//     }
//   };

//   return (
//     <div className="listings-page">

//       <h1>My Listings 📦</h1>

//       {products.length > 0 ? (
//         <div className="grid">

//           {products.map((item) => (
//             <div className="card" key={item._id}>

//               <img src={item.images?.[0]} alt="product" />

//               <h3>{item.name}</h3>

//               <p className="category">{item.category}</p>

//               <p className="price">
//                 ₹{item.pricing?.[0]?.price}
//               </p>

//               <button
//                 className="delete"
//                 onClick={() => handleDelete(item._id)}
//               >
//                 Delete
//               </button>

//             </div>
//           ))}

//         </div>
//       ) : (
//         <p>No products listed yet 😕</p>
//       )}

//     </div>
//   );
// }

// export default MyListings;

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/listings.css";

function MyListings() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;

  const isLender = localStorage.getItem("isLender");

  // 🔒 PROTECTION (runs first)
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!isLender) {
      navigate("/become-lender");
    }
  }, [user, isLender, navigate]);

  // FETCH PRODUCTS (must always be declared before return)
  useEffect(() => {
    if (user && isLender) {
      fetchProducts();
    }
  }, [user, isLender]);

  const fetchProducts = () => {
    axios
      .get(`http://localhost:5000/api/products/lender/${user._id}`)
      .then((res) => setProducts(res.data))
      .catch((err) => console.log(err));
  };

  // DELETE
  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/products/${id}`
      );

      alert("Deleted ✅");
      fetchProducts();

    } catch (err) {
      alert("Delete failed ❌");
    }
  };

  // 👇 RETURN AFTER ALL HOOKS
  if (!user || !isLender) {
    return <h2>Redirecting...</h2>;
  }

  return (
    <div className="listings-page">
      <h1>My Listings 📦</h1>

      {products.length > 0 ? (
        <div className="grid">
          {products.map((item) => (
            <div className="card" key={item._id}>
              <img src={item.images?.[0]} alt="product" />

              <h3>{item.name}</h3>

              <p className="category">{item.category}</p>

              <p className="price">
                ₹{item.pricing?.[0]?.price}
              </p>

              <button
                className="delete"
                onClick={() => handleDelete(item._id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>No products listed yet 😕</p>
      )}
    </div>
  );
}

export default MyListings;