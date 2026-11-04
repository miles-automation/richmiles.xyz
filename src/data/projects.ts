export type Project = {
  id: string
  title: string
  description: string
  url: string
  icon: string
}

export const projects: Project[] = [
  {
    id: 'slopticus',
    title: 'Slopticus',
    description:
      'A Mac and iPhone workspace for coding agents. Runs Claude Code and Codex sessions on your Mac and lets you pick them up from your phone over an end-to-end encrypted relay.',
    url: 'https://slopticus.com',
    icon: '/img/slopticus.png',
  },
  {
    id: 'sluice',
    title: 'Sluice',
    description:
      'An open-source MCP proxy. Loads tool results into DuckDB so agents query a table instead of reading the raw payload.',
    url: 'https://github.com/miles-automation/sluice',
    icon: '/img/project.svg',
  },
  {
    id: 'platform-ci',
    title: 'platform-ci',
    description:
      'On-demand CI/CD that replaced GitHub Actions for my apps: starts a build server from a snapshot, runs checks and production rollouts with health checks and automatic rollback, then shuts down.',
    url: 'https://github.com/miles-automation/platform-infra',
    icon: '/img/project.svg',
  },
  {
    id: 'human-index',
    title: 'Human Index',
    description: 'A local-first triage app that pulls email and messages into one morning digest.',
    url: 'https://humanindex.io',
    icon: '/img/human-index.svg',
  },
  {
    id: 'ieomd',
    title: 'In the Event of My Death',
    description:
      'Encrypted message vault that delivers letters, files and instructions to designated recipients.',
    url: 'https://ieomd.com',
    icon: '/img/ieomd.svg',
  },
  {
    id: 'spark-swarm',
    title: 'Spark Swarm',
    description: 'Task tracking, secrets and deploy history shared by me and my coding agents.',
    url: 'https://sparkswarm.com',
    icon: '/img/spark-swarm.svg',
  },
]
