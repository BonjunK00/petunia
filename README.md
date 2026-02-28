# petunia

discord.js v14 기반 TypeScript Discord 봇.

## 실행 순서

1. `.env` 파일 생성
   ```bash
   cp .env.example .env
   ```

2. `.env` 값 채우기 ([Discord Developer Portal](https://discord.com/developers/applications)에서 발급)

   | 변수 | 설명 |
   |---|---|
   | `DISCORD_TOKEN` | 봇 토큰 |
   | `DISCORD_APP_ID` | 애플리케이션 ID |
   | `DISCORD_GUILD_ID` | 커맨드를 등록할 길드(서버) ID |
   | `ALLOWED_GUILD_IDS` | 봇이 응답할 길드 ID 목록 (콤마 구분, 비워두면 모든 길드 허용) |

3. 의존성 설치
   ```bash
   npm install
   ```

4. 슬래시 커맨드 등록 (길드 단위, 즉시 반영)
   ```bash
   npm run register
   # Commands registered successfully.
   ```

5. 봇 실행
   ```bash
   npm run dev
   # Ready! Logged in as petunia#1234
   ```

## 커맨드

| 커맨드 | 설명 |
|---|---|
| `/status` | 서비스 상태 조회 (ephemeral) |
