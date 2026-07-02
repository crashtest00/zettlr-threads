import { app, shell } from 'electron'
import path from 'path'
import type LogProvider from '@providers/log'

export async function openClaudeCoworkSetup (logger: LogProvider): Promise<void> {
  const target = app.isPackaged
    ? path.join(process.resourcesPath, 'claude', 'CLAUDE.md')
    : path.join(__dirname, '../../resources/claude/CLAUDE.md')

  const potentialError = await shell.openPath(target)
  if (potentialError !== '') {
    logger.error(`[Menu Provider] Cannot open Claude Cowork setup: ${target}`, potentialError)
  }
}
