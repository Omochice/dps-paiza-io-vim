import { Denops } from "https://deno.land/x/denops_std@v1.0.0-beta.0/mod.ts";
import { execute } from "https://deno.land/x/denops_std@v1.0.0-beta.0/helper/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v1.0.0-beta.0/variable/mod.ts";
import { ensureNumber } from "https://deno.land/x/unknownutil@v0.1.1/mod.ts";

const baseUrl = "https://api.paiza.io/";

// async function paizaIO(
//   sourceCode: string | string[],
//   language: string,
//   input?: string,
//   longpoll?: boolean,
//   longpollTimeout?: number,
// ) {
//   let concated: string;
//   if (typeof sourceCode === "string") {
//     concated = sourceCode;
//   } else {
//     concated = sourceCode.join("\n");
//   }
//
//   const
// }
function filterUndefinded(
  obj: Record<string, unknown>,
): Record<string, string> {
  const asArray = Object.entries(obj);
  const filtered = asArray.filter(([_, value]) => typeof value !== "undefined")
    .map(([key, value]) => [key, String(value)]);
  return Object.fromEntries(filtered);
}
//
async function create(
  sourceCode: string,
  language: string,
  apiKey = "guest",
  input?: string,
  longpoll?: boolean,
  longpollTimeout?: number,
) {
  const params = {
    "source_code": sourceCode,
    "language": language,
    "input": input,
    "longpoll": longpoll,
    "longpoll_timeout": longpollTimeout,
    "api_key": apiKey,
  };
  const url = baseUrl + "runners/create" + "?" +
    new URLSearchParams(filterUndefinded(params));
  const res = await fetch(url, {
    // body: JSON.stringify(filterUndefinded(params)),
    // body: new URLSearchParams(filterUndefinded(params)),
    method: "POST",
  });
  return res.json();
}

async function getStatus(id: number, apiKey = "guest") {
  const url = baseUrl + "runners/get_status" + "?" +
    new URLSearchParams({ id: String(id), api_key: apiKey });
  const res = await fetch(url, {
    method: "GET",
  });
  return res.json();
}

async function getDetails(id: number, apiKey = "guest") {
  const url = baseUrl + "runners/get_details" + "?" +
    new URLSearchParams({ id: String(id), api_key: apiKey });
  const res = await fetch(url, {
    // body: JSON.stringify({ id: id }),
    method: "GET",
  });
  return res.json();
}

export async function main(denops: Denops): Promise<void> {
  denops.dispatcher = {
    async paizaIO(): Promise<void> {
      const lastLine = await denops.call("line", "$") as number;
      const lines = await denops.call("getline", 1, lastLine) as string[];
      const filetype = await denops.eval("&filetype") as string;
      const ftList: Record<string, string> = {
        c: "c",
        cpp: "cpp",
        objc: "objective-c",
        java: "java",
        kotlin: "kotlin",
        scala: "scala",
        swift: "swift",
        cs: "csharp",
        go: "go",
        haskell: "haskell",
        erlang: "erlang",
        perl: "perl",
        python: "python3",
        ruby: "ruby",
        php: "php",
        sh: "bash",
        r: "r",
        javascript: "javascript",
        coffeescript: "coffeescript",
        vb: "vb",
        cobol: "cobol",
        fsharp: "fsharp",
        d: "d",
        clojure: "clojure",
        elixir: "elixir",
        sql: "mysql",
        rust: "rust",
        scheme: "scheme",
        lisp: "commonlisp",
        nadesiko: "nadesiko", // I dont know filetype of nadesiko in vim.
        typescript: "typescript",
        plain: "plain", // show given text
      };
      const createStatus = await create(
        lines.join("\n"),
        ftList[filetype] || filetype,
      );
      console.log(createStatus);
      const runID = createStatus["id"];
      const content: string[] = await (async () => {
        while (true) {
          const runStatus = await getStatus(runID);
          console.log(runStatus);

          if (runStatus["status"] === "completed" || "error" in runStatus) {
            const details = await getDetails(createStatus["id"]);
            console.log(details);

            // build error
            if (details["build_result"] === "failure") {
              return details["build_stdout"].split("\n").concat(
                details["build_stderr"].split("\n"),
              );
            }

            const result = details["result"];
            if (result === "success" || result === "faulure") {
              // success execution
              // execution error
              const stdout = details["stdout"].split("\n");
              const stderr = details["stderr"].split("\n");
              return stdout.concat(stderr);
            } else {
              // syntax error etc
              return result.split("\n");
            }
          } else {
            // not complete yet
            Deno.sleepSync(1000);
          }
        }
      })();

      const winwidth =  await denops.eval("winwidth(0)");
      const winheight = await denops.eval("winheight(0)");
      ensureNumber(winwidth);
      ensureNumber(winheight);
      const opener = winwidth * 2 < winheight * 5 ? "split" : "vsplit";

      await execute(denops, `${opener} new`);
      await denops.call("setline", 1, content);
      await execute(
        denops,
        `
        setlocal bufhidden=wipe buftype=nofile
        setlocal nobackup noswapfile
        serlocal nomodified nomodifiable
        `,
      );

      return await Promise.resolve();
    },
  };
  await denops.cmd(
    `
    command! PaizaIO call denops#notify("${denops.name}", "paizaIO", [])
    `,
  );
}
