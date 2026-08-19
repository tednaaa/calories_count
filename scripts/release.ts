import { execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { cancel, confirm, intro, isCancel, log, note, outro, select } from '@clack/prompts';
import { versionBump } from 'bumpp';

const FIELD_SEP = '\x1F';
const RECORD_SEP = '\x1E';
const VERSION_PATH = 'package.json';
const CHANGELOG_PATH = 'CHANGELOG.md';
const CHANGELOG_HEADER = '# Changelog\n\n';
const RELEASE_COMMIT_PATTERN = '^chore: release';
const RELEASE_COMMIT_MESSAGE = 'chore: release v';
const RELEASE_FILES = [VERSION_PATH, CHANGELOG_PATH];
const TAG_PREFIX = 'v';

interface Commit {
  sha: string;
  subject: string;
  body: string;
}

interface Snapshot {
  path: string;
  content: string | null;
}

type Version = `${number}.${number}.${number}`;

function run(command: string): string {
  return execSync(command, { encoding: 'utf8' }).trim();
}

function tryRun(command: string): string {
  try {
    return run(command);
  }
  catch {
    return '';
  }
}

function resolvePreviousTag(): string {
  return tryRun('git describe --tags --abbrev=0 --match "v[0-9]*.[0-9]*.[0-9]*"');
}

function resolveCommitRange(previousTag: string): string {
  return previousTag ? `${previousTag}..HEAD` : 'HEAD';
}

function resolveWebUrl(): string {
  const remote = run('git config --get remote.origin.url');
  return remote
    .replace(/^ssh:\/\/git@([^:/]+)(?::\d+)?\//, 'https://$1/')
    .replace(/^git@([^:]+):/, 'https://$1/')
    .replace(/\.git$/, '')
    .replace(/\/$/, '');
}

function collectCommits(range: string): Commit[] {
  const format = `%H${FIELD_SEP}%s${FIELD_SEP}%b${RECORD_SEP}`;
  const raw = run(
    `git log ${range} --no-merges --invert-grep --grep="${RELEASE_COMMIT_PATTERN}" --pretty=format:"${format}"`,
  );

  return raw
    .split(RECORD_SEP)
    .map(record => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [sha, subject, body = ''] = record.split(FIELD_SEP);
      return { sha, subject: subject.trim(), body };
    });
}

function isTrailerLine(line: string): boolean {
  return /^[A-Z-]+:\s/i.test(line);
}

function formatDescription(body: string): string {
  return body
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !isTrailerLine(line))
    .join('\n');
}

function formatCommit(commit: Commit, webUrl: string): string {
  const shortSha = commit.sha.slice(0, 8);
  const heading = `- ${commit.subject} [\`${shortSha}\`](${webUrl}/commit/${commit.sha})`;
  const description = formatDescription(commit.body);
  if (!description)
    return heading;
  const indented = description
    .split('\n')
    .map(line => `  ${line}`)
    .join('\n\n');
  return `${heading}\n\n${indented}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildSection(version: string, commits: Commit[], webUrl: string): string {
  const entries = commits.map(commit => formatCommit(commit, webUrl)).join('\n');
  return `## v${version} (${today()})\n\n${entries}\n`;
}

