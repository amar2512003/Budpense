import { useEffect } from "react";

import AppRoutes from "./routes/AppRoutes";
import useAuthStore from "./store/authStore";

const App = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  // Once, here, for the whole app. Both route guards wait on the isLoading flag
  // this sets, and PublicRoute renders nothing until it clears — so without a
  // check that runs whatever page you land on, /login would spin forever.
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <AppRoutes />;
};

export default App;
