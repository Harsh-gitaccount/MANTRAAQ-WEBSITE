// Courier partners and their tracking links. The admin can always paste the
// exact link from the courier instead; that link wins over these.

const normalise = (carrier) => (carrier || '').toLowerCase();

/**
 * Tracking page for a shipment number, or null when the courier has no
 * public link that takes the number (the customer then uses the portal).
 */
const getAutoTrackingUrl = (carrier, trackingNumber) => {
  const awb = encodeURIComponent((trackingNumber || '').trim());
  if (!awb) return null;
  const c = normalise(carrier);
  if (c.includes('amazon')) return `https://track.amazon.in/tracking/${awb}`;
  if (c.includes('delhivery')) return `https://www.delhivery.com/track/package/${awb}`;
  if (c.includes('bluedart') || c.includes('blue dart')) return `https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo=${awb}`;
  if (c.includes('shiprocket')) return `https://shiprocket.co/tracking/${awb}`;
  if (c.includes('xpressbees')) return `https://www.xpressbees.com/shipment/tracking?awbNo=${awb}`;
  if (c.includes('shadowfax')) return `https://tracker.shadowfax.in/#/track/${awb}`;
  return null;
};

/** Courier home or tracking page where the number can be typed in, or null. */
const getCarrierPortalUrl = (carrier) => {
  const c = normalise(carrier);
  if (c.includes('india post') || c.includes('speed post')) return 'https://www.indiapost.gov.in';
  if (c.includes('amazon')) return 'https://track.amazon.in';
  if (c.includes('delhivery')) return 'https://www.delhivery.com/tracking';
  if (c.includes('dtdc')) return 'https://www.dtdc.in/tracking.asp';
  if (c.includes('bluedart') || c.includes('blue dart')) return 'https://www.bluedart.com/tracking';
  if (c.includes('shiprocket')) return 'https://shiprocket.co/tracking';
  if (c.includes('xpressbees')) return 'https://www.xpressbees.com/shipment/tracking';
  if (c.includes('shadowfax')) return 'https://shadowfax.in';
  return null;
};

const getTrackingLabel = (carrier) => {
  const c = normalise(carrier);
  if (c.includes('bluedart') || c.includes('blue dart')) return 'Waybill Number';
  if (c.includes('dtdc') || c.includes('india post') || c.includes('speed post')) return 'Consignment Number';
  if (c.includes('amazon')) return 'Tracking ID';
  return 'Tracking Number';
};

/** Returns a safe http(s) URL, or null if the input is empty or not a web link. */
const cleanTrackingUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (!u.hostname.includes('.')) return null;
    return u.toString().slice(0, 500);
  } catch {
    return null;
  }
};

module.exports = { getAutoTrackingUrl, getCarrierPortalUrl, getTrackingLabel, cleanTrackingUrl };