function dropSection(body: string, version: string): string {
  return body
    .split(/(?=^## v)/m)
    .filter(section => !section.startsWith(`## v${version} `))
    .join('');
}

function readExistingBody(): string {
  if (!existsSync(CHANGELOG_PATH))
    return '';
  return readFileSync(CHANGELOG_PATH, 'utf8').replace(/^# Changelog\n+/, '');
}

function writeChangelog(version: string, section: string): void {
  const body = dropSection(readExistingBody(), version);
  writeFileSync(CHANGELOG_PATH, `${CHANGELOG_HEADER + section}\n${body}`);
}

function stageChangelog(): void {
  run(`git add ${CHANGELOG_PATH}`);
}

function generateChangelog(version: string): void {
  const previousTag = resolvePreviousTag();
  const range = resolveCommitRange(previousTag);
  const webUrl = resolveWebUrl();
  const commits = collectCommits(range);

  writeChangelog(version, buildSection(version, commits, webUrl));
  stageChangelog();

  log.step(`Changelog updated for v${version} (${commits.length} entries).`);
}

function snapshotReleaseFiles(): Snapshot[] {
  return RELEASE_FILES.map(path => ({
    path,
    content: existsSync(path) ? readFileSync(path, 'utf8') : null,
  }));
}

function restoreReleaseFiles(snapshots: Snapshot[]): void {
  for (const { path, content } of snapshots) {
    tryRun(`git reset --quiet -- ${path}`);
    if (content === null) {
      rmSync(path, { force: true });
      continue;
    }
    writeFileSync(path, content);
  }
}

function isChangelogDirty(): boolean {
  return Boolean(run(`git status --porcelain -- ${CHANGELOG_PATH}`));
}

function amendChangelog(): void {
  stageChangelog();
  run('git commit --amend --no-edit');
}

function tagRelease(version: string): void {
  run(`git tag --annotate ${TAG_PREFIX}${version} --message "${RELEASE_COMMIT_MESSAGE}${version}"`);
}

function pushRelease(): void {
  run('git push --follow-tags');
}

function abort(hint?: string): never {
  cancel(hint ? `Release cancelled. ${hint}` : 'Release cancelled.');
  process.exit(0);
}

function readCurrentVersion(): string {
  const pkg = JSON.parse(readFileSync(VERSION_PATH, 'utf8')) as { version: string };
  return pkg.version;
}

function bumpVersion(current: string, kind: 'major' | 'minor' | 'patch'): Version {
  const [major, minor, patch] = current.split('.').map(Number);
  if (kind === 'major')
    return `${major + 1}.0.0`;
  if (kind === 'minor')
    return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

async function pickVersion(): Promise<Version> {
  const current = readCurrentVersion();
  const selected = await select({
    message: `Select release version (current ${current})`,
    options: [
      { value: bumpVersion(current, 'patch'), label: `patch → ${bumpVersion(current, 'patch')}` },
      { value: bumpVersion(current, 'minor'), label: `minor → ${bumpVersion(current, 'minor')}` },
      { value: bumpVersion(current, 'major'), label: `major → ${bumpVersion(current, 'major')}` },
    ],
  });

  if (isCancel(selected))
    abort();
  return selected;
}

async function confirmRelease(version: string): Promise<void> {
  const proceed = await confirm({
    message: `Bump to v${version}, update changelog and create the release commit?`,
  });
  if (isCancel(proceed) || !proceed)
    abort();
}

async function commitRelease(version: Version): Promise<void> {
  const snapshots = snapshotReleaseFiles();

  try {
    await versionBump({
      release: version,
      all: true,
      commit: RELEASE_COMMIT_MESSAGE,
      tag: false,
      push: false,
      confirm: false,
      execute: operation => generateChangelog(operation.state.newVersion),
    });
  }
  catch (error) {
    restoreReleaseFiles(snapshots);
    log.warn(`Restored ${RELEASE_FILES.join(' and ')} — no version bump, no changelog.`);
    throw error;
  }
}

async function reviewChangelog(version: string): Promise<void> {
  note(
    `Review ${CHANGELOG_PATH} and edit it if needed.\nUnstaged edits are amended into the release commit,\nor amend it yourself before continuing.`,
    `Release commit for v${version} is local only`,
  );

  const proceed = await confirm({ message: 'Changelog looks good — tag and push?' });
  if (isCancel(proceed) || !proceed)
    abort('Nothing was tagged or pushed. Undo the commit with: git reset --soft HEAD~1');
}

function applyChangelogEdits(): void {
  if (!isChangelogDirty()) {
    log.step('No pending changelog edits.');
    return;
  }
  amendChangelog();
  log.success('Amended changelog edits into the release commit.');
}

async function release(): Promise<void> {
  intro('calories-count release');

  const version = await pickVersion();
  await confirmRelease(version);

  await commitRelease(version);
  await reviewChangelog(version);
  applyChangelogEdits();

  tagRelease(version);
  log.step(`Tagged ${TAG_PREFIX}${version}.`);

  pushRelease();
  outro(`Released v${version}.`);
}

release().catch((error: unknown) => {
  cancel(`Release failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
