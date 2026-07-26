import { BrowserRouter, Route, Routes } from "react-router-dom";
import DesignIndex from "./designs/DesignIndex";
import SwissEditorial from "./designs/swiss-editorial/SwissEditorial";
import IndustrialBlueprint from "./designs/industrial-blueprint/IndustrialBlueprint";
import NeomorphicCanvas from "./designs/neomorphic-canvas/NeomorphicCanvas";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DesignIndex />} />
        <Route path="/1" element={<SwissEditorial />} />
        <Route path="/2" element={<IndustrialBlueprint />} />
        <Route path="/3" element={<NeomorphicCanvas />} />
      </Routes>
    </BrowserRouter>
  );
}
