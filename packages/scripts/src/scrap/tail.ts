const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!ACCOUNT_ID) {
  throw new Error("CLOUDFLARE_ACCOUNT_ID is not set");
}
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
if (!CLOUDFLARE_API_TOKEN) {
  throw new Error("CLOUDFLARE_API_TOKEN is not set");
}

interface CloudflareResponse<T> {
  success: boolean;
  errors?: {
    code: string;
    message: string;
  }[];
  messages?: unknown[];
  result: T;
}

async function cfFetch<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`https://api.cloudflare.com/client/v4/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
    },
  });
  const data = (await response.json()) as CloudflareResponse<T>;
  if (!response.ok || !data.success) {
    throw new Error(
      `Failed to fetch ${path} (${response.status}): ${data.errors?.map((e) => e.message).join(", ")}`
    );
  }
  return data.result;
}

const tail = async (scriptName: string) => {
  return cfFetch<{
    id: string;
    url: string;
    expires_at: string;
  }>(`accounts/${ACCOUNT_ID}/workers/scripts/${scriptName}/tails`, {
    method: "POST",
  });
};

const test = await tail("api");
console.log(test);
const ws = new WebSocket(test.url, {
  headers: {
    "sec-websocket-protocol": "trace-v1",
  },
});
ws.onopen = () => {
  console.log("open");
};
ws.onmessage = (event) => {
  const data = JSON.parse(new TextDecoder().decode(event.data));
  console.log(data);
};
ws.onerror = (event) => {
  console.error(event);
};
ws.onclose = (event) => {
  console.log("closed");
};
