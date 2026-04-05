import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Arena from "./pages/Arena";
import Bestiary from "./pages/Bestiary";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      {/* Animated gradient background */}
      <div className="bg-layer">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="app-container">
        <nav className="nav">
          <div className="nav-inner">
            <NavLink to="/" className="nav-brand" end>
              ENTROPIC ARENA
            </NavLink>
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              end
            >
              Entities
            </NavLink>
            <NavLink
              to="/arena"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              Arena
            </NavLink>
            <NavLink
              to="/bestiary"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              Bestiary
            </NavLink>
          </div>
        </nav>

        <div className="page-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/arena" element={<Arena />} />
            <Route path="/bestiary" element={<Bestiary />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
