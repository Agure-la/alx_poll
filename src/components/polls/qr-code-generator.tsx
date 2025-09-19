"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode, Download, Share2 } from "lucide-react";
import QRCodeLib from "qrcode";

interface QRCodeGeneratorProps {
  pollId: string;
  pollTitle: string;
}

export function QRCodeGenerator({ pollId, pollTitle }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pollUrl = `${window.location.origin}/polls/${pollId}`;

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const qrDataUrl = await QRCodeLib.toDataURL(pollUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `poll-${pollId}-qr.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const shareQRCode = async () => {
    if (navigator.share && qrCodeUrl) {
      try {
        const response = await fetch(qrCodeUrl);
        const blob = await response.blob();
        const file = new File([blob], `poll-${pollId}-qr.png`, { type: 'image/png' });
        
        await navigator.share({
          title: pollTitle,
          text: `Check out this poll: ${pollTitle}`,
          files: [file]
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={generateQRCode}>
          <QrCode className="h-4 w-4 mr-2" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Poll via QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code to quickly access the poll on any device
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          {loading ? (
            <div className="w-[300px] h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : qrCodeUrl ? (
            <img 
              src={qrCodeUrl} 
              alt="QR Code" 
              className="w-[300px] h-[300px] border rounded-lg"
            />
          ) : (
            <div className="w-[300px] h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
              <QrCode className="h-16 w-16 text-gray-400" />
            </div>
          )}
          
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">{pollTitle}</p>
            <p className="text-xs text-muted-foreground break-all">{pollUrl}</p>
          </div>
          
          {qrCodeUrl && (
            <div className="flex gap-2 w-full">
              <Button onClick={downloadQRCode} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              {navigator.share && (
                <Button onClick={shareQRCode} variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}