import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Force reset catalogue si version outdatée
localStorage.removeItem("angy_catalogue");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
