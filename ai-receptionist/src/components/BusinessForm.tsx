import type { Business } from '@/lib/types';
import { SubmitButton } from './SubmitButton';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix',
  'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Australia/Sydney',
];

interface Props {
  action: (form: FormData) => Promise<void>;
  business?: Business;
  isAdmin: boolean;
  error?: string;
  saved?: boolean;
}

export function BusinessForm({ action, business, isAdmin, error, saved }: Props) {
  const hours = business?.hours ?? { 1: '09:00-17:00', 2: '09:00-17:00', 3: '09:00-17:00', 4: '09:00-17:00', 5: '09:00-17:00' };
  return (
    <form action={action} className="space-y-8">
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {saved && <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">Saved.</p>}

      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">Business</h2>
        <Field label="Business name" name="name" defaultValue={business?.name} required />
        <div>
          <label className="label" htmlFor="time_zone">Time zone</label>
          <select id="time_zone" name="time_zone" className="input" defaultValue={business?.time_zone ?? 'America/New_York'}>
            {ZONES.map((z) => <option key={z}>{z}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="services">Services (one per line)</label>
          <textarea id="services" name="services" rows={4} className="input" defaultValue={business?.services.join('\n')} />
        </div>
        <div>
          <label className="label" htmlFor="faq">What the AI should know</label>
          <p className="mb-2 text-xs text-slate-500">Prices, address, parking, policies, common questions. The AI only states facts written here.</p>
          <textarea id="faq" name="faq" rows={8} className="input" defaultValue={business?.faq} />
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Hours and booking</h2>
        {DAYS.map((name, day) => {
          const range = hours[String(day)] ?? null;
          const [open, close] = range ? range.split('-') : ['09:00', '17:00'];
          return (
            <div key={day} className="flex flex-wrap items-center gap-3 text-sm">
              <span className="w-24">{name}</span>
              <input type="time" name={`hours_${day}_open`} defaultValue={open} className="input w-32" />
              <span>to</span>
              <input type="time" name={`hours_${day}_close`} defaultValue={close} className="input w-32" />
              <label className="flex items-center gap-1">
                <input type="checkbox" name={`hours_${day}_closed`} defaultChecked={!range} /> Closed
              </label>
            </div>
          );
        })}
        <Field label="Appointment length (minutes)" name="slot_minutes" type="number" defaultValue={String(business?.slot_minutes ?? 30)} />
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">Phones</h2>
        <Field label="Owner cell (gets handoff alerts)" name="owner_phone" defaultValue={business?.owner_phone ?? ''} placeholder="+15551234567" />
        {isAdmin && (
          <>
            <Field label="AI phone number (Twilio)" name="twilio_number" defaultValue={business?.twilio_number ?? ''} placeholder="+15551234567" />
            <Field label="Forward calls to (business line)" name="forward_to" defaultValue={business?.forward_to ?? ''} placeholder="+15551234567" />
          </>
        )}
        <div>
          <label className="label" htmlFor="missed_call_text">Missed-call text</label>
          <textarea id="missed_call_text" name="missed_call_text" rows={2} className="input" defaultValue={business?.missed_call_text ?? ''} placeholder="Leave blank for the default message" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="ai_enabled" defaultChecked={business?.ai_enabled ?? true} /> AI replies to texts
        </label>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">Branding</h2>
        <div>
          <label className="label" htmlFor="brand_color">Brand color</label>
          <input id="brand_color" type="color" name="brand_color" defaultValue={business?.brand_color ?? '#2563eb'} className="h-10 w-20" />
        </div>
        <Field label="Logo URL" name="logo_url" defaultValue={business?.logo_url ?? ''} placeholder="https://…" />
      </section>

      <SubmitButton>{business ? 'Save changes' : 'Create business'}</SubmitButton>
    </form>
  );
}

function Field(props: { label: string; name: string; defaultValue?: string; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="label" htmlFor={props.name}>{props.label}</label>
      <input
        id={props.name}
        name={props.name}
        type={props.type ?? 'text'}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        required={props.required}
        className="input"
      />
    </div>
  );
}
