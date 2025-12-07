import { Route } from "react-router-dom";
import KdsScreen from "../pages/chef/KdsScreen";

export const chefRoutes = (
  <>
    <Route path="/kitchen" element={<KdsScreen />} />
  </>
);
