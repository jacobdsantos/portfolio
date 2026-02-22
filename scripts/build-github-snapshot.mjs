import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const USERNAME = 'jacobdsantos';
const OUTPUT_DIR = join(process.cwd(), 'src', 'data');
const OUTPUT_FILE = join(OUTPUT_DIR, 'github-activity.json');
const GITHUB_API = `https://api.github.com/users/${USERNAME}/events/public`;
const MAX_EVENTS = 30;

/**
 * Summarize a GitHub event into a human-readable string.
 */
function summarizeEvent(event) {
  const repo = event.repo?.name || 'unknown';

  switch (event.type) {
    case 'PushEvent': {
      const commits = event.payload?.commits;
      const count = commits?.length || event.payload?.size || 0;
      const message = commits?.[0]?.message || '';
      const truncated = message.length > 80 ? message.slice(0, 80) + '...' : message;
      return truncated ? `Pushed ${count} commit(s): ${truncated}` : `Pushed ${count} commit(s)`;
    }
    case 'CreateEvent': {
      const refType = event.payload?.ref_type || 'repository';
      const ref = event.payload?.ref || '';
      return ref ? `Created ${refType} "${ref}"` : `Created ${refType}`;
    }
    case 'DeleteEvent': {
      const refType = event.payload?.ref_type || 'branch';
      const ref = event.payload?.ref || '';
      return `Deleted ${refType} "${ref}"`;
    }
    case 'IssuesEvent': {
      const action = event.payload?.action || 'updated';
      const title = event.payload?.issue?.title || '';
      return `${action} issue: ${title}`;
    }
    case 'IssueCommentEvent': {
      const title = event.payload?.issue?.title || '';
      return `Commented on issue: ${title}`;
    }
    case 'PullRequestEvent': {
      const action = event.payload?.action || 'updated';
      const title = event.payload?.pull_request?.title || '';
      return `${action} PR: ${title}`;
    }
    case 'PullRequestReviewEvent': {
      const title = event.payload?.pull_request?.title || '';
      return `Reviewed PR: ${title}`;
    }
    case 'PullRequestReviewCommentEvent': {
      const title = event.payload?.pull_request?.title || '';
      return `Commented on PR review: ${title}`;
    }
    case 'WatchEvent':
      return `Starred ${repo}`;
    case 'ForkEvent': {
      const forkee = event.payload?.forkee?.full_name || '';
      return `Forked to ${forkee}`;
    }
    case 'ReleaseEvent': {
      const tag = event.payload?.release?.tag_name || '';
      return `Released ${tag}`;
    }
    case 'PublicEvent':
      return `Made ${repo} public`;
    default:
      return `${event.type.replace('Event', '')} activity`;
  }
}

/**
 * Get the URL for a GitHub event.
 */
function getEventUrl(event) {
  switch (event.type) {
    case 'PushEvent': {
      const sha = event.payload?.head;
      return sha ? `https://github.com/${event.repo?.name}/commit/${sha}` : `https://github.com/${event.repo?.name}`;
    }
    case 'IssuesEvent':
      return event.payload?.issue?.html_url || `https://github.com/${event.repo?.name}`;
    case 'IssueCommentEvent':
      return event.payload?.comment?.html_url || `https://github.com/${event.repo?.name}`;
    case 'PullRequestEvent':
      return event.payload?.pull_request?.html_url || `https://github.com/${event.repo?.name}`;
    case 'PullRequestReviewEvent':
    case 'PullRequestReviewCommentEvent':
      return event.payload?.pull_request?.html_url || `https://github.com/${event.repo?.name}`;
    case 'ReleaseEvent':
      return event.payload?.release?.html_url || `https://github.com/${event.repo?.name}`;
    case 'ForkEvent':
      return event.payload?.forkee?.html_url || `https://github.com/${event.repo?.name}`;
    default:
      return `https://github.com/${event.repo?.name}`;
  }
}

async function fetchGitHubEvents() {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'portfolio-build-script',
  };

  // Use GitHub token if available (avoids rate limits)
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${GITHUB_API}?per_page=${MAX_EVENTS}`, { headers });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function main() {
  console.log('=== Building GitHub Activity Snapshot ===\n');
  console.log(`  Fetching public events for: ${USERNAME}`);

  let rawEvents = [];

  try {
    rawEvents = await fetchGitHubEvents();
    console.log(`  Fetched ${rawEvents.length} event(s) from GitHub API`);
  } catch (error) {
    console.warn(`  WARNING: Failed to fetch GitHub events: ${error.message}`);
    console.warn('  Writing empty events array.');
  }

  const events = rawEvents.map((event) => ({
    type: event.type || 'Unknown',
    repo: event.repo?.name || 'unknown',
    createdAt: event.created_at || new Date().toISOString(),
    summary: summarizeEvent(event),
    url: getEventUrl(event),
  }));

  const output = {
    generatedAt: new Date().toISOString(),
    username: USERNAME,
    events,
  };

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n  Output: ${OUTPUT_FILE}`);
  console.log(`  Events: ${events.length}`);
  process.exit(0);
}

main();
