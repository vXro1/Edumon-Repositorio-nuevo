import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { SearchProvider } from "./context/SearchContext";
import { ToastProvider } from "./context/ToastContext";
import { BreadcrumbProvider } from "./context/BreadcrumbContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          60_000,
      retry:              1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <SearchProvider>
            <BreadcrumbProvider>
              <AppRoutes />
            </BreadcrumbProvider>
          </SearchProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;