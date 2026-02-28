import { Message } from 'discord.js';
import { execFile as execFileCb } from 'child_process';
import { promisify } from 'util';

const execFile = promisify(execFileCb);

const CLAUDE_BIN = process.env.CLAUDE_BIN ?? 'claude';
const TIMEOUT_MS = 60_000;
const MAX_LENGTH = 2000;
const TRUNCATION_SUFFIX = '...(이하 생략)';

const sessions = new Map<string, string>(); // channelId → sessionId

interface ClaudeResult {
  text: string;
  sessionId: string;
}

async function askClaude(content: string, sessionId?: string): Promise<ClaudeResult> {
  const args = ['--print', '--output-format', 'json'];
  if (sessionId) {
    args.push('--resume', sessionId);
  }
  args.push(content);

  const { stdout } = await execFile(CLAUDE_BIN, args, { timeout: TIMEOUT_MS });

  const parsed = JSON.parse(stdout.trim());
  return {
    text: parsed.result as string,
    sessionId: parsed.session_id as string,
  };
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
  } catch (err) {
    console.error('Claude error:', err);
    await message.reply('⚠️ AI 응답 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}
