import { Denops } from "https://deno.land/x/denops_std@v3.3.0/mod.ts";
import { execute } from "https://deno.land/x/denops_std@v3.3.0/helper/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.3.0/variable/mod.ts";
import {
  ensureArray,
  ensureNumber,
  ensureString,
  isNumber,
  isString,
} from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";

const baseUrl = "https://api.paiza.io/";
const config = {
  "bufname": "paizaIO://output",
  "filetype": "paizaIO",
};

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
    method: "GET",
  });
  return res.json();
}

function getLanguageName(filetype: string, isPython2 = false): string {
  if (isPython2 && filetype === "python") {
    return "Python2";
  } else {
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
    return ftList[filetype] || filetype;
  }
}

export function main(denops: Denops): void {
  denops.dispatcher = {
    async paizaIO(): Promise<void> {
      const currentWinId = denops.call("win_getid");
      const lastLine = await denops.call("line", "$");
      ensureNumber(lastLine);
      const lines = await denops.call("getline", 1, lastLine);
      const filetype = await denops.eval("&filetype");
      const winwidth = await denops.call("winwidth", 0);
      const winheight = await denops.call("winheight", 0);
      ensureNumber(winwidth);
      ensureNumber(winheight);
      const opener = winwidth * 2 < winheight * 5 ? "split" : "vsplit";

      ensureArray(lines, isString);
      ensureString(filetype);
      const createStatus = await create(
        lines.join("\n"),
        getLanguageName(
          filetype,
          await vars.g.get(denops, "paiza_io_python_is_two", false) as boolean,
        ),
      );
      const runID = createStatus["id"];
      let content: string[];

      while (true) {
        const runStatus = await getStatus(runID);

        if (runStatus["status"] === "completed" || "error" in runStatus) {
          const details = await getDetails(createStatus["id"]);

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
            content = stdout.concat(stderr);
            break;
          } else {
            // syntax error etc
            content = result.split("\n");
            break;
          }
        } else {
          // not complete yet
          Deno.sleepSync(1000);
        }
      }

      let paizaBufnr: number;

      const bufExist = await denops.call("bufexists", config["bufname"]);
      if (bufExist) {
        // detect existing buffer
        paizaBufnr = await denops.call(
          "bufnr",
          `^${config["bufname"]}$`,
        ) as number;
        const wins = await denops.call("win_findbuf", paizaBufnr);
        const tabnr = await denops.call("tabpagenr");
        ensureArray(wins, isNumber);
        ensureNumber(tabnr);
        const ww = (await denops.call(
          "map",
          wins,
          "win_id2tabwin(v:val)",
        ) as number[][]).filter((nr) => nr[0] == tabnr);

        if (ww.length == 0) {
          // if not exist (but exist it on buffer), open it as window
          await execute(denops, `${opener} ${config["bufname"]}`);
        } else {
          // if exist, move its window
          await execute(denops, `${ww[0][1]} wincmd w`);
        }
      } else {
        // if not exist, open it
        await execute(denops, `${opener} ${config["bufname"]}`);
        await execute(
          denops,
          `
          setlocal bufhidden=hide buftype=nofile
          setlocal noswapfile nobuflisted
          setlocal nomodified
          setlocal fileformat=unix
          `,
        );
        paizaBufnr = await denops.call("bufnr", "%") as number;
        // opened = true;
      }

      if (await denops.eval("&filetype") as string !== config["filetype"]) {
        await execute(denops, `setlocal filetype=${config["filetype"]}`);
      }

      // delete exist content and write new content
      await denops.call("deletebufline", paizaBufnr, 1, "$");
      await denops.call("setbufline", paizaBufnr, "$", content);

      // return original window
      const originWinnr = await denops.call(
        "win_id2win",
        await currentWinId as number,
      );
      ensureNumber(originWinnr);
      await execute(denops, `${originWinnr}wincmd w`);

      return await Promise.resolve();
    },
  };
}
