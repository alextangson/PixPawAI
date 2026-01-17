/**
 * Pricing Page Analytics Tracking
 * Centralized tracking for pricing page events
 */

export type PricingTier = 'free' | 'starter' | 'pro' | 'master';
export type ModalAction = 'upgrade' | 'dismiss' | 'close';

interface BaseEvent {
  variant?: string;
}

interface PricingPageViewEvent extends BaseEvent {
  event: 'pricing_page_view';
}

interface PricingCTAClickEvent extends BaseEvent {
  event: 'pricing_cta_click';
  tier: PricingTier;
  source?: 'card' | 'comparison_table' | 'modal';
}

interface UpgradeModalEvent extends BaseEvent {
  event: 'upgrade_modal_shown' | 'upgrade_modal_click';
  action?: ModalAction;
}

interface ComparisonTableEvent extends BaseEvent {
  event: 'comparison_table_view' | 'comparison_table_toggle';
}

type PricingEvent = 
  | PricingPageViewEvent 
  | PricingCTAClickEvent 
  | UpgradeModalEvent 
  | ComparisonTableEvent;

type PricingEventWithTimestamp = PricingEvent & { timestamp: string };

/**
 * Track a pricing-related event
 * In production, this would send to analytics service (Mixpanel, Amplitude, etc.)
 */
export function trackPricingEvent(event: PricingEvent): void {
  // Add timestamp
  const eventWithTimestamp: PricingEventWithTimestamp = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // For now, just log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Pricing Analytics]', eventWithTimestamp);
  }

  // TODO: Send to analytics service
  // Example: mixpanel.track(event.event, eventWithTimestamp);
  // Example: amplitude.track(event.event, eventWithTimestamp);

  // Store in localStorage for debugging
  if (typeof window !== 'undefined') {
    try {
      const events = JSON.parse(localStorage.getItem('pricing_events') || '[]');
      events.push(eventWithTimestamp);
      // Keep only last 100 events
      if (events.length > 100) {
        events.shift();
      }
      localStorage.setItem('pricing_events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to store pricing event:', error);
    }
  }
}

/**
 * Track pricing page view
 */
export function trackPricingPageView(variant?: string): void {
  trackPricingEvent({
    event: 'pricing_page_view',
    variant,
  });
}

/**
 * Track CTA button click
 */
export function trackPricingCTAClick(
  tier: PricingTier,
  source: 'card' | 'comparison_table' | 'modal' = 'card',
  variant?: string
): void {
  trackPricingEvent({
    event: 'pricing_cta_click',
    tier,
    source,
    variant,
  });
}

/**
 * Track upgrade modal shown
 */
export function trackUpgradeModalShown(variant?: string): void {
  trackPricingEvent({
    event: 'upgrade_modal_shown',
    variant,
  });
}

/**
 * Track upgrade modal interaction
 */
export function trackUpgradeModalClick(action: ModalAction, variant?: string): void {
  trackPricingEvent({
    event: 'upgrade_modal_click',
    action,
    variant,
  });
}

/**
 * Get all tracked events (for debugging)
 */
export function getPricingEvents(): PricingEventWithTimestamp[] {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(localStorage.getItem('pricing_events') || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear all tracked events
 */
export function clearPricingEvents(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pricing_events');
  }
}
