import { useState } from "react";
import { X, QrCode, LinkIcon, Download, Printer, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function QRCodeModal({
  qrUrl,
  tableNumber,
  onClose,
}: {
  qrUrl: string;
  tableNumber: number;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.querySelector("#qr-code-canvas");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 200;
    canvas.height = 200;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `QR-Ban-${tableNumber}.png`;
          link.click();
          URL.revokeObjectURL(link.href);
        }
      });
    };
    img.src = url;
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <QrCode size={24} className="text-blue-600" />
            Mã QR - Bàn {tableNumber}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* QR Code Display */}
          <div className="flex justify-center bg-slate-50 rounded-xl p-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <QRCodeSVG
                id="qr-code-canvas"
                value={qrUrl}
                size={200}
                level="H"
              />
            </div>
          </div>

          {/* Table Info */}
          <div className="text-center">
            <div className="text-sm text-slate-600 mb-2">
              Khách hàng quét mã để xem menu và đặt món
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wide">
                Bàn {tableNumber}
              </div>
              <a
                href={qrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-700 font-mono break-all hover:text-blue-900 hover:underline transition-all block"
              >
                Link đặt món
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCopyLink}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check size={18} />
                  Đã sao chép!
                </>
              ) : (
                <>
                  <LinkIcon size={18} />
                  Sao chép link
                </>
              )}
            </button>
            <button
              onClick={handleDownloadQR}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Tải QR Code
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium flex items-center justify-center gap-2"
          >
            <Printer size={18} />
            In mã QR
          </button>
        </div>
      </div>
    </div>
  );
}
