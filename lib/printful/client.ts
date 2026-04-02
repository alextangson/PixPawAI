/**
 * Printful API Client
 * Thin wrapper around the Printful REST API v1
 * https://developers.printful.com/docs/
 */

import { PRINTFUL_API_BASE, PRINTFUL_API_KEY } from './config';

export class PrintfulError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'PrintfulError';
  }
}

async function printfulFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!PRINTFUL_API_KEY) {
    throw new PrintfulError('PRINTFUL_API_KEY is not configured', 500);
  }

  const res = await fetch(`${PRINTFUL_API_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new PrintfulError(
      json?.error?.message || `Printful API error ${res.status}`,
      res.status,
      json,
    );
  }

  return json.result ?? json;
}

// ---------------------------------------------------------------------------
// Order types
// ---------------------------------------------------------------------------

export interface PrintfulRecipient {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state_code: string;
  country_code: string;
  zip: string;
  email: string;
  phone?: string;
}

export interface PrintfulOrderItem {
  variant_id: number;
  quantity: number;
  files: Array<{
    url: string;       // publicly accessible image URL
    placement?: string;
  }>;
}

export interface CreateOrderPayload {
  recipient: PrintfulRecipient;
  items: PrintfulOrderItem[];
  retail_costs?: {
    currency: string;
    subtotal: string;
    shipping: string;
    tax: string;
    total: string;
  };
  /** Set to true to only estimate costs without placing a real order */
  confirm?: boolean;
}

export interface PrintfulOrder {
  id: number;
  external_id?: string;
  status: string;
  shipping: string;
  costs: {
    subtotal: string;
    discount: string;
    shipping: string;
    digitization: string;
    additional_fee: string;
    fulfillment_fee: string;
    tax: string;
    vat: string;
    total: string;
  };
  retail_costs: {
    currency: string;
    subtotal: string;
    shipping: string;
    tax: string;
    total: string;
  };
  items: Array<{
    id: number;
    variant_id: number;
    quantity: number;
    price: string;
    retail_price: string;
    name: string;
  }>;
  created: number;
  updated: number;
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

/**
 * Estimate order costs without placing a real order.
 * Use this to show the user a shipping + tax estimate before checkout.
 */
export async function estimateOrder(
  payload: Omit<CreateOrderPayload, 'confirm'>,
): Promise<PrintfulOrder> {
  return printfulFetch<PrintfulOrder>('/orders/estimate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Create and confirm a real Printful order.
 * Call this only after payment is captured.
 */
export async function createOrder(
  payload: CreateOrderPayload,
): Promise<PrintfulOrder> {
  return printfulFetch<PrintfulOrder>('/orders?confirm=true', {
    method: 'POST',
    body: JSON.stringify({ ...payload, confirm: true }),
  });
}

/**
 * Fetch a single order by Printful order ID.
 */
export async function getOrder(orderId: number): Promise<PrintfulOrder> {
  return printfulFetch<PrintfulOrder>(`/orders/${orderId}`);
}
