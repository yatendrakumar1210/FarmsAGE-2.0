import AppRoutes from "./routes/AppRoutes";
import FloatingCartBar from "./components/common/FloatingCartBar";
import MobileBottomNav from "./components/layout/MobileBottomNav";

function App() {
  return (
    <>
      <AppRoutes />
      <FloatingCartBar />
      <MobileBottomNav />
    </>
  );
}

export default App;


