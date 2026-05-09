export type Project = {
  id: string
  title: string
  description: string
  domain: string | null
  stage: string
  health: string
  last_deploy_at: string | null
  category: string | null
  icon: string
}

/** Map spark slug to local icon path */
const ICONS: Record<string, string> = {
  'spark-swarm': '/img/spark-swarm.svg',
  ieomd: '/img/ieomd.svg',
  'human-index': '/img/human-index.svg',
  noodle: '/img/noodle.svg',
  'code-loom': '/img/code-loom.svg',
  'edventure-trek': '/img/edventure-trek.png',
}

const FALLBACK: Project[] = [
  {
    id: 'spark-swarm',
    title: 'Spark Swarm',
    description:
      'Dashboard for managing projects, secrets, deployments, and fleet health across a multi-service platform.',
    domain: 'sparkswarm.com',
    stage: 'building',
    health: 'healthy',
    last_deploy_at: null,
    category: 'infrastructure',
    icon: '/img/spark-swarm.svg',
  },
  {
    id: 'ieomd',
    title: 'In the Event of My Death',
    description:
      'Encrypted message vault that delivers letters, files, and instructions to designated recipients.',
    domain: 'ieomd.com',
    stage: 'live',
    health: 'healthy',
    last_deploy_at: null,
    category: 'security',
    icon: '/img/ieomd.svg',
  },
  {
    id: 'human-index',
    title: 'Human Index',
    description:
      'Personal knowledge base that captures and indexes information with semantic search and personality modeling.',
    domain: 'humanindex.io',
    stage: 'building',
    health: 'unknown',
    last_deploy_at: null,
    category: 'productivity',
    icon: '/img/human-index.svg',
  },
  {
    id: 'noodle',
    title: 'Noodle',
    description:
      'Rate and track noodle bars with photo reviews, personal rankings, and location-based discovery.',
    domain: 'callofthenoodle.com',
    stage: 'live',
    health: 'needs_love',
    last_deploy_at: null,
    category: 'social',
    icon: '/img/noodle.svg',
  },
]

export function resolveIcon(project: Project): string {
  return ICONS[project.id] ?? '/img/spark-swarm.svg'
}

export async function fetchProjects(): Promise<Project[]> {
  try {
    const resp = await fetch('/api/v1/projects')
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    const projects: Project[] = data.projects ?? []
    return projects.map((p) => ({ ...p, icon: ICONS[p.id] ?? '/img/spark-swarm.svg' }))
  } catch {
    return FALLBACK
  }
}
