import { Message } from 'discord.js';
import { spawn } from 'child_process';

const CLAUDE_BIN = process.env.CLAUDE_BIN ?? 'claude';
const TIMEOUT_MS = 60_000;
const MAX_LENGTH = 2000;
const TRUNCATION_SUFFIX = '...(이하 생략)';

const sessions = new Map<string, string>(); // channelId → sessionId

interface ClaudeResult {
  text: string;
  sessionId: string;
}

function askClaude(content: string, sessionId?: string): Promise<ClaudeResult> {
  return new Promise((resolve, reject) => {
    const args = ['--print', '--output-format', 'json'];
    if (sessionId) args.push('--resume', sessionId);

    const child = spawn(CLAUDE_BIN, args, { timeout: TIMEOUT_MS });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`claude exited ${code}\nstderr: ${stderr}\nstdout: ${stdout}`));
      }

      const resultLine = stdout.trim().split('\n')
        .map((line) => { try { return JSON.parse(line); } catch { return null; } })
        .find((obj) => obj?.type === 'result');

      if (!resultLine) return reject(new Error(`Unexpected output: ${stdout.slice(0, 200)}`));

      resolve({ text: resultLine.result as string, sessionId: resultLine.session_id as string });
    });

    child.on('error', reject);

    child.stdin.write(content);
    child.stdin.end();
  });
}

export async function handleChatMessage(message: Message): Promise<void> {
  if (message.author.bot) return;
  if (!message.client.user) return;
  if (!message.mentions.has(message.client.user)) return;

  const content = message.content
    .replace(/<@!?\d+>/g, '')
    .trim();

  if (!content) return;

  await message.channel.sendTyping();

  try {
    const existingSessionId = sessions.get(message.channelId);
    const { text, sessionId } = await askClaude(content, existingSessionId);
    sessions.set(message.channelId, sessionId);

    const reply = text.length > MAX_LENGTH
      ? text.slice(0, MAX_LENGTH - TRUNCATION_SUFFIX.length) + TRUNCATION_SUFFIX
      : text;

    await message.reply(reply);
  } catch (err: any) {
    console.error('Claude error:', err?.message ?? err);
    await message.reply('⚠️ AI 응답 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}
