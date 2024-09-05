const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
  try {
    // GitHub 토큰 가져오기
    const token = core.getInput("github-token");
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

    // 각 파일을 검사
    files.forEach((file) => {
      if (!file.filename.endsWith(".yaml")) {
        core.info(`Skipping non-JS file: ${file.filename}`);
        return;
      }

      // 여기에 코드 리뷰 로직 추가 (예: ESLint로 검사)
      // 이 예제에서는 간단히 파일명을 출력
      core.info(`Reviewing file: ${file.filename}`);
    });

    // 리뷰 결과에 따라 PR에 댓글 달기
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullRequestNumber,
      body: "Code review completed.",
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
