import twilio from 'twilio';

export interface SmsSender {
  send(from: string, to: string, body: string): Promise<void>;
}

export function createTwilioSender(accountSid: string, authToken: string): SmsSender {
  const client = twilio(accountSid, authToken);
  return {
    async send(from, to, body) {
      await client.messages.create({ from, to, body });
    },
  };
}
