// src/App.jsx
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { SearchProvider } from "./context/SearchContext";

function App() {
  return (
    <AuthProvider>
      <SearchProvider>
        <AppRoutes />
      </SearchProvider>
    </AuthProvider>
  );
}

export default App;