import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import type { TraefikOverview, TraefikRouter, TraefikService } from '../types.js';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json() as Promise<T>;
}

function statusIcon(status: string): string {
  if (status === 'enabled') return '🟢';
  if (status === 'warning') return '🟡';
  return '🔴';
}

export async function handleStatus(interaction: ChatInputCommandInteraction): Promise<void> {
  const base = process.env.TRAEFIK_API_URL;
  if (!base) {
    await interaction.reply({
      content: '⚠️ `TRAEFIK_API_URL` 환경 변수가 설정되지 않았습니다.',
      ephemeral: true,
    });
    return;
  }

  let overview: TraefikOverview;
  let routers: TraefikRouter[];
  let services: TraefikService[];

  try {
    [overview, routers, services] = await Promise.all([
      fetchJson<TraefikOverview>(`${base}/api/overview`),
      fetchJson<TraefikRouter[]>(`${base}/api/http/routers`),
      fetchJson<TraefikService[]>(`${base}/api/http/services`),
    ]);
  } catch (err) {
    await interaction.reply({
      content: `⚠️ Traefik API 호출 실패: \`${String(err)}\``,
      ephemeral: true,
    });
    return;
  }

  if (routers.length === 0) {
    await interaction.reply({ content: '라우터 정보가 없습니다.', ephemeral: true });
    return;
  }

  const serviceMap = new Map(services.map((s) => [s.name, s]));

  const dockerRouters = routers.filter((r) => r.provider === 'docker');
  const internalErrors = routers.filter((r) => r.provider !== 'docker' && r.status !== 'enabled');

  const { routers: ro, services: sv } = overview.http;
  const description =
    `**Routers** — total: ${ro.total}, warnings: ${ro.warnings}, errors: ${ro.errors}\n` +
    `**Services** — total: ${sv.total}, warnings: ${sv.warnings}, errors: ${sv.errors}`;

  const fields = dockerRouters.map((r) => {
    const svc = serviceMap.get(r.service);
    const backendLine = svc?.serverStatus
      ? 'Backend: ' +
        Object.values(svc.serverStatus)
          .map((s) => (s === 'UP' ? '🟢' : '🔴'))
          .join(' ')
      : '';
    return {
      name: `${statusIcon(r.status)} ${r.name}`,
      value: `\`${r.rule}\`` + (backendLine ? `\n${backendLine}` : ''),
      inline: false,
    };
  });

  if (internalErrors.length > 0) {
    fields.push({
      name: '⚠️ Internal Errors',
      value: internalErrors
        .map((r) => `🔴 **${r.name}**: ${r.error?.join(', ') ?? r.status}`)
        .join('\n'),
      inline: false,
    });
  }

  const color =
    ro.errors > 0 || sv.errors > 0 ? 0xed4245 :
    ro.warnings > 0 || sv.warnings > 0 ? 0xfee75c :
    0x57f287;

  const embed = new EmbedBuilder()
    .setTitle('Traefik Status')
    .setDescription(description)
    .addFields(fields)
    .setColor(color)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
