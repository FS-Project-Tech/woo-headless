"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

interface CheckoutState {
  billing: any;
  shipping: any;
  shippingMethod: any;
  coupon: string;
  discount: number;
  paymentMethod: string;
  shipToDifferentAddress: boolean;
  deliveryAuthority: "with_signature" | "without_signature";
  deliveryInstructions: string;
  subscribeNewsletter: boolean;
  orderId: number | null;
  errors: any;
}

interface CheckoutContextType extends CheckoutState {
  setBilling: (billing: any) => void;
  setShipping: (shipping: any) => void;
  setShippingMethod: (method: any) => void;
  setCoupon: (coupon: string) => void;
  setDiscount: (discount: number) => void;
  setPaymentMethod: (method: string) => void;
  setShipToDifferentAddress: (value: boolean) => void;
  setDeliveryAuthority: (value: "with_signature" | "without_signature") => void;
  setDeliveryInstructions: (value: string) => void;
  setSubscribeNewsletter: (value: boolean) => void;
  setOrderId: (id: number | null) => void;
  setErrors: (errors: any) => void;
  clearCheckout: () => void;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [billing, setBilling] = useState<any>({});
  const [shipping, setShipping] = useState<any>({});
  const [shippingMethod, setShippingMethod] = useState<any>(null);
  const [coupon, setCoupon] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [shipToDifferentAddress, setShipToDifferentAddress] = useState<boolean>(false);
  const [deliveryAuthority, setDeliveryAuthority] = useState<"with_signature" | "without_signature">("with_signature");
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>("");
  const [subscribeNewsletter, setSubscribeNewsletter] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [errors, setErrors] = useState<any>({});

  const clearCheckout = useCallback(() => {
    setBilling({});
    setShipping({});
    setShippingMethod(null);
    setCoupon("");
    setDiscount(0);
    setPaymentMethod("");
    setShipToDifferentAddress(false);
    setDeliveryAuthority("with_signature");
    setDeliveryInstructions("");
    setSubscribeNewsletter(false);
    setOrderId(null);
    setErrors({});
  }, []);

  // Load saved billing/shipping from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedBilling = localStorage.getItem("checkout:billing");
      const savedShipping = localStorage.getItem("checkout:shipping");
      if (savedBilling) {
        setBilling(JSON.parse(savedBilling));
      }
      if (savedShipping) {
        setShipping(JSON.parse(savedShipping));
      }
    } catch {}
  }, []);

  const value: CheckoutContextType = {
    billing,
    shipping,
    shippingMethod,
    coupon,
    discount,
    paymentMethod,
    shipToDifferentAddress,
    deliveryAuthority,
    deliveryInstructions,
    subscribeNewsletter,
    orderId,
    errors,
    setBilling,
    setShipping,
    setShippingMethod,
    setCoupon,
    setDiscount,
    setPaymentMethod,
    setShipToDifferentAddress,
    setDeliveryAuthority,
    setDeliveryInstructions,
    setSubscribeNewsletter,
    setOrderId,
    setErrors,
    clearCheckout,
  };

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error("useCheckout must be used within CheckoutProvider");
  }
  return context;
}

