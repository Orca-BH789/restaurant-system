import { Route } from "react-router-dom";
import CustomerLayout from "../components/layouts/CustomerLayout";
import Home from "../pages/customer/Home";
import Menu from "../pages/customer/Menu";
import Booking from '../pages/customer/BookingPage';
import CustomerOrder from "../pages/customer/CustomerOrderPage";
import About from "../pages/customer/About";
import Promotions from "../pages/customer/Promotions";
import PaymentSuccess from "../pages/customer/PaymentSuccess";
import PaymentCancel from "../pages/customer/PaymentCancel";

export const customerRoutes = (
  <>
    <Route path="/" element={<CustomerLayout />}>    
      <Route index element={<Home />} />
      <Route path="menu" element={<Menu />} />
      <Route path="booking" element={<Booking />} />
      <Route path="order" element={<CustomerOrder />} />
      <Route path="about" element={<About />} />
      <Route path="promotions" element={<Promotions />} />
      <Route path="payment/success" element={<PaymentSuccess />} />
      <Route path="payment/cancel" element={<PaymentCancel />} />
    </Route>
  </>
);