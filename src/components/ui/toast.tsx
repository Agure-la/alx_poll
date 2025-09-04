"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }[type];

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3`}>
      <span>{message}</span>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClose}
        className="text-white hover:bg-white/20 p-1 h-auto"
      >
        ×
      </Button>
    </div>
  );
}