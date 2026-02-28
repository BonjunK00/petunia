import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import type { TraefikRouter } from '../types.js';

function routerIcon(status: string): string {
  if (status === 'enabled') return '🟢';
  if (status === 'warning') return '🟡';
  return '🔴';
}

export async function handleStatus(interaction: ChatInputCommandInteraction): Promise<void> {
  const url = process.env.TRAEFIK_API_URL;
  if (!url) {
    await interaction.reply({
      content: '⚠️ `TRAEFIK_API_URL` 환경 변수가 설정되지 않았습니다.',
      ephemeral: true,
    });
    return;
  }

  let routers: TraefikRouter[];
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    routers = (await res.json()) as TraefikRouter[];
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

  const lines = routers.map(
    (r) => `${routerIcon(r.status)} **${r.name}** — ${r.status}\n　\`${r.rule}\``
  );

  const allUp = routers.every((r) => r.status === 'enabled');
  const embed = new EmbedBuilder()
    .setTitle('Traefik Router Status')
    .setDescription(lines.join('\n'))
    .setColor(allUp ? 0x57f287 : 0xed4245)
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
