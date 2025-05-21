import { $ } from "bun";
import assert from "node:assert";

interface FetchRepositoryInput {
  rootdir: string;
  apiUrl: string;
  token: string;
}

export async function fetchRepository(input: FetchRepositoryInput) {
  const res = await fetch(new URL("/repository-download", input.apiUrl), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  });
  if (!res.ok) {
    console.error(`[FetchRepository] ${res.statusText}`, await res.text());
    throw new Error(`Failed to fetch repository: ${res.statusText}`);
  }
  console.log("Repository fetched", {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
  });
  const fileName = parseFileName(res);
  await Bun.write(`${input.rootdir}/${fileName}`, res);
  await $.cwd(input.rootdir)`tar -xf ${fileName}`;
  return { repoRoot: fileName.replace(".tar.gz", "") };
}

function parseFileName(res: Response) {
  const contentDisposition = res.headers.get("content-disposition");
  const fileName = contentDisposition?.split("filename=")[1];
  assert(fileName, "No file name found");
  return fileName;
}
