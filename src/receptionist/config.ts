import fs from 'fs';

export interface BusinessHours {
  // 0 = Sunday ... 6 = Saturday; "09:00-17:00", or null when closed
  [day: number]: string | null;
}

export interface ClientConfig {
  id: string;
  businessName: string;
  // Twilio number the client's customers call/text, E.164
  twilioNumber: string;
  // Real business line calls are forwarded to before the AI takes over
  forwardTo: string;
  // Owner's cell for summaries and human handoff alerts
  ownerPhone: string;
  timeZone: string;
  hours: BusinessHours;
  services: string[];
  faq: string;
  calcom: {
    eventTypeId: number;
  };
  missedCallText?: string;
}

export interface ClientDirectory {
  byTwilioNumber(number: string): ClientConfig | undefined;
  byId(id: string): ClientConfig | undefined;
  all(): ClientConfig[];
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits;
}

export function validateClientConfig(raw: unknown): ClientConfig {
  const c = raw as Partial<ClientConfig>;
  const required: (keyof ClientConfig)[] = [
    'id', 'businessName', 'twilioNumber', 'forwardTo', 'ownerPhone',
    'timeZone', 'hours', 'services', 'faq', 'calcom',
  ];
  for (const key of required) {
    if (c[key] === undefined || c[key] === null) {
      throw new Error(`Client config ${c.id ?? '(unknown)'} missing field: ${key}`);
    }
  }
  if (typeof c.calcom?.eventTypeId !== 'number') {
    throw new Error(`Client config ${c.id} needs calcom.eventTypeId`);
  }
  return {
    ...(c as ClientConfig),
    twilioNumber: normalizePhone(c.twilioNumber!),
    forwardTo: normalizePhone(c.forwardTo!),
    ownerPhone: normalizePhone(c.ownerPhone!),
  };
}

export function createClientDirectory(configs: unknown[]): ClientDirectory {
  const clients = configs.map(validateClientConfig);
  const byNumber = new Map<string, ClientConfig>();
  const byId = new Map<string, ClientConfig>();
  for (const client of clients) {
    if (byNumber.has(client.twilioNumber)) {
      throw new Error(`Duplicate twilioNumber: ${client.twilioNumber}`);
    }
    byNumber.set(client.twilioNumber, client);
    byId.set(client.id, client);
  }
  return {
    byTwilioNumber: (number) => byNumber.get(normalizePhone(number)),
    byId: (id) => byId.get(id),
    all: () => clients,
  };
}

export function loadClientDirectory(path: string): ClientDirectory {
  const raw = JSON.parse(fs.readFileSync(path, 'utf8'));
  if (!Array.isArray(raw)) {
    throw new Error(`${path} must contain a JSON array of client configs`);
  }
  return createClientDirectory(raw);
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function describeHours(hours: BusinessHours): string {
  return DAY_NAMES.map((name, i) => `${name}: ${hours[i] ?? 'closed'}`).join('\n');
}
