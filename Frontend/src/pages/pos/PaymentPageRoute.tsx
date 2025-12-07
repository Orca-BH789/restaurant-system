import { useParams } from "react-router-dom";
import PaymentPage from "./PaymentPage";

export default function PaymentPageRoute() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  
  return (
    <PaymentPage 
      invoiceId={invoiceId ? parseInt(invoiceId) : undefined}
    />
  );
}
