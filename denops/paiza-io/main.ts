import { Denops } from "https://deno.land/x/denops_std@v1.0.0-alpha.0/mod.ts";

const baseUrl = "https://api.paiza.io/";

async function paizaIO() {
}

async function create(
  sourceCode: string,
  language: string,
  input?: string,
  longpoll?: boolean,
  longpollTimeout?: number,
) {
  const url = baseUrl + "runners/create";
  const params = {
    source_code: sourceCode,
    language: language,
    input: input,
    longpoll: longpoll,
    longpoll_timeout: longpollTimeout,
  };
  const res = await fetch(url, {
    body: JSON.stringify(params),
    method: "POST",
  });
  return res;
}

async function getStatus(id: number) {
  const url = baseUrl + "runners/get_status";
  const res = await fetch(url, {
    body: JSON.stringify({ id: id }),
  });
  return res;
}

async function getDetails(id: number) {
  const url = baseUrl + "runners/get_details";
  const res = await fetch(url, {
    body: JSON.stringify({ id: id }),
  });
  return res;
}

export async function main(denops: Denops): Promise<void> {
}
