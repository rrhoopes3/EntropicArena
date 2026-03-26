import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Home } from "./pages/Home";
import { Arena } from "./pages/Arena";
import { Bestiary } from "./pages/Bestiary";

const navStyle = (isActive: boolean) => ({
  color: isActive ? "#ffd700" : "#9090b0",
  textDecoration: "none",
  fontWeight: isActive ? 700 : 400,
  fontSize: 14,
  padding: "8px 16px",
  borderBottom: isActive ? "2px solid #ffd700" : "2px solid transparent",
});

function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", background: "#0a0a1a", color: "#e8e8f0" }}>
        {/* Nav */}
        <nav style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          padding: "16px 0",
          borderBottom: "1px solid #2a2a4a",
          background: "#12122a",
        }}>
          <NavLink to="/" style={({ isActive }) => navStyle(isActive)} end>
            Entities
          </NavLink>
          <NavLink to="/arena" style={({ isActive }) => navStyle(isActive)}>
            Arena
          </NavLink>
          <NavLink to="/bestiary" style={({ isActive }) => navStyle(isActive)}>
            Bestiary
          </NavLink>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/arena" element={<Arena />} />
          <Route path="/bestiary" element={<Bestiary />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
