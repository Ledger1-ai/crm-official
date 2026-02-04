import axios, { AxiosResponse } from "axios";

export default async function getGithubRepoStars(): Promise<number> {
  try {
    const url =
      process.env.NEXT_PUBLIC_GITHUB_REPO_API ||
      "https://api.github.com/repos/Ledger1-ai/crm-official";

    // Prefer server-side token if available; fall back to NEXT_PUBLIC for compatibility
    const token =
      process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;

    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
    };
    if (token) {
      // GitHub REST API v3 accepts Bearer tokens
      headers.Authorization = `Bearer ${token}`;
    }

    const response: AxiosResponse<any> = await axios.get(url, { headers });
    const data = response.data;
    const count =
      typeof data?.stargazers_count === "number" ? data.stargazers_count : 0;
    return count;
  } catch (error) {
    console.error("Error fetching repo stars:", error);
    return 0;
  }
}
