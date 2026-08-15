import { afterEach, describe, expect, it } from "vitest";

import { pluggyWebhookUrl } from "@/server/services/pluggyClient";

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const originalWebhookSecret = process.env.PLUGGY_WEBHOOK_SECRET;

function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

afterEach(() => {
  restore("NEXT_PUBLIC_APP_URL", originalAppUrl);
  restore("PLUGGY_WEBHOOK_SECRET", originalWebhookSecret);
});

describe("Pluggy webhook URL", () => {
  it("gera uma URL HTTPS assinada para eventos manuais e automáticos", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://nexus.example/";
    process.env.PLUGGY_WEBHOOK_SECRET = "segredo com espaços";

    expect(pluggyWebhookUrl()).toBe(
      "https://nexus.example/api/pluggy/webhook?token=segredo+com+espa%C3%A7os"
    );
  });

  it("não expõe webhook sem origem HTTPS e segredo", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.PLUGGY_WEBHOOK_SECRET = "segredo";
    expect(pluggyWebhookUrl()).toBeUndefined();

    process.env.NEXT_PUBLIC_APP_URL = "https://nexus.example";
    delete process.env.PLUGGY_WEBHOOK_SECRET;
    expect(pluggyWebhookUrl()).toBeUndefined();
  });
});
