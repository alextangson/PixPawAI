'use client';

import { useState } from 'react';
import { ShoppingCart, Loader2, CheckCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PRINTFUL_PRODUCTS, type PrintfulProduct } from '@/lib/printful/config';

interface ShippingForm {
  name: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state_code: string;
  country_code: string;
  zip: string;
}

interface Props {
  generationId: string;
}

const PRODUCT_EMOJIS: Record<string, string> = {
  pillow: '🛋️',
  'wall-art': '🖼️',
  't-shirt': '👕',
  'phone-case': '📱',
  mug: '☕',
  tumbler: '🥤',
  socks: '🧦',
  'floor-mat': '🏠',
};

type Step = 'product' | 'shipping' | 'review' | 'success';

export function MerchOrderFlow({ generationId }: Props) {
  const [step, setStep] = useState<Step>('product');
  const [selectedProduct, setSelectedProduct] = useState<PrintfulProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [shipping, setShipping] = useState<ShippingForm>({
    name: '', email: '', address1: '', address2: '',
    city: '', state_code: '', country_code: 'US', zip: '',
  });
  const [costs, setCosts] = useState<{ subtotal: string; shipping: string; tax: string; total: string } | null>(null);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const products = Object.values(PRINTFUL_PRODUCTS);
  const selectedVariant = selectedProduct?.variants.find(v => v.variantId === selectedVariantId);

  async function handleProceedToShipping() {
    if (!selectedProduct || !selectedVariantId) return;
    setStep('shipping');
  }

  async function handleEstimate() {
    if (!selectedProduct || !selectedVariantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/printful/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId,
          productId: selectedProduct.productId,
          variantId: selectedVariantId,
          quantity: 1,
          shipping: {
            name: shipping.name,
            email: shipping.email,
            address1: shipping.address1,
            address2: shipping.address2 || undefined,
            city: shipping.city,
            state_code: shipping.state_code,
            country_code: shipping.country_code,
            zip: shipping.zip,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to estimate order');
      setCosts(data.costs);
      setPaypalOrderId(data.paypalOrderId);
      setStep('review');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmOrder() {
    if (!paypalOrderId) return;
    setLoading(true);
    setError(null);
    try {
      // In production, open PayPal JS SDK popup here first, then confirm.
      // For now we call confirm directly (assumes PayPal approved externally).
      const res = await fetch('/api/printful/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paypalOrderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order confirmation failed');
      setStep('success');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'success') {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
        <p className="text-gray-600">
          Your {selectedProduct?.name} is being prepared. You'll receive a shipping confirmation by email.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Product selection */}
      {step === 'product' && (
        <>
          <h2 className="text-xl font-bold text-gray-900">Choose a Product</h2>
          <div className="grid grid-cols-2 gap-3">
            {products.map(product => (
              <button
                key={product.productId}
                onClick={() => {
                  setSelectedProduct(product);
                  setSelectedVariantId(product.variants[0].variantId);
                }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedProduct?.productId === product.productId
                    ? 'border-coral bg-coral/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{PRODUCT_EMOJIS[product.productId]}</div>
                <div className="font-semibold text-sm text-gray-900">{product.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  from ${(Math.min(...product.variants.map(v => v.price)) / 100).toFixed(0)}
                </div>
              </button>
            ))}
          </div>

          {selectedProduct && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size / Option
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedProduct.variants.map(v => (
                  <button
                    key={v.variantId}
                    onClick={() => setSelectedVariantId(v.variantId)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      selectedVariantId === v.variantId
                        ? 'border-coral bg-coral text-white'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {v.label} — ${(v.price / 100).toFixed(0)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleProceedToShipping}
            disabled={!selectedProduct || !selectedVariantId}
            className="w-full h-12 bg-coral hover:bg-orange-600 text-white font-bold"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Continue to Shipping
          </Button>
        </>
      )}

      {/* Step 2: Shipping address */}
      {step === 'shipping' && (
        <>
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setStep('product')} className="text-sm text-coral hover:underline">
              ← Back
            </button>
            <h2 className="text-xl font-bold text-gray-900">Shipping Details</h2>
          </div>

          <div className="space-y-3">
            {[
              { key: 'name', label: 'Full Name', placeholder: 'Jane Smith' },
              { key: 'email', label: 'Email', placeholder: 'jane@example.com', type: 'email' },
              { key: 'address1', label: 'Address', placeholder: '123 Main St' },
              { key: 'address2', label: 'Apt / Suite (optional)', placeholder: 'Apt 4B' },
              { key: 'city', label: 'City', placeholder: 'New York' },
              { key: 'state_code', label: 'State / Province', placeholder: 'NY' },
              { key: 'zip', label: 'ZIP / Postal Code', placeholder: '10001' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type || 'text'}
                  value={shipping[key as keyof ShippingForm]}
                  onChange={e => setShipping(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral/50"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <div className="relative">
                <select
                  value={shipping.country_code}
                  onChange={e => setShipping(prev => ({ ...prev, country_code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-coral/50"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="JP">Japan</option>
                  <option value="SG">Singapore</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            onClick={handleEstimate}
            disabled={loading || !shipping.name || !shipping.address1 || !shipping.city || !shipping.zip}
            className="w-full h-12 bg-coral hover:bg-orange-600 text-white font-bold"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Calculate Shipping & Tax
          </Button>
        </>
      )}

      {/* Step 3: Review & pay */}
      {step === 'review' && costs && (
        <>
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setStep('shipping')} className="text-sm text-coral hover:underline">
              ← Back
            </button>
            <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{selectedProduct?.name} ({selectedVariant?.label})</span>
              <span>${costs.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span>${costs.shipping}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span>${costs.tax}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2">
              <span>Total</span>
              <span>${costs.total}</span>
            </div>
          </div>

          <div className="text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-3">
            Ships to: {shipping.name}, {shipping.address1}, {shipping.city} {shipping.state_code} {shipping.zip}, {shipping.country_code}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            onClick={handleConfirmOrder}
            disabled={loading}
            className="w-full h-12 bg-coral hover:bg-orange-600 text-white font-bold"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
            Pay ${costs.total} with PayPal
          </Button>

          <p className="text-xs text-center text-gray-400">
            Powered by PayPal · Fulfilled by Printful · Ships in 3–7 business days
          </p>
        </>
      )}
    </div>
  );
}
