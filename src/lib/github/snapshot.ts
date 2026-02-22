/**
 * Build-time GitHub activity snapshot fetcher.
 * Fetches recent public events for the configured user.
 * Run via scripts/build-github-snapshot.mjs during CI or local build.
 */

export interface GitHubEvent {
  type: string;
  repo: string;
  createdAt: string;
  summary: string;
  url: string;
}

export interface GitHubSnapshot {
  generatedAt: string;
  username: string;
  events: GitHubEvent[];
}

const USERNAME = 'jacobdsantos';
const API_URL = `https://api.github.com/users/${USERNAME}/events/public?per_page=10`;

function summarizeEvent(event: any): string {
  switch (event.type) {
    case 'PushEvent': {
      const count = event.payload?.commits?.length ?? 0;
      const branch = event.payload?.ref?.replace('refs/heads/', '') ?? 'unknown';
      return `Pushed ${count} commit${count !== 1 ? 's' : ''} to ${branch}`;
    }
    case 'CreateEvent':
      return `Created ${event.payload?.ref_type ?? 'repository'}${event.payload?.ref ? ` ${event.payload.ref}` : ''}`;
    case 'PullRequestEvent':
      return `${event.payload?.action ?? 'Updated'} pull request #${event.payload?.pull_request?.number ?? '?'}`;
    case 'IssuesEvent':
      return `${event.payload?.action ?? 'Updated'} issue #${event.payload?.issue?.number ?? '?'}`;
    case 'WatchEvent':
      return `Starred ${event.repo?.name ?? 'a repository'}`;
    case 'ForkEvent':
      return `Forked ${event.repo?.name ?? 'a repository'}`;
    case 'ReleaseEvent':
      return `Published release ${event.payload?.release?.tag_name ?? ''}`;
    default:
      return `${event.type.replace('Event', '')} on ${event.repo?.name ?? 'unknown'}`;
  }
}

export async function fetchGitHubSnapshot(): Promise<GitHubSnapshot> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'portfolio-build-script',
    };

    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(API_URL, { headers });

    if (!response.ok) {
      console.warn(`GitHub API returned ${response.status}: ${response.statusText}`);
      return {
        generatedAt: new Date().toISOString(),
        username: USERNAME,
        events: [],
      };
    }

    const rawEvents = await response.json();

    const events: GitHubEvent[] = rawEvents.map((event: any) => ({
      type: event.type,
      repo: event.repo?.name ?? 'unknown',
      createdAt: event.created_at,
      summary: summarizeEvent(event),
      url: `https://github.com/${event.repo?.name ?? ''}`,
    }));

    return {
      generatedAt: new Date().toISOString(),
      username: USERNAME,
      events,
    };
  } catch (error) {
    console.warn('Failed to fetch GitHub events:', error);
    return {
      generatedAt: new Date().toISOString(),
      username: USERNAME,
      events: [],
    };
  }
}
