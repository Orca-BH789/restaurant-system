import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import axios from "axios";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";

interface Table {
  id: number;
  tableNumber: number;
  tableName?: string;
  capacity: number;
  location?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  qrCodeUrl?: string;
}

export default function TableQRPrint() {
  const { id } = useParams();
  const [table, setTable] = useState<Table | null>(null);
  const api = `${getApiBaseUrl()}/Tables`;

  useEffect(() => {
  (async () => {
    try {
      const res = await axios.get(`${api}/${id}`);
      setTable(res.data);    
    } catch (err) {
      console.error("Không tải được bàn:", err);
    }
  })();
}, [id]);


  if (!table) return <p>Đang tải...</p>;

 return (
  <div
    style={{
      width: "80mm",
      height: "100mm",
      margin: "0 auto",
      textAlign: "center",
      fontFamily: "sans-serif",     
      padding: "10px",
      borderRadius: "10px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <img
      src="/logo.png"
      alt="logo"
      style={{ width: "40px", marginBottom: "5px" }}
    />
    <h2 style={{ margin: "4px 0", fontSize: "16px" }}>Nhà hàng VietThai</h2>
    <h3 style={{ margin: "4px 0", fontSize: "14px", color: "#333" }}>
      Bàn #{table.tableNumber}
    </h3>

    <QRCodeSVG
      value={`https://localhost:5173/order?table=${table.id}`}
      size={120}
    />

    <p style={{ marginTop: "6px", fontSize: "12px", color: "#555" }}>
      {table.location || "Khu vực chung"}
    </p>
    <p style={{ marginTop: "3px", fontSize: "11px", color: "#777" }}>
      Quét mã để gọi món nhanh 💨
    </p>

    <style>{`
      @media print {
        @page {
          size: 80mm 100mm; /* hoặc A6, A5 nếu muốn */
          margin: 0;
        }
        body {
          margin: 0;
          -webkit-print-color-adjust: exact;
        }
        div {
          page-break-inside: avoid; 
        }
      }
    `}</style>
  </div>
);

}
