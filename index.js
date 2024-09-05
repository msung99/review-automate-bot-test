const core = require("@actions/core");
const github = require("@actions/github");
const Anthropic = require("@anthropic-ai/sdk");

// 기존 코드와 동일

async function run() {
  try {
    // GitHub 토큰 가져오기
    const token = core.getInput("github-token");
    const apiKey = core.getInput("api-key");
    console.log(`Token: ${token ? "Received" : "Not received"}`);
    const octokit = github.getOctokit(token);

    // PR 정보 가져오기
    const { context } = github;
    const pullRequestNumber = context.payload.pull_request.number;
    const repo = context.repo.repo;
    const owner = context.repo.owner;

    // PR의 변경된 파일 목록 가져오기
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pullRequestNumber,
    });

    // defaults to process.env["ANTHROPIC_API_KEY"]);
    const anthropic = new Anthropic({
      apiKey: apiKey, // 또는 실제 API 키를 여기에 입력
    });

    // 리뷰 로직 추가 (예: ESLint로 검사 등)
    files.forEach(async (file) => {
      core.info(`Reviewing file: ${file.filename}`);

      const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620", // 사용할 클로드 모델
        max_tokens: 1000, // 응답의 최대 토큰 수
        temperature: 0, // 응답의 무작위성
        system: `review: ${file.filename}`, // 시스템 메시지 설정
        messages: [
          {
            role: "user",
            type: "text",
            text: `Please review the following file and provide suggestions for improvement.\n\nFile Name: ${file.filename}\n\nFile Content:\n\n${file.content}`,
          },
        ],
      });

      core.info(msg);

      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: pullRequestNumber,
        body: `
      ### Code Review Completed
      
      **Reviewed Code:**
      
      \`\`\`${file.language || "plaintext"}
      ${file.content}
      \`\`\`
      
      **Review Feedback:**
      
      ${msg}  // 리뷰 피드백 내용
        `,
      });
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
