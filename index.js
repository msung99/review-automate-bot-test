const core = require("@actions/core");
const github = require("@actions/github");
const { reviewFileWithCloudAPI } = require("./review");

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

    // 리뷰 로직 추가 (예: ESLint로 검사 등)
    files.forEach(async (file) => {
      const result = await reviewFileWithCloudAPI(file);
      core.info(`Reviewing file: ${file.filename}`);

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
      
      ${result}  // 리뷰 피드백 내용
        `,
      });
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
