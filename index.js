const core = require("@actions/core");
const github = require("@actions/github");
const Anthropic = require("@anthropic-ai/sdk");

// 기존 코드와 동일

async function run() {
  try {
    // GitHub 토큰 가져오기
    const token = core.getInput("github-token");
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

    const anthropic = new Anthropic();
    // defaults to process.env["ANTHROPIC_API_KEY"]);

    // 리뷰 로직 추가 (예: ESLint로 검사 등)
    files.forEach(async (file) => {
      core.info(`Reviewing file: ${file.filename}`);

      const msg = async () => {
        const msg = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20240620", // 사용할 클로드 모델
          max_tokens: 1000, // 응답의 최대 토큰 수
          temperature: 0, // 응답의 무작위성
          system: `review: ${file.filename}`, // 시스템 메시지 설정
          messages: [
            {
              role: "user",
              content: [
                {
                  role: "system",
                  content:
                    "You are a senior developer. You review the code of junior developers. You review the code using Banksalad's pn rule.",
                },
                {
                  role: "user",
                  content: `Please review the following file and provide suggestions for improvement.\n\nFile Name: ${file.filename}\n\nFile Content:\n\n${file.content}`,
                },
                // {
                //   role: "assistant",
                //   content: "",
                // },
              ],
            },
          ],
        });
        return msg;
      };

      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: pullRequestNumber,
        body: `
      ### Code Review Completed
      
      **Reviewed Code:**
      
      \`\`\`${file.language}  // 언어 설정, 예: "javascript", "yaml" 등
      ${file.content}  // 바뀐 코드 내용
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
